import ArgError, { type ErrorParams } from "./arg-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/;

export default class ValidString<T = string | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: string | undefined;
    private _minLength: number | undefined;
    private _maxLength: number | undefined;
    private _pattern: RegExp | undefined;
    private _isEmail = false;
    private _isUrl = false;
    private _shouldTrim = false;
    private _toLowercase = false;
    private _toUppercase = false;
    private _oneOf: string[] | undefined;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidString<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidString<Exclude<T, undefined>>;
    }

    get nullable(): ValidString<T | null> {
        this._isNullable = true;
        return this as unknown as ValidString<T | null>;
    }

    default(v: string): ValidString<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidString<Exclude<T, undefined>>;
    }

    minLength(n: number): this {
        this._minLength = n;
        return this;
    }

    maxLength(n: number): this {
        this._maxLength = n;
        return this;
    }

    pattern(regex: RegExp): this {
        this._pattern = regex;
        return this;
    }

    get email(): this {
        this._isEmail = true;
        return this;
    }

    get url(): this {
        this._isUrl = true;
        return this;
    }

    get trim(): this {
        this._shouldTrim = true;
        return this;
    }

    get lowercase(): this {
        this._toLowercase = true;
        return this;
    }

    get uppercase(): this {
        this._toUppercase = true;
        return this;
    }

    oneOf(values: string[]): this {
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

        // Must be string
        if (typeof val !== 'string') {
            this.error('INVALID_TYPE', 'must be a string', { expected: 'string' });
        }

        let str = val;

        // Transformations
        if (this._shouldTrim) {
            str = str.trim();
        }

        if (this._toLowercase) {
            str = str.toLowerCase();
        }

        if (this._toUppercase) {
            str = str.toUpperCase();
        }

        // Validations
        if (this._minLength !== undefined && str.length < this._minLength) {
            this.error('MIN_LENGTH', `must be at least ${this._minLength} characters`, { min: this._minLength });
        }

        if (this._maxLength !== undefined && str.length > this._maxLength) {
            this.error('MAX_LENGTH', `must be at most ${this._maxLength} characters`, { max: this._maxLength });
        }

        if (this._pattern !== undefined && !this._pattern.test(str)) {
            this.error('PATTERN_MISMATCH', 'does not match required pattern');
        }

        if (this._isEmail && !EMAIL_REGEX.test(str)) {
            this.error('INVALID_EMAIL', 'must be a valid email');
        }

        if (this._isUrl && !URL_REGEX.test(str)) {
            this.error('INVALID_URL', 'must be a valid URL');
        }

        if (this._oneOf !== undefined && !this._oneOf.includes(str)) {
            this.error('NOT_IN_LIST', `must be one of: ${this._oneOf.join(', ')}`, { allowed: this._oneOf });
        }

        return str as T;
    }
}
