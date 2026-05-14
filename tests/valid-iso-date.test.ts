import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ValidIsoDate from '../src/valid-iso-date';
import ArgError from '../src/arg-error';

describe('ValidIsoDate', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidIsoDate(undefined, 'startDate');
            expect(validator.value).toBeUndefined();
        });

        it('should return the ISO string as-is', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate');
            expect(validator.value).toBe('2026-06-15');
        });

        it('should trim whitespace before validating', () => {
            const validator = new ValidIsoDate('  2026-06-15  ', 'startDate');
            expect(validator.value).toBe('2026-06-15');
        });

        it('should throw INVALID_TYPE for non-string input', () => {
            const validator = new ValidIsoDate(20260615, 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ArgError);
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'iso-date' });
            }
        });

        it('should throw INVALID_TYPE for Date object', () => {
            const validator = new ValidIsoDate(new Date('2026-06-15'), 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('format validation', () => {
        it('should throw INVALID_ISO_DATE for slash-separated date', () => {
            const validator = new ValidIsoDate('2026/06/15', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_ISO_DATE');
            }
        });

        it('should throw INVALID_ISO_DATE for date with time', () => {
            const validator = new ValidIsoDate('2026-06-15T08:00:00', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_ISO_DATE');
            }
        });

        it('should throw INVALID_ISO_DATE for missing day', () => {
            const validator = new ValidIsoDate('2026-06', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_ISO_DATE');
            }
        });

        it('should throw INVALID_ISO_DATE for single-digit month/day', () => {
            const validator = new ValidIsoDate('2026-6-1', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_ISO_DATE');
            }
        });
    });

    describe('calendar validation', () => {
        it('should throw INVALID_DATE for Feb 30', () => {
            const validator = new ValidIsoDate('2026-02-30', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should throw INVALID_DATE for month 13', () => {
            const validator = new ValidIsoDate('2026-13-01', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should accept Feb 29 on leap year', () => {
            const validator = new ValidIsoDate('2024-02-29', 'startDate');
            expect(validator.value).toBe('2024-02-29');
        });

        it('should reject Feb 29 on non-leap year', () => {
            const validator = new ValidIsoDate('2025-02-29', 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidIsoDate(undefined, 'startDate').required;
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('startDate');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').required;
            expect(validator.value).toBe('2026-06-15');
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidIsoDate(null, 'startDate');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidIsoDate(null, 'startDate').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidIsoDate(undefined, 'startDate').default('2026-01-01');
            expect(validator.value).toBe('2026-01-01');
        });

        it('should not use default when value provided', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').default('2026-01-01');
            expect(validator.value).toBe('2026-06-15');
        });
    });

    describe('past/future', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should accept past date for .past', () => {
            const validator = new ValidIsoDate('2026-01-01', 'startDate').past;
            expect(validator.value).toBe('2026-01-01');
        });

        it('should throw DATE_NOT_PAST for today with .past', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').past;
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_NOT_PAST');
            }
        });

        it('should throw DATE_NOT_PAST for future date with .past', () => {
            const validator = new ValidIsoDate('2099-01-01', 'startDate').past;
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_NOT_PAST');
            }
        });

        it('should accept future date for .future', () => {
            const validator = new ValidIsoDate('2099-01-01', 'startDate').future;
            expect(validator.value).toBe('2099-01-01');
        });

        it('should throw DATE_NOT_FUTURE for today with .future', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').future;
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_NOT_FUTURE');
            }
        });
    });

    describe('min/max', () => {
        it('should accept date >= min', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').min('2026-01-01');
            expect(validator.value).toBe('2026-06-15');
        });

        it('should accept date equal to min', () => {
            const validator = new ValidIsoDate('2026-01-01', 'startDate').min('2026-01-01');
            expect(validator.value).toBe('2026-01-01');
        });

        it('should throw DATE_MIN for date < min', () => {
            const validator = new ValidIsoDate('2025-12-31', 'startDate').min('2026-01-01');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_MIN');
                expect((e as ArgError).params.min).toBe('2026-01-01');
            }
        });

        it('should accept date <= max', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate').max('2026-12-31');
            expect(validator.value).toBe('2026-06-15');
        });

        it('should throw DATE_MAX for date > max', () => {
            const validator = new ValidIsoDate('2027-01-01', 'startDate').max('2026-12-31');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('DATE_MAX');
                expect((e as ArgError).params.max).toBe('2026-12-31');
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const validator = new ValidIsoDate('2026-06-15', 'startDate')
                .required
                .min('2026-01-01')
                .max('2026-12-31');
            expect(validator.value).toBe('2026-06-15');
        });
    });
});
