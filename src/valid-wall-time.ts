import ArgError, { type ErrorParams } from "./arg-error";

// Accepte secondes optionnelles ; normalise vers HH:mm:ss.
const WALL_TIME_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// Détecte un suffixe de fuseau interdit : Z, +hh:mm, -hh:mm.
const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:\d{2})$/;

function isRealCalendarDate(year: number, month: number, day: number): boolean {
    const dt = new Date(Date.UTC(year, month - 1, day));
    return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

// Date+heure "naive" (sans fuseau) — YYYY-MM-DDTHH:mm[:ss]. Retourne une string
// normalisée en HH:mm:ss. Refuse explicitement tout suffixe de fuseau (Z ou
// ±hh:mm) : un wall time avec offset est sémantiquement un instant et doit
// passer par .date à la place. Ordre lexicographique = chronologique.
export default class ValidWallTime<T = string | undefined> {
    private _value: unknown;
    private _name: string;
    private _isRequired = false;
    private _isNullable = false;
    private _default: string | undefined;
    private _min: string | undefined;
    private _max: string | undefined;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    private error(code: string, details: string, params: ErrorParams = {}): never {
        throw new ArgError(`${this._name}`, code, details, params);
    }

    get required(): ValidWallTime<Exclude<T, undefined>> {
        this._isRequired = true;
        return this as unknown as ValidWallTime<Exclude<T, undefined>>;
    }

    get nullable(): ValidWallTime<T | null> {
        this._isNullable = true;
        return this as unknown as ValidWallTime<T | null>;
    }

    default(v: string): ValidWallTime<Exclude<T, undefined>> {
        this._default = v;
        return this as unknown as ValidWallTime<Exclude<T, undefined>>;
    }

    min(t: string): this {
        this._min = t;
        return this;
    }

    max(t: string): this {
        this._max = t;
        return this;
    }

    get value(): T {
        let val = this._value;

        if (val === undefined && this._default !== undefined) {
            val = this._default;
        }

        if (val === undefined) {
            if (this._isRequired) {
                this.error('REQUIRED', 'is required');
            }
            return undefined as T;
        }

        if (val === null) {
            if (!this._isNullable) {
                this.error('NOT_NULLABLE', 'cannot be null');
            }
            return null as T;
        }

        if (typeof val !== 'string') {
            this.error('INVALID_TYPE', 'must be a string YYYY-MM-DDTHH:mm[:ss]', { expected: 'wall-time' });
        }

        const s = (val as string).trim();

        if (TZ_SUFFIX_RE.test(s)) {
            this.error('WALL_TIME_HAS_OFFSET', 'must not include a timezone offset (Z or ±hh:mm)');
        }

        const m = WALL_TIME_RE.exec(s);
        if (!m) {
            this.error('INVALID_WALL_TIME', 'must match YYYY-MM-DDTHH:mm[:ss]');
        }

        const ymd = m[1]!;
        const hhStr = m[2]!;
        const mmStr = m[3]!;
        const ssStr = m[4];
        const parts = ymd.split('-').map(Number);
        const year = parts[0]!;
        const month = parts[1]!;
        const day = parts[2]!;
        const hh = Number(hhStr);
        const mm = Number(mmStr);
        const ss = ssStr !== undefined ? Number(ssStr) : 0;

        if (hh > 23 || mm > 59 || ss > 59 || !isRealCalendarDate(year, month, day)) {
            this.error('INVALID_DATE', 'is not a valid calendar date/time');
        }

        // Normalise : toujours HH:mm:ss en sortie.
        const normalized = `${ymd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

        if (this._min !== undefined && normalized < this._min) {
            this.error('WALL_TIME_MIN', `must be on or after ${this._min}`, { min: this._min });
        }

        if (this._max !== undefined && normalized > this._max) {
            this.error('WALL_TIME_MAX', `must be on or before ${this._max}`, { max: this._max });
        }

        return normalized as T;
    }
}
