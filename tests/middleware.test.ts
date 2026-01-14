import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestStorage, getContext, validMiddleware, RequestContext } from '../src/middleware';
import type { Request, Response, NextFunction } from 'express';

describe('middleware', () => {
    describe('requestStorage', () => {
        it('should be an AsyncLocalStorage instance', () => {
            expect(requestStorage).toBeDefined();
            expect(requestStorage.getStore).toBeDefined();
        });
    });

    describe('getContext', () => {
        it('should throw error when called outside of middleware context', () => {
            expect(() => getContext()).toThrow('body/params must be called inside validMiddleware context');
        });

        it('should return context when inside middleware', () => {
            const context: RequestContext = {
                body: { name: 'John' },
                params: { id: '123' }
            };

            requestStorage.run(context, () => {
                const ctx = getContext();
                expect(ctx.body).toEqual({ name: 'John' });
                expect(ctx.params).toEqual({ id: '123' });
            });
        });
    });

    describe('validMiddleware', () => {
        it('should create context from request and call next', () => {
            const req = {
                body: { name: 'John', age: 25 },
                params: { id: '123' }
            } as unknown as Request;

            const res = {} as Response;
            const next = vi.fn();

            validMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should make context available in next middleware', () => {
            const req = {
                body: { name: 'John' },
                params: { userId: '456' }
            } as unknown as Request;

            const res = {} as Response;

            let capturedContext: RequestContext | undefined;

            const next = vi.fn(() => {
                capturedContext = getContext();
            });

            validMiddleware(req, res, next);

            expect(capturedContext).toBeDefined();
            expect(capturedContext?.body).toEqual({ name: 'John' });
            expect(capturedContext?.params).toEqual({ userId: '456' });
        });

        it('should handle undefined body', () => {
            const req = {
                body: undefined,
                params: {}
            } as unknown as Request;

            const res = {} as Response;
            const next = vi.fn();

            validMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
