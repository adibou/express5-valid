import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ValidDate from '../src/valid-date';
import ArgError from '../src/arg-error';

describe('ValidDate', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidDate(undefined, 'createdAt');
            expect(validator.value).toBeUndefined();
        });

        it('should return Date object for Date input', () => {
            const date = new Date('2024-01-15');
            const validator = new ValidDate(date, 'createdAt');
            expect(validator.value).toEqual(date);
        });

        it('should parse ISO string to Date', () => {
            const validator = new ValidDate('2024-01-15T10:30:00.000Z', 'createdAt');
            expect(validator.value).toBeInstanceOf(Date);
            expect((validator.value as Date).toISOString()).toBe('2024-01-15T10:30:00.000Z');
        });

        it('should parse timestamp to Date', () => {
            const timestamp = 1705315800000; // 2024-01-15T10:30:00.000Z
            const validator = new ValidDate(timestamp, 'createdAt');
            expect(validator.value).toBeInstanceOf(Date);
            expect((validator.value as Date).getTime()).toBe(timestamp);
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidDate(undefined, 'createdAt').required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('createdAt');
            }
        });

        it('should return value when required and provided', () => {
            const date = new Date('2024-01-15');
            const validator = new ValidDate(date, 'createdAt').required;
            expect(validator.value).toEqual(date);
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidDate(null, 'createdAt');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidDate(null, 'createdAt').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const defaultDate = new Date('2024-01-01');
            const validator = new ValidDate(undefined, 'createdAt').default(defaultDate);
            expect(validator.value).toEqual(defaultDate);
        });

        it('should not use default when value provided', () => {
            const date = new Date('2024-06-15');
            const defaultDate = new Date('2024-01-01');
            const validator = new ValidDate(date, 'createdAt').default(defaultDate);
            expect(validator.value).toEqual(date);
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for non-date type', () => {
            const validator = new ValidDate({ foo: 'bar' }, 'createdAt');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'date' });
            }
        });

        it('should throw INVALID_DATE for invalid date string', () => {
            const validator = new ValidDate('not-a-date', 'createdAt');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });
    });

    describe('past/future', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should accept past date for past validation', () => {
            const pastDate = new Date('2024-01-15');
            const validator = new ValidDate(pastDate, 'createdAt').past;
            expect(validator.value).toEqual(pastDate);
        });

        it('should throw DATE_NOT_PAST for future date', () => {
            const futureDate = new Date('2024-12-15');
            const validator = new ValidDate(futureDate, 'createdAt').past;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_NOT_PAST');
            }
        });

        it('should accept future date for future validation', () => {
            const futureDate = new Date('2024-12-15');
            const validator = new ValidDate(futureDate, 'expiresAt').future;
            expect(validator.value).toEqual(futureDate);
        });

        it('should throw DATE_NOT_FUTURE for past date', () => {
            const pastDate = new Date('2024-01-15');
            const validator = new ValidDate(pastDate, 'expiresAt').future;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_NOT_FUTURE');
            }
        });
    });

    describe('min/max', () => {
        it('should accept date >= min', () => {
            const minDate = new Date('2024-01-01');
            const date = new Date('2024-06-15');
            const validator = new ValidDate(date, 'createdAt').min(minDate);
            expect(validator.value).toEqual(date);
        });

        it('should throw DATE_MIN for date < min', () => {
            const minDate = new Date('2024-06-01');
            const date = new Date('2024-01-15');
            const validator = new ValidDate(date, 'createdAt').min(minDate);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_MIN');
                expect((e as ArgError).params.min).toBe(minDate.toISOString());
            }
        });

        it('should accept date <= max', () => {
            const maxDate = new Date('2024-12-31');
            const date = new Date('2024-06-15');
            const validator = new ValidDate(date, 'createdAt').max(maxDate);
            expect(validator.value).toEqual(date);
        });

        it('should throw DATE_MAX for date > max', () => {
            const maxDate = new Date('2024-01-01');
            const date = new Date('2024-06-15');
            const validator = new ValidDate(date, 'createdAt').max(maxDate);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_MAX');
                expect((e as ArgError).params.max).toBe(maxDate.toISOString());
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const minDate = new Date('2024-01-01');
            const maxDate = new Date('2024-12-31');
            const date = new Date('2024-06-15');

            const validator = new ValidDate(date, 'createdAt')
                .required
                .min(minDate)
                .max(maxDate);

            expect(validator.value).toEqual(date);
        });
    });
});
