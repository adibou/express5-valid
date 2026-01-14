import ArgError, { type ErrorParams } from "./arg-error";

export default class ValidEnum<V extends string | number, T = V | undefined> {
    private _value: unknown;
    private _name: string;
    private _allowedValues: V[];
    private _isRequired = false;
    private _isNullable = false;
    private _default: V | undefined;

    constructor(value: unknown, name: string, allowedValues: V[]) {
        this._value = value;
        this._name = name;
        this._allowedValues = allowedValues;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidEnum<V, Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidEnum<V, Exclude<T, undefined>>;
    }

    get nullable(): ValidEnum<V, T | null> {
        this._isNullable = true;
        return this as unknown as ValidEnum<V, T | null>;
    }

    default(v: V): ValidEnum<V, Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidEnum<V, Exclude<T, undefined>>;
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

        // Check if value is in allowed values
        if (!this._allowedValues.includes(val as V)) {
            this.error('NOT_IN_LIST', `must be one of: ${this._allowedValues.join(', ')}`, { allowed: this._allowedValues });
        }

        return val as T;
    }
}
