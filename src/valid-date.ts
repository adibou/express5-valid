import ArgError, { type ErrorParams } from "./arg-error";

export default class ValidDate<T = Date | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: Date | undefined;
    private _min: Date | undefined;
    private _max: Date | undefined;
    private _isPast = false;
    private _isFuture = false;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidDate<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidDate<Exclude<T, undefined>>;
    }

    get nullable(): ValidDate<T | null> {
        this._isNullable = true;
        return this as unknown as ValidDate<T | null>;
    }

    default(v: Date): ValidDate<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidDate<Exclude<T, undefined>>;
    }

    min(date: Date): this {
        this._min = date;
        return this;
    }

    max(date: Date): this {
        this._max = date;
        return this;
    }

    get past(): this {
        this._isPast = true;
        return this;
    }

    get future(): this {
        this._isFuture = true;
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

        // Parse date
        let date: Date;
        if (val instanceof Date) {
            date = val;
        } else if (typeof val === 'string' || typeof val === 'number') {
            date = new Date(val);
        } else {
            this.error('INVALID_TYPE', 'must be a date', { expected: 'date' });
        }

        if (isNaN(date.getTime())) {
            this.error('INVALID_DATE', 'must be a valid date');
        }

        const now = new Date();

        // Validations
        if (this._isPast && date >= now) {
            this.error('DATE_NOT_PAST', 'must be in the past');
        }

        if (this._isFuture && date <= now) {
            this.error('DATE_NOT_FUTURE', 'must be in the future');
        }

        if (this._min !== undefined && date < this._min) {
            this.error('DATE_MIN', `must be after ${this._min.toISOString()}`, { min: this._min.toISOString() });
        }

        if (this._max !== undefined && date > this._max) {
            this.error('DATE_MAX', `must be before ${this._max.toISOString()}`, { max: this._max.toISOString() });
        }

        return date as T;
    }
}
