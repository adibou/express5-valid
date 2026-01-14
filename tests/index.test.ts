import { describe, it, expect } from 'vitest';
import { body, params, ArgError } from '../src/index';
import { requestStorage, RequestContext } from '../src/middleware';

describe('body()', () => {
    it('should throw error when called outside of middleware context', () => {
        expect(() => body('name')).toThrow('body/params must be called inside validMiddleware context');
    });

    it('should return ValidBase for body field', () => {
        const context: RequestContext = {
            body: { name: 'John', age: 25 },
            params: {}
        };

        requestStorage.run(context, () => {
            const result = body('name').string.required.value;
            expect(result).toBe('John');
        });
    });

    it('should throw BODY_UNDEFINED when body is undefined', () => {
        const context: RequestContext = {
            body: undefined,
            params: {}
        };

        requestStorage.run(context, () => {
            expect(() => body('name')).toThrow(ArgError);
            try {
                body('name');
            } catch (e) {
                expect((e as ArgError).code).toBe('BODY_UNDEFINED');
            }
        });
    });

    it('should throw BODY_NULL when body is null', () => {
        const context: RequestContext = {
            body: null,
            params: {}
        };

        requestStorage.run(context, () => {
            expect(() => body('name')).toThrow(ArgError);
            try {
                body('name');
            } catch (e) {
                expect((e as ArgError).code).toBe('BODY_NULL');
            }
        });
    });

    it('should throw BODY_ARRAY when body is an array', () => {
        const context: RequestContext = {
            body: [1, 2, 3],
            params: {}
        };

        requestStorage.run(context, () => {
            expect(() => body('name')).toThrow(ArgError);
            try {
                body('name');
            } catch (e) {
                expect((e as ArgError).code).toBe('BODY_ARRAY');
            }
        });
    });

    it('should support all validator types', () => {
        const context: RequestContext = {
            body: {
                name: 'John',
                age: 25,
                active: true,
                tags: ['a', 'b'],
                createdAt: '2024-01-15',
                status: 'active'
            },
            params: {}
        };

        requestStorage.run(context, () => {
            expect(body('name').string.required.value).toBe('John');
            expect(body('age').number.required.value).toBe(25);
            expect(body('active').boolean.required.value).toBe(true);
            expect(body('tags').array.ofStrings().value).toEqual(['a', 'b']);
            expect(body('createdAt').date.value).toBeInstanceOf(Date);
            expect(body('status').enum(['active', 'inactive']).value).toBe('active');
        });
    });
});

describe('params()', () => {
    it('should throw error when called outside of middleware context', () => {
        expect(() => params('id')).toThrow('body/params must be called inside validMiddleware context');
    });

    it('should return ValidBase for params field', () => {
        const context: RequestContext = {
            body: {},
            params: { id: '123', userId: '456' }
        };

        requestStorage.run(context, () => {
            const result = params('id').string.required.value;
            expect(result).toBe('123');
        });
    });

    it('should parse params as numbers', () => {
        const context: RequestContext = {
            body: {},
            params: { id: '42' }
        };

        requestStorage.run(context, () => {
            const result = params('id').number.required.value;
            expect(result).toBe(42);
        });
    });

    it('should handle missing params', () => {
        const context: RequestContext = {
            body: {},
            params: {}
        };

        requestStorage.run(context, () => {
            const result = params('id').number.value;
            expect(result).toBeUndefined();
        });
    });

    it('should throw REQUIRED for missing required param', () => {
        const context: RequestContext = {
            body: {},
            params: {}
        };

        requestStorage.run(context, () => {
            expect(() => params('id').number.required.value).toThrow(ArgError);
            try {
                params('id').number.required.value;
            } catch (e) {
                expect((e as ArgError).code).toBe('REQUIRED');
                expect((e as ArgError).field).toBe('id');
            }
        });
    });
});
