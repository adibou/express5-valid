import { describe, it, expect } from 'vitest';
import ValidBoolean from '../src/valid-boolean';
import ArgError from '../src/arg-error';

describe('ValidBoolean', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidBoolean(undefined, 'active');
            expect(validator.value).toBeUndefined();
        });

        it('should return true for true', () => {
            const validator = new ValidBoolean(true, 'active');
            expect(validator.value).toBe(true);
        });

        it('should return false for false', () => {
            const validator = new ValidBoolean(false, 'active');
            expect(validator.value).toBe(false);
        });

        it('should parse "true" string to true', () => {
            const validator = new ValidBoolean('true', 'active');
            expect(validator.value).toBe(true);
        });

        it('should parse "false" string to false', () => {
            const validator = new ValidBoolean('false', 'active');
            expect(validator.value).toBe(false);
        });

        it('should parse 1 to true', () => {
            const validator = new ValidBoolean(1, 'active');
            expect(validator.value).toBe(true);
        });

        it('should parse 0 to false', () => {
            const validator = new ValidBoolean(0, 'active');
            expect(validator.value).toBe(false);
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidBoolean(undefined, 'active').required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('active');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidBoolean(true, 'active').required;
            expect(validator.value).toBe(true);
        });

        it('should return false when required and false provided', () => {
            const validator = new ValidBoolean(false, 'active').required;
            expect(validator.value).toBe(false);
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidBoolean(null, 'active');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidBoolean(null, 'active').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidBoolean(undefined, 'active').default(true);
            expect(validator.value).toBe(true);
        });

        it('should use default false when undefined', () => {
            const validator = new ValidBoolean(undefined, 'active').default(false);
            expect(validator.value).toBe(false);
        });

        it('should not use default when value provided', () => {
            const validator = new ValidBoolean(false, 'active').default(true);
            expect(validator.value).toBe(false);
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for invalid value', () => {
            const validator = new ValidBoolean('yes', 'active');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });

        it('should throw INVALID_TYPE for object', () => {
            const validator = new ValidBoolean({}, 'active');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });

        it('should throw INVALID_TYPE for number other than 0 or 1', () => {
            const validator = new ValidBoolean(2, 'active');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining required', () => {
            const validator = new ValidBoolean(true, 'active').required;
            expect(validator.value).toBe(true);
        });

        it('should support default with required behavior', () => {
            const validator = new ValidBoolean(undefined, 'active').default(false);
            expect(validator.value).toBe(false);
        });
    });
});
