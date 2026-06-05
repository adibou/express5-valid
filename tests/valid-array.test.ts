import { describe, it, expect } from 'vitest';
import ValidArray from '../src/valid-array';
import ValidBase from '../src/valid-base';
import ArgError from '../src/arg-error';

// Helper for object validation in arrays
function validArgument(obj: Record<string, unknown>, name: string): ValidBase {
    return new ValidBase(obj[name], name);
}

describe('ValidArray', () => {
    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidArray(undefined, 'items');
            expect(validator.value).toBeUndefined();
        });

        it('should return array value', () => {
            const validator = new ValidArray([1, 2, 3], 'items');
            expect(validator.value).toEqual([1, 2, 3]);
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidArray(undefined, 'items').required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('items');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidArray([1, 2], 'items').required;
            expect(validator.value).toEqual([1, 2]);
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidArray(null, 'items');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidArray(null, 'items').nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            const validator = new ValidArray(undefined, 'items').default([]);
            expect(validator.value).toEqual([]);
        });

        it('should not use default when value provided', () => {
            const validator = new ValidArray([1], 'items').default([]);
            expect(validator.value).toEqual([1]);
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for non-array', () => {
            const validator = new ValidArray('not-an-array', 'items');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'array' });
            }
        });

        it('should throw INVALID_TYPE for object', () => {
            const validator = new ValidArray({ foo: 'bar' }, 'items');

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('minLength/maxLength', () => {
        it('should accept array >= minLength', () => {
            const validator = new ValidArray([1, 2, 3], 'items').minLength(2);
            expect(validator.value).toEqual([1, 2, 3]);
        });

        it('should throw ARRAY_MIN_LENGTH for array < minLength', () => {
            const validator = new ValidArray([1], 'items').minLength(2);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_MIN_LENGTH');
                expect((e as ArgError).params).toEqual({ min: 2 });
            }
        });

        it('should accept array <= maxLength', () => {
            const validator = new ValidArray([1, 2], 'items').maxLength(5);
            expect(validator.value).toEqual([1, 2]);
        });

        it('should throw ARRAY_MAX_LENGTH for array > maxLength', () => {
            const validator = new ValidArray([1, 2, 3, 4], 'items').maxLength(3);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_MAX_LENGTH');
                expect((e as ArgError).params).toEqual({ max: 3 });
            }
        });
    });

    describe('ofNumbers', () => {
        it('should validate array of numbers', () => {
            const validator = new ValidArray([1, 2, 3], 'items').ofNumbers();
            expect(validator.value).toEqual([1, 2, 3]);
        });

        it('should parse string numbers', () => {
            const validator = new ValidArray(['1', '2', '3'], 'items').ofNumbers();
            expect(validator.value).toEqual([1, 2, 3]);
        });

        it('should throw ARRAY_ELEMENT for invalid number', () => {
            const validator = new ValidArray([1, 'abc', 3], 'items').ofNumbers();

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_NUMBER');
            }
        });

        it('should validate integer config', () => {
            const validator = new ValidArray([1.5, 2, 3], 'items').ofNumbers({ integer: true });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('NOT_INTEGER');
                expect((e as ArgError).params.index).toBe(0);
            }
        });

        it('should validate positive config', () => {
            const validator = new ValidArray([1, -2, 3], 'items').ofNumbers({ positive: true });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('NOT_POSITIVE');
                expect((e as ArgError).params.index).toBe(1);
            }
        });

        it('should validate min/max config', () => {
            const validator = new ValidArray([5, 15, 25], 'items').ofNumbers({ min: 10, max: 20 });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('MIN_VALUE');
                expect((e as ArgError).params.index).toBe(0);
            }
        });
    });

    describe('ofStrings', () => {
        it('should validate array of strings', () => {
            const validator = new ValidArray(['a', 'b', 'c'], 'items').ofStrings();
            expect(validator.value).toEqual(['a', 'b', 'c']);
        });

        it('should throw ARRAY_ELEMENT for non-string', () => {
            const validator = new ValidArray(['a', 123, 'c'], 'items').ofStrings();

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_TYPE');
            }
        });

        it('should apply trim config', () => {
            const validator = new ValidArray(['  a  ', '  b  '], 'items').ofStrings({ trim: true });
            expect(validator.value).toEqual(['a', 'b']);
        });

        it('should validate minLength config', () => {
            const validator = new ValidArray(['abc', 'a', 'def'], 'items').ofStrings({ minLength: 2 });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('MIN_LENGTH');
                expect((e as ArgError).params.index).toBe(1);
            }
        });

        it('should validate email config', () => {
            const validator = new ValidArray(['test@example.com', 'invalid'], 'items').ofStrings({ email: true });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('INVALID_EMAIL');
                expect((e as ArgError).params.index).toBe(1);
            }
        });

        it('should validate url config', () => {
            const validator = new ValidArray(['https://example.com', 'not-a-url'], 'items').ofStrings({ url: true });

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).params.code).toBe('INVALID_URL');
                expect((e as ArgError).params.index).toBe(1);
            }
        });
    });

    describe('ofEnum', () => {
        const COLORS = ['red', 'green', 'blue'] as const;

        it('should validate array of allowed string enum values', () => {
            const validator = new ValidArray(['red', 'blue'], 'items').ofEnum(COLORS);
            expect(validator.value).toEqual(['red', 'blue']);
        });

        it('should accept readonly tuple as allowed values', () => {
            // Sanity check: `as const` arrays compile against `readonly V[]`.
            const validator = new ValidArray(['red'], 'items').ofEnum(COLORS);
            expect(validator.value).toEqual(['red']);
        });

        it('should accept a plain (non-readonly) array', () => {
            const validator = new ValidArray([1, 2], 'items').ofEnum([1, 2, 3]);
            expect(validator.value).toEqual([1, 2]);
        });

        it('should throw INVALID_ENUM_VALUE for unknown value', () => {
            const validator = new ValidArray(['red', 'purple'], 'items').ofEnum(COLORS);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_ENUM_VALUE');
                expect((e as ArgError).params.allowed).toEqual(['red', 'green', 'blue']);
            }
        });

        it('should throw INVALID_TYPE for non-string/non-number element', () => {
            const validator = new ValidArray(['red', true], 'items').ofEnum(COLORS);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('ofBooleans', () => {
        it('should validate array of booleans', () => {
            const validator = new ValidArray([true, false, true], 'items').ofBooleans();
            expect(validator.value).toEqual([true, false, true]);
        });

        it('should parse string booleans', () => {
            const validator = new ValidArray(['true', 'false', true], 'items').ofBooleans();
            expect(validator.value).toEqual([true, false, true]);
        });

        it('should parse number booleans', () => {
            const validator = new ValidArray([1, 0, true], 'items').ofBooleans();
            expect(validator.value).toEqual([true, false, true]);
        });

        it('should throw ARRAY_ELEMENT for invalid boolean', () => {
            const validator = new ValidArray([true, 'yes', false], 'items').ofBooleans();

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining multiple validations', () => {
            const validator = new ValidArray([1, 2, 3], 'items')
                .required
                .minLength(1)
                .maxLength(10)
                .ofNumbers({ positive: true });

            expect(validator.value).toEqual([1, 2, 3]);
        });
    });

    describe('ofObjects', () => {
        // User validator for array elements
        const userValidator = (obj: Record<string, unknown>) => ({
            id: validArgument(obj, 'id').number.required.positive.value,
            name: validArgument(obj, 'name').string.required.minLength(2).value
        });

        it('should validate array of objects', () => {
            const data = [
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' }
            ];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);
            expect(validator.value).toEqual([
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' }
            ]);
        });

        it('should throw ARRAY_ELEMENT for non-object element', () => {
            const data = [{ id: 1, name: 'John' }, 'not-an-object'];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
                expect((e as ArgError).params.code).toBe('INVALID_TYPE');
            }
        });

        it('should throw ARRAY_ELEMENT for null element', () => {
            const data = [{ id: 1, name: 'John' }, null];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
            }
        });

        it('should throw ARRAY_ELEMENT for array element', () => {
            const data = [{ id: 1, name: 'John' }, [1, 2, 3]];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_ELEMENT');
                expect((e as ArgError).params.index).toBe(1);
            }
        });

        it('should include index and field in nested error path', () => {
            const data = [
                { id: 1, name: 'John' },
                { id: 2, name: 'A' } // name too short
            ];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('MIN_LENGTH');
                expect((e as ArgError).field).toBe('users[1].name');
            }
        });

        it('should report missing required field with correct path', () => {
            const data = [
                { id: 1, name: 'John' },
                { name: 'Jane' } // missing id
            ];
            const validator = new ValidArray(data, 'users').ofObjects(userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('users[1].id');
            }
        });

        it('should work with minLength/maxLength', () => {
            const data = [{ id: 1, name: 'John' }];
            const validator = new ValidArray(data, 'users')
                .ofObjects(userValidator)
                .minLength(2);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('ARRAY_MIN_LENGTH');
            }
        });

        it('should work with required', () => {
            const validator = new ValidArray(undefined, 'users')
                .ofObjects(userValidator)
                .required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
            }
        });

        it('should support chaining with all validations', () => {
            const data = [
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' }
            ];
            const validator = new ValidArray(data, 'users')
                .required
                .minLength(1)
                .maxLength(10)
                .ofObjects(userValidator);

            expect(validator.value).toEqual([
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' }
            ]);
        });
    });
});
