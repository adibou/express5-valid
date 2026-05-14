import ArgError, { type ErrorParams } from "./arg-error";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(yyyy_mm_dd: string): boolean {
    const parts = yyyy_mm_dd.split('-').map(Number);
    const y = parts[0]!;
    const m = parts[1]!;
    const d = parts[2]!;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function todayIsoDate(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Jour calendaire pur (YYYY-MM-DD) — retourne une string, jamais un Date,
// pour éviter toute interprétation de fuseau. Les bornes/comparaisons utilisent
// l'ordre lexicographique qui coïncide avec l'ordre chronologique pour ISO 8601.
export default class ValidIsoDate<T = string | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: string | undefined;
    private _min: string | undefined;
    private _max: string | undefined;
    private _isPast = false;
    private _isFuture = false;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidIsoDate<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidIsoDate<Exclude<T, undefined>>;
    }

    get nullable(): ValidIsoDate<T | null> {
        this._isNullable = true;
        return this as unknown as ValidIsoDate<T | null>;
    }

    default(v: string): ValidIsoDate<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidIsoDate<Exclude<T, undefined>>;
    }

    min(date: string): this {
        this._min = date;
        return this;
    }

    max(date: string): this {
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

        if (typeof val !== 'string') {
            this.error('INVALID_TYPE', 'must be a string YYYY-MM-DD', { expected: 'iso-date' });
        }

        const s = (val as string).trim();
        if (!ISO_DATE_RE.test(s)) {
            this.error('INVALID_ISO_DATE', 'must match YYYY-MM-DD');
        }
        if (!isRealCalendarDate(s)) {
            this.error('INVALID_DATE', 'is not a valid calendar date');
        }

        const today = todayIsoDate();

        if (this._isPast && !(s < today)) {
            this.error('DATE_NOT_PAST', 'must be in the past');
        }

        if (this._isFuture && !(s > today)) {
            this.error('DATE_NOT_FUTURE', 'must be in the future');
        }

        if (this._min !== undefined && s < this._min) {
            this.error('DATE_MIN', `must be on or after ${this._min}`, { min: this._min });
        }

        if (this._max !== undefined && s > this._max) {
            this.error('DATE_MAX', `must be on or before ${this._max}`, { max: this._max });
        }

        return s as T;
    }
}
