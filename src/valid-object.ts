import ArgError, { type ErrorParams } from "./arg-error";

export type ObjectValidator<T> = (obj: Record<string, unknown>) => T;

export default class ValidObject<T, N = T | undefined> {
    private _value: unknown;
    private _name: string;
    private _validator: ObjectValidator<T>;
    private _isRequired = false;
    private _isNullable = false;
    private _default: T | undefined;

    constructor(value: unknown, name: string, validator: ObjectValidator<T>) {
        this._value = value;
        this._name = name;
        this._validator = validator;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidObject<T, Exclude<N, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidObject<T, Exclude<N, undefined>>;
    }

    get nullable(): ValidObject<T, N | null> {
        this._isNullable = true;
        return this as unknown as ValidObject<T, N | null>;
    }

    default(v: T): ValidObject<T, Exclude<N, undefined>> {
        this._default = v;
        return this as unknown as ValidObject<T, Exclude<N, undefined>>;
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

        // Must be object (not array, not null)
        if (typeof val !== 'object' || Array.isArray(val)) {
            this.error('INVALID_TYPE', 'must be an object', { expected: 'object' });
        }

        // Run custom validator
        try {
            const validated = this._validator(val as Record<string, unknown>);
            return validated as unknown as N;
        } catch (e) {
            if (e instanceof ArgError) {
                // Re-throw with nested field path
                throw new ArgError(
                    `${this._name}.${e.field.split('.').slice(1).join('.')}`,
                    e.code,
                    e.details,
                    e.params
                );
            }
            throw e;
        }
    }
}
