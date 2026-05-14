import { describe, it, expect } from 'vitest';
import ValidWallTime from '../src/valid-wall-time';
import ArgError from '../src/arg-error';

describe('ValidWallTime', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidWallTime(undefined, 'appointmentAt');
            expect(validator.value).toBeUndefined();
        });

        it('should accept HH:mm:ss and return as-is', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });

        it('should accept HH:mm and normalize to HH:mm:ss', () => {
            const validator = new ValidWallTime('2026-06-15T08:00', 'appointmentAt');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });

        it('should trim whitespace before validating', () => {
            const validator = new ValidWallTime('  2026-06-15T08:00:00  ', 'appointmentAt');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });

        it('should throw INVALID_TYPE for non-string input', () => {
            const validator = new ValidWallTime(1234567890, 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ArgError);
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'wall-time' });
            }
        });

        it('should throw INVALID_TYPE for Date object', () => {
            const validator = new ValidWallTime(new Date('2026-06-15'), 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('timezone offset rejection', () => {
        it('should throw WALL_TIME_HAS_OFFSET for trailing Z', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00Z', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('WALL_TIME_HAS_OFFSET');
            }
        });

        it('should throw WALL_TIME_HAS_OFFSET for +hh:mm offset', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00+02:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('WALL_TIME_HAS_OFFSET');
            }
        });

        it('should throw WALL_TIME_HAS_OFFSET for -hh:mm offset', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00-04:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('WALL_TIME_HAS_OFFSET');
            }
        });
    });

    describe('format validation', () => {
        it('should throw INVALID_WALL_TIME for space separator', () => {
            const validator = new ValidWallTime('2026-06-15 08:00:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_WALL_TIME');
            }
        });

        it('should throw INVALID_WALL_TIME for missing time part', () => {
            const validator = new ValidWallTime('2026-06-15', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_WALL_TIME');
            }
        });

        it('should throw INVALID_WALL_TIME for slash-separated date', () => {
            const validator = new ValidWallTime('2026/06/15T08:00:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_WALL_TIME');
            }
        });

        it('should throw INVALID_WALL_TIME for fractional seconds', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00.500', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_WALL_TIME');
            }
        });
    });

    describe('calendar validation', () => {
        it('should throw INVALID_DATE for impossible day', () => {
            const validator = new ValidWallTime('2026-02-30T08:00:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should throw INVALID_DATE for impossible hour', () => {
            const validator = new ValidWallTime('2026-06-15T25:00:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should throw INVALID_DATE for impossible minute', () => {
            const validator = new ValidWallTime('2026-06-15T08:60:00', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should throw INVALID_DATE for impossible second', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:60', 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_DATE');
            }
        });

        it('should accept Feb 29 on leap year', () => {
            const validator = new ValidWallTime('2024-02-29T08:00:00', 'appointmentAt');
            expect(validator.value).toBe('2024-02-29T08:00:00');
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidWallTime(undefined, 'appointmentAt').required;
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt').required;
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidWallTime(null, 'appointmentAt');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidWallTime(null, 'appointmentAt').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidWallTime(undefined, 'appointmentAt').default('2026-01-01T00:00:00');
            expect(validator.value).toBe('2026-01-01T00:00:00');
        });

        it('should not use default when value provided', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt').default('2026-01-01T00:00:00');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });
    });

    describe('min/max', () => {
        it('should accept wall time >= min', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt').min('2026-01-01T00:00:00');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });

        it('should throw WALL_TIME_MIN for value < min', () => {
            const validator = new ValidWallTime('2025-12-31T23:59:59', 'appointmentAt').min('2026-01-01T00:00:00');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('WALL_TIME_MIN');
                expect((e as ArgError).params.min).toBe('2026-01-01T00:00:00');
            }
        });

        it('should accept wall time <= max', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt').max('2026-12-31T23:59:59');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });

        it('should throw WALL_TIME_MAX for value > max', () => {
            const validator = new ValidWallTime('2027-01-01T00:00:00', 'appointmentAt').max('2026-12-31T23:59:59');
            try {
                validator.value;
                expect.fail('should have thrown');
            } catch (e) {
                expect((e as ArgError).code).toBe('WALL_TIME_MAX');
                expect((e as ArgError).params.max).toBe('2026-12-31T23:59:59');
            }
        });

        it('should compare against normalized form (HH:mm vs HH:mm:ss)', () => {
            // Input "T08:00" gets normalized to "T08:00:00" before comparison.
            const validator = new ValidWallTime('2026-06-15T08:00', 'appointmentAt').min('2026-06-15T08:00:00');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const validator = new ValidWallTime('2026-06-15T08:00:00', 'appointmentAt')
                .required
                .min('2026-01-01T00:00:00')
                .max('2026-12-31T23:59:59');
            expect(validator.value).toBe('2026-06-15T08:00:00');
        });
    });
});
