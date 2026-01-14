import { describe, it, expect } from 'vitest';
import ValidNumber from '../src/valid-number';
import ArgError from '../src/arg-error';

describe('ValidNumber', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidNumber(undefined, 'age');
            expect(validator.value).toBeUndefined();
        });

        it('should parse number value', () => {
            const validator = new ValidNumber(42, 'age');
            expect(validator.value).toBe(42);
        });

        it('should parse string to number', () => {
            const validator = new ValidNumber('42', 'age');
            expect(validator.value).toBe(42);
        });

        it('should parse float string', () => {
            const validator = new ValidNumber('3.14', 'price');
            expect(validator.value).toBe(3.14);
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidNumber(undefined, 'age').required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect(e).toBeInstanceOf(ArgError);
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('age');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidNumber(25, 'age').required;
            expect(validator.value).toBe(25);
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidNumber(null, 'age');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidNumber(null, 'age').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidNumber(undefined, 'age').default(18);
            expect(validator.value).toBe(18);
        });

        it('should not use default when value provided', () => {
            const validator = new ValidNumber(25, 'age').default(18);
            expect(validator.value).toBe(25);
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for non-number/string', () => {
            const validator = new ValidNumber({ foo: 'bar' }, 'age');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'number' });
            }
        });

        it('should throw INVALID_NUMBER for NaN string', () => {
            const validator = new ValidNumber('not-a-number', 'age');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_NUMBER');
            }
        });
    });

    describe('integer', () => {
        it('should accept integer', () => {
            const validator = new ValidNumber(42, 'age').integer;
            expect(validator.value).toBe(42);
        });

        it('should throw NOT_INTEGER for float', () => {
            const validator = new ValidNumber(3.14, 'age').integer;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_INTEGER');
            }
        });
    });

    describe('positive/negative', () => {
        it('should accept positive number', () => {
            const validator = new ValidNumber(5, 'count').positive;
            expect(validator.value).toBe(5);
        });

        it('should throw NOT_POSITIVE for zero', () => {
            const validator = new ValidNumber(0, 'count').positive;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_POSITIVE');
            }
        });

        it('should throw NOT_POSITIVE for negative', () => {
            const validator = new ValidNumber(-5, 'count').positive;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_POSITIVE');
            }
        });

        it('should accept negative number', () => {
            const validator = new ValidNumber(-5, 'debt').negative;
            expect(validator.value).toBe(-5);
        });

        it('should throw NOT_NEGATIVE for positive', () => {
            const validator = new ValidNumber(5, 'debt').negative;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NEGATIVE');
            }
        });
    });

    describe('min/max', () => {
        it('should accept value >= min', () => {
            const validator = new ValidNumber(18, 'age').min(18);
            expect(validator.value).toBe(18);
        });

        it('should throw MIN_VALUE for value < min', () => {
            const validator = new ValidNumber(15, 'age').min(18);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MIN_VALUE');
                expect((e as ArgError).params).toEqual({ min: 18 });
            }
        });

        it('should accept value <= max', () => {
            const validator = new ValidNumber(100, 'age').max(150);
            expect(validator.value).toBe(100);
        });

        it('should throw MAX_VALUE for value > max', () => {
            const validator = new ValidNumber(200, 'age').max(150);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MAX_VALUE');
                expect((e as ArgError).params).toEqual({ max: 150 });
            }
        });
    });

    describe('between', () => {
        it('should accept value in range', () => {
            const validator = new ValidNumber(50, 'score').between(0, 100);
            expect(validator.value).toBe(50);
        });

        it('should throw MIN_VALUE for value below range', () => {
            const validator = new ValidNumber(-10, 'score').between(0, 100);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MIN_VALUE');
            }
        });

        it('should throw MAX_VALUE for value above range', () => {
            const validator = new ValidNumber(150, 'score').between(0, 100);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MAX_VALUE');
            }
        });
    });

    describe('oneOf', () => {
        it('should accept value in list', () => {
            const validator = new ValidNumber(2, 'priority').oneOf([1, 2, 3]);
            expect(validator.value).toBe(2);
        });

        it('should throw NOT_IN_LIST for value not in list', () => {
            const validator = new ValidNumber(5, 'priority').oneOf([1, 2, 3]);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_IN_LIST');
                expect((e as ArgError).params).toEqual({ allowed: [1, 2, 3] });
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const validator = new ValidNumber(25, 'age')
                .required
                .integer
                .positive
                .min(18)
                .max(120);

            expect(validator.value).toBe(25);
        });
    });
});
