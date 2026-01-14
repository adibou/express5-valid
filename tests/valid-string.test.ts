import { describe, it, expect } from 'vitest';
import ValidString from '../src/valid-string';
import ArgError from '../src/arg-error';

describe('ValidString', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidString(undefined, 'name');
            expect(validator.value).toBeUndefined();
        });

        it('should return string value', () => {
            const validator = new ValidString('hello', 'name');
            expect(validator.value).toBe('hello');
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidString(undefined, 'name').required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('name');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidString('John', 'name').required;
            expect(validator.value).toBe('John');
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidString(null, 'name');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidString(null, 'name').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidString(undefined, 'name').default('anonymous');
            expect(validator.value).toBe('anonymous');
        });

        it('should not use default when value provided', () => {
            const validator = new ValidString('John', 'name').default('anonymous');
            expect(validator.value).toBe('John');
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for non-string', () => {
            const validator = new ValidString(123, 'name');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'string' });
            }
        });
    });

    describe('transformations', () => {
        it('should trim whitespace', () => {
            const validator = new ValidString('  hello  ', 'name').trim;
            expect(validator.value).toBe('hello');
        });

        it('should convert to lowercase', () => {
            const validator = new ValidString('HELLO', 'name').lowercase;
            expect(validator.value).toBe('hello');
        });

        it('should convert to uppercase', () => {
            const validator = new ValidString('hello', 'name').uppercase;
            expect(validator.value).toBe('HELLO');
        });

        it('should chain transformations', () => {
            const validator = new ValidString('  HELLO  ', 'name').trim.lowercase;
            expect(validator.value).toBe('hello');
        });
    });

    describe('minLength/maxLength', () => {
        it('should accept string >= minLength', () => {
            const validator = new ValidString('hello', 'name').minLength(3);
            expect(validator.value).toBe('hello');
        });

        it('should throw MIN_LENGTH for string < minLength', () => {
            const validator = new ValidString('hi', 'name').minLength(3);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MIN_LENGTH');
                expect((e as ArgError).params).toEqual({ min: 3 });
            }
        });

        it('should accept string <= maxLength', () => {
            const validator = new ValidString('hello', 'name').maxLength(10);
            expect(validator.value).toBe('hello');
        });

        it('should throw MAX_LENGTH for string > maxLength', () => {
            const validator = new ValidString('hello world', 'name').maxLength(5);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MAX_LENGTH');
                expect((e as ArgError).params).toEqual({ max: 5 });
            }
        });
    });

    describe('pattern', () => {
        it('should accept matching pattern', () => {
            const validator = new ValidString('abc123', 'code').pattern(/^[a-z]+\d+$/);
            expect(validator.value).toBe('abc123');
        });

        it('should throw PATTERN_MISMATCH for non-matching pattern', () => {
            const validator = new ValidString('123abc', 'code').pattern(/^[a-z]+\d+$/);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('PATTERN_MISMATCH');
            }
        });
    });

    describe('email', () => {
        it('should accept valid email', () => {
            const validator = new ValidString('test@example.com', 'email').email;
            expect(validator.value).toBe('test@example.com');
        });

        it('should throw INVALID_EMAIL for invalid email', () => {
            const validator = new ValidString('not-an-email', 'email').email;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_EMAIL');
            }
        });

        it('should throw INVALID_EMAIL for email without @', () => {
            const validator = new ValidString('testexample.com', 'email').email;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_EMAIL');
            }
        });
    });

    describe('url', () => {
        it('should accept valid http URL', () => {
            const validator = new ValidString('http://example.com', 'website').url;
            expect(validator.value).toBe('http://example.com');
        });

        it('should accept valid https URL', () => {
            const validator = new ValidString('https://example.com/path', 'website').url;
            expect(validator.value).toBe('https://example.com/path');
        });

        it('should throw INVALID_URL for invalid URL', () => {
            const validator = new ValidString('not-a-url', 'website').url;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_URL');
            }
        });
    });

    describe('oneOf', () => {
        it('should accept value in list', () => {
            const validator = new ValidString('active', 'status').oneOf(['active', 'inactive', 'pending']);
            expect(validator.value).toBe('active');
        });

        it('should throw NOT_IN_LIST for value not in list', () => {
            const validator = new ValidString('deleted', 'status').oneOf(['active', 'inactive', 'pending']);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_IN_LIST');
                expect((e as ArgError).params).toEqual({ allowed: ['active', 'inactive', 'pending'] });
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const validator = new ValidString('  HELLO  ', 'name')
                .required
                .trim
                .lowercase
                .minLength(3)
                .maxLength(10);

            expect(validator.value).toBe('hello');
        });
    });
});
