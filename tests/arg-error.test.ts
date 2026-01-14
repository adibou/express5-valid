import { describe, it, expect } from 'vitest';
import ArgError from '../src/arg-error';

describe('ArgError', () => {
    it('should create error with all properties', () => {
        const error = new ArgError('body.name', 'REQUIRED', 'is required');

        expect(error).toBeInstanceOf(Error);
        expect(error.field).toBe('body.name');
        expect(error.code).toBe('REQUIRED');
        expect(error.details).toBe('is required');
        expect(error.params).toEqual({});
        expect(error.message).toBe('body.name is required');
    });

    it('should include params when provided', () => {
        const error = new ArgError('body.age', 'MAX_VALUE', 'must be at most 150', { max: 150 });

        expect(error.field).toBe('body.age');
        expect(error.code).toBe('MAX_VALUE');
        expect(error.details).toBe('must be at most 150');
        expect(error.params).toEqual({ max: 150 });
    });

    it('should return details via msg getter', () => {
        const error = new ArgError('params.id', 'INVALID_NUMBER', 'must be a valid number');

        expect(error.msg).toBe('must be a valid number');
    });

    it('should work with complex params', () => {
        const error = new ArgError('body.status', 'NOT_IN_LIST', 'must be one of: active, inactive', {
            allowed: ['active', 'inactive']
        });

        expect(error.params).toEqual({ allowed: ['active', 'inactive'] });
    });
});
