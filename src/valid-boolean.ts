import ArgError from "./arg-error";

export default class ValidBoolean<T = boolean | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: boolean | undefined;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string): never {
        throw new ArgError(`${this._name}`, code, details);
    }

    get required(): ValidBoolean<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidBoolean<Exclude<T, undefined>>;
    }

    get nullable(): ValidBoolean<T | null> {
        this._isNullable = true;
        return this as unknown as ValidBoolean<T | null>;
    }

    default(v: boolean): ValidBoolean<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidBoolean<Exclude<T, undefined>>;
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

        // Parse boolean
        let bool: boolean;
        if (typeof val === 'boolean') {
            bool = val;
        } else if (val === 'true' || val === 1) {
            bool = true;
        } else if (val === 'false' || val === 0) {
            bool = false;
        } else {
            this.error('INVALID_TYPE', 'must be a boolean');
        }

        return bool as T;
    }
}
