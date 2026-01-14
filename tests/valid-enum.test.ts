import { describe, it, expect } from 'vitest';
import ValidEnum from '../src/valid-enum';
import ArgError from '../src/arg-error';

describe('ValidEnum', () => {
    describe('string enum', () => {
        const statuses = ['active', 'inactive', 'pending'] as const;

        it('should return undefined for undefined value', () => {
            const validator = new ValidEnum(undefined, 'status', [...statuses]);
            expect(validator.value).toBeUndefined();
        });

        it('should accept value in enum list', () => {
            const validator = new ValidEnum('active', 'status', [...statuses]);
            expect(validator.value).toBe('active');
        });

        it('should throw NOT_IN_LIST for value not in enum', () => {
            const validator = new ValidEnum('deleted', 'status', [...statuses]);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_IN_LIST');
                expect((e as ArgError).params).toEqual({ allowed: [...statuses] });
            }
        });
    });

    describe('number enum', () => {
        const priorities = [1, 2, 3] as const;

        it('should accept number value in enum list', () => {
            const validator = new ValidEnum(2, 'priority', [...priorities]);
            expect(validator.value).toBe(2);
        });

        it('should throw NOT_IN_LIST for number not in enum', () => {
            const validator = new ValidEnum(5, 'priority', [...priorities]);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_IN_LIST');
                expect((e as ArgError).params).toEqual({ allowed: [...priorities] });
            }
        });
    });

    describe('required', () => {
        const statuses = ['active', 'inactive'] as const;

        it('should throw REQUIRED for undefined when required', () => {
            const validator = new ValidEnum(undefined, 'status', [...statuses]).required;

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('status');
            }
        });

        it('should return value when required and provided', () => {
            const validator = new ValidEnum('active', 'status', [...statuses]).required;
            expect(validator.value).toBe('active');
        });
    });

    describe('nullable', () => {
        const statuses = ['active', 'inactive'] as const;

        it('should throw NOT_NULLABLE for null by default', () => {
            const validator = new ValidEnum(null, 'status', [...statuses]);

            expect(() => validator.value).toThrow(ArgError);
            try {
                validator.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('NOT_NULLABLE');
            }
        });

        it('should allow null when nullable', () => {
            const validator = new ValidEnum(null, 'status', [...statuses]).nullable;
            expect(validator.value).toBeNull();
        });
    });

    describe('default', () => {
        const statuses = ['active', 'inactive', 'pending'] as const;

        it('should use default when undefined', () => {
            const validator = new ValidEnum(undefined, 'status', [...statuses]).default('pending');
            expect(validator.value).toBe('pending');
        });

        it('should not use default when value provided', () => {
            const validator = new ValidEnum('active', 'status', [...statuses]).default('pending');
            expect(validator.value).toBe('active');
        });
    });

    describe('chaining', () => {
        const roles = ['admin', 'user', 'guest'] as const;

        it('should support chaining required', () => {
            const validator = new ValidEnum('admin', 'role', [...roles]).required;
            expect(validator.value).toBe('admin');
        });

        it('should support chaining nullable and required', () => {
            const validator = new ValidEnum('user', 'role', [...roles]).required.nullable;
            expect(validator.value).toBe('user');
        });
    });
});
