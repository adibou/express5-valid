import ArgError, { type ErrorParams } from "./arg-error";

export default class ValidNumber<T = number | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: number | undefined;
    private _min: number | undefined;
    private _max: number | undefined;
    private _isInteger = false;
    private _isPositive = false;
    private _isNegative = false;
    private _oneOf: number[] | undefined;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidNumber<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidNumber<Exclude<T, undefined>>;
    }

    get nullable(): ValidNumber<T | null> {
        this._isNullable = true;
        return this as unknown as ValidNumber<T | null>;
    }

    default(v: number): ValidNumber<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidNumber<Exclude<T, undefined>>;
    }

    min(n: number): this {
        this._min = n;
        return this;
    }

    max(n: number): this {
        this._max = n;
        return this;
    }

    get integer(): this {
        this._isInteger = true;
        return this;
    }

    get positive(): this {
        this._isPositive = true;
        return this;
    }

    get negative(): this {
        this._isNegative = true;
        return this;
    }

    between(min: number, max: number): this {
        this._min = min;
        this._max = max;
        return this;
    }

    oneOf(values: number[]): this {
        this._oneOf = values;
        return this;
    }

    get value(): T {
        let val = this._value;

        // Apply default if undefined
        if (val === undefined && this._default !== undefined) {
            val = this._default;
        }

        // Check undefined
        if (val === undefined) {
            if (this._isRequired) {
                this.error('REQUIRED', 'is required');
            }
            return undefined as T;
        }

        // Check null
        if (val === null) {
            if (!this._isNullable) {
                this.error('NOT_NULLABLE', 'cannot be null');
            }
            return null as T;
        }

        // Parse number
        let num: number;
        if (typeof val === 'number') {
            num = val;
        } else if (typeof val === 'string') {
            num = parseFloat(val);
        } else {
            this.error('INVALID_TYPE', 'must be a number', { expected: 'number' });
        }

        if (isNaN(num)) {
            this.error('INVALID_NUMBER', 'must be a valid number');
        }

        // Validations
        if (this._isInteger && !Number.isInteger(num)) {
            this.error('NOT_INTEGER', 'must be an integer');
        }

        if (this._isPositive && num <= 0) {
            this.error('NOT_POSITIVE', 'must be positive');
        }

        if (this._isNegative && num >= 0) {
            this.error('NOT_NEGATIVE', 'must be negative');
        }

        if (this._min !== undefined && num < this._min) {
            this.error('MIN_VALUE', `must be at least ${this._min}`, { min: this._min });
        }

        if (this._max !== undefined && num > this._max) {
            this.error('MAX_VALUE', `must be at most ${this._max}`, { max: this._max });
        }

        if (this._oneOf !== undefined && !this._oneOf.includes(num)) {
            this.error('NOT_IN_LIST', `must be one of: ${this._oneOf.join(', ')}`, { allowed: this._oneOf });
        }

        return num as T;
    }
}
