import { describe, it, expect } from 'vitest';
import ValidObject from '../src/valid-object';
import ValidBase from '../src/valid-base';
import ArgError from '../src/arg-error';

// Helper to create a ValidBase for testing nested validation
function validArgument(obj: Record<string, unknown>, name: string): ValidBase {
    return new ValidBase(obj[name], name);
}

describe('ValidObject', () => {
    // Simple user validator
    const userValidator = (obj: Record<string, unknown>) => ({
        name: validArgument(obj, 'name').string.required.value,
        age: validArgument(obj, 'age').number.positive.value
    });

    describe('basic parsing', () => {
        it('should return undefined for undefined value', () => {
            const validator = new ValidObject(undefined, 'user', userValidator);
            expect(validator.value).toBeUndefined();
        });

        it('should validate and return object', () => {
            const data = { name: 'John', age: 25 };
            const validator = new ValidObject(data, 'user', userValidator);
            expect(validator.value).toEqual({ name: 'John', age: 25 });
        });

        it('should allow optional fields to be undefined', () => {
            const data = { name: 'John' };
            const validator = new ValidObject(data, 'user', userValidator);
            expect(validator.value).toEqual({ name: 'John', age: undefined });
        });
    });

    describe('required', () => {
        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidObject(undefined, 'user', userValidator).required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('user');
            }
        });

        it('should return value when required and provided', () => {
            const data = { name: 'John', age: 30 };
            const validator = new ValidObject(data, 'user', userValidator).required;
            expect(validator.value).toEqual({ name: 'John', age: 30 });
        });
    });

    describe('nullable', () => {
        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidObject(null, 'user', userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidObject(null, 'user', userValidator).nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        it('should use default when undefined', () => {
            // Default must be a valid object that passes the validator
            const defaultUser = { name: 'Default', age: 1 };
            const validator = new ValidObject(undefined, 'user', userValidator).default(defaultUser);
            expect(validator.value).toEqual(defaultUser);
        });

        it('should not use default when value provided', () => {
            const data = { name: 'John', age: 25 };
            const defaultUser = { name: 'Default', age: 1 };
            const validator = new ValidObject(data, 'user', userValidator).default(defaultUser);
            expect(validator.value).toEqual({ name: 'John', age: 25 });
        });
    });

    describe('type validation', () => {
        it('should throw INVALID_TYPE for non-object', () => {
            const validator = new ValidObject('not-an-object', 'user', userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
                expect((e as ArgError).params).toEqual({ expected: 'object' });
            }
        });

        it('should throw INVALID_TYPE for array', () => {
            const validator = new ValidObject([1, 2, 3], 'user', userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('INVALID_TYPE');
            }
        });
    });

    describe('nested validation errors', () => {
        it('should include nested field path in error', () => {
            const data = { age: 25 }; // missing required 'name'
            const validator = new ValidObject(data, 'user', userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('user.name');
            }
        });

        it('should include nested field path for validation errors', () => {
            const data = { name: 'John', age: -5 }; // age must be positive
            const validator = new ValidObject(data, 'user', userValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_POSITIVE');
                expect((e as ArgError).field).toBe('user.age');
            }
        });
    });

    describe('complex nested objects', () => {
        const addressValidator = (obj: Record<string, unknown>) => ({
            street: validArgument(obj, 'street').string.required.value,
            city: validArgument(obj, 'city').string.required.value,
            zip: validArgument(obj, 'zip').string.pattern(/^\d{5}$/).value
        });

        const personValidator = (obj: Record<string, unknown>) => ({
            name: validArgument(obj, 'name').string.required.value,
            address: new ValidObject(obj['address'], 'address', addressValidator).required.value
        });

        it('should validate deeply nested objects', () => {
            const data = {
                name: 'John',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    zip: '10001'
                }
            };

            const validator = new ValidObject(data, 'person', personValidator);
            expect(validator.value).toEqual({
                name: 'John',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    zip: '10001'
                }
            });
        });

        it('should report errors in deeply nested fields', () => {
            const data = {
                name: 'John',
                address: {
                    street: '123 Main St',
                    // missing city
                    zip: '10001'
                }
            };

            const validator = new ValidObject(data, 'person', personValidator);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                // The field path should show the full nesting
                expect((e as ArgError).field).toContain('city');
            }
        });
    });

    describe('chaining', () => {
        it('should support chaining required', () => {
            const data = { name: 'John', age: 25 };
            const validator = new ValidObject(data, 'user', userValidator).required;
            expect(validator.value).toEqual({ name: 'John', age: 25 });
        });

        it('should support chaining nullable', () => {
            const validator = new ValidObject(null, 'user', userValidator).nullable;
            expect(validator.value).toBeNull();
        });
    });
});
