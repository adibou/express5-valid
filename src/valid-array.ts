import ArgError, { type ErrorParams } from "./arg-error";
import type { NumberArrayConfig, StringArrayConfig } from "./types";

export type ObjectArrayValidator<T> = (obj: Record<string, unknown>, index: number) => T;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

type ArrayNullability<T, N> = N extends undefined
    ? T[] | undefined
    : N extends null
        ? T[] | null
        : T[];

export default class ValidArray<T = unknown, N = T[] | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: unknown[] | undefined;
    private _minLength: number | undefined;
    private _maxLength: number | undefined;
    private _elementValidator: ((val: unknown, index: number) => unknown) | undefined;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    private elementError(code: string, details: string, index: number, params: ErrorParams = {}): never {
        throw new ArgError(
            `${this._name}`,
            'ARRAY_ELEMENT',
            `element at index ${index} ${details}`,
            { index, code, ...params }
        );
    }

    get required(): ValidArray<T, Exclude<N, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidArray<T, Exclude<N, undefined>>;
    }

    get nullable(): ValidArray<T, N | null> {
        this._isNullable = true;
        return this as unknown as ValidArray<T, N | null>;
    }

    default(v: T[]): ValidArray<T, Exclude<N, undefined>> {
        this._default = v;
        return this as unknown as ValidArray<T, Exclude<N, undefined>>;
    }

    minLength(n: number): this {
        this._minLength = n;
        return this;
    }

    maxLength(n: number): this {
        this._maxLength = n;
        return this;
    }

    ofNumbers(config?: NumberArrayConfig): ValidArray<number, ArrayNullability<number, N>> {
        this._elementValidator = (val: unknown, index: number) => {
            let num: number;
            if (typeof val === 'number') {
                num = val;
            } else if (typeof val === 'string') {
                num = parseFloat(val);
            } else {
                this.elementError('INVALID_TYPE', 'must be a number', index, { expected: 'number' });
            }

            if (isNaN(num)) {
                this.elementError('INVALID_NUMBER', 'must be a valid number', index);
            }

            if (config) {
                if (config.integer && !Number.isInteger(num)) {
                    this.elementError('NOT_INTEGER', 'must be an integer', index);
                }
                if (config.positive && num <= 0) {
                    this.elementError('NOT_POSITIVE', 'must be positive', index);
                }
                if (config.negative && num >= 0) {
                    this.elementError('NOT_NEGATIVE', 'must be negative', index);
                }
                if (config.min !== undefined && num < config.min) {
                    this.elementError('MIN_VALUE', `must be at least ${config.min}`, index, { min: config.min });
                }
                if (config.max !== undefined && num > config.max) {
                    this.elementError('MAX_VALUE', `must be at most ${config.max}`, index, { max: config.max });
                }
            }

            return num;
        };
        return this as unknown as ValidArray<number, ArrayNullability<number, N>>;
    }

    ofStrings(config?: StringArrayConfig): ValidArray<string, ArrayNullability<string, N>> {
        this._elementValidator = (val: unknown, index: number) => {
            if (typeof val !== 'string') {
                this.elementError('INVALID_TYPE', 'must be a string', index, { expected: 'string' });
            }

            let str = val;

            if (config) {
                if (config.trim) {
                    str = str.trim();
                }
                if (config.minLength !== undefined && str.length < config.minLength) {
                    this.elementError('MIN_LENGTH', `must be at least ${config.minLength} characters`, index, { min: config.minLength });
                }
                if (config.maxLength !== undefined && str.length > config.maxLength) {
                    this.elementError('MAX_LENGTH', `must be at most ${config.maxLength} characters`, index, { max: config.maxLength });
                }
                if (config.pattern && !config.pattern.test(str)) {
                    this.elementError('PATTERN_MISMATCH', 'does not match required pattern', index);
                }
                if (config.email && !EMAIL_REGEX.test(str)) {
                    this.elementError('INVALID_EMAIL', 'must be a valid email', index);
                }
                if (config.url && !URL_REGEX.test(str)) {
                    this.elementError('INVALID_URL', 'must be a valid URL', index);
                }
            }

            return str;
        };
        return this as unknown as ValidArray<string, ArrayNullability<string, N>>;
    }

    ofBooleans(): ValidArray<boolean, ArrayNullability<boolean, N>> {
        this._elementValidator = (val: unknown, index: number) => {
            if (typeof val === 'boolean') {
                return val;
            }
            if (val === 'true' || val === 1) {
                return true;
            }
            if (val === 'false' || val === 0) {
                return false;
            }
            this.elementError('INVALID_TYPE', 'must be a boolean', index, { expected: 'boolean' });
        };
        return this as unknown as ValidArray<boolean, ArrayNullability<boolean, N>>;
    }

    ofObjects<O>(validator: ObjectArrayValidator<O>): ValidArray<O, ArrayNullability<O, N>> {
        this._elementValidator = (val: unknown, index: number) => {
            if (val === null || typeof val !== 'object' || Array.isArray(val)) {
                this.elementError('INVALID_TYPE', 'must be an object', index, { expected: 'object' });
            }

            try {
                return validator(val as Record<string, unknown>, index);
            } catch (e) {
                if (e instanceof ArgError) {
                    // Re-throw with nested field path including index
                    const nestedField = e.field.split('.').slice(1).join('.');
                    throw new ArgError(
                        `${this._name}[${index}].${nestedField}`,
                        e.code,
                        e.details,
                        e.params
                    );
                }
                throw e;
            }
        };
        return this as unknown as ValidArray<O, ArrayNullability<O, N>>;
    }

    get value(): N {
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
            return undefined as N;
        }

        // Check null
        if (val === null) {
            if (!this._isNullable) {
                this.error('NOT_NULLABLE', 'cannot be null');
            }
            return null as N;
        }

        // Must be array
        if (!Array.isArray(val)) {
            this.error('INVALID_TYPE', 'must be an array', { expected: 'array' });
        }

        // Length validations
        if (this._minLength !== undefined && val.length < this._minLength) {
            this.error('ARRAY_MIN_LENGTH', `must have at least ${this._minLength} elements`, { min: this._minLength });
        }

        if (this._maxLength !== undefined && val.length > this._maxLength) {
            this.error('ARRAY_MAX_LENGTH', `must have at most ${this._maxLength} elements`, { max: this._maxLength });
        }

        // Validate elements
        if (this._elementValidator) {
            const validated = val.map((item, index) => this._elementValidator!(item, index));
            return validated as N;
        }

        return val as N;
    }
}
