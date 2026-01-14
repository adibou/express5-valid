import { describe, it, expect, vi } from 'vitest';
import { createJsonRouter } from '../src/router';
import { getContext } from '../src/middleware';
import type { Request, Response, NextFunction } from 'express';

describe('createJsonRouter', () => {
    function createMockReq(overrides: Partial<Request> = {}): Request {
        return {
            body: {},
            params: {},
            ...overrides
        } as Request;
    }

    function createMockRes(): Response & { _status: number; _json: unknown; _ended: boolean } {
        const res = {
            _status: 200,
            _json: null as unknown,
            _ended: false,
            headersSent: false,
            status(code: number) {
                this._status = code;
                return this;
            },
            json(data: unknown) {
                this._json = data;
                this.headersSent = true;
                return this;
            },
            end() {
                this._ended = true;
                this.headersSent = true;
                return this;
            }
        };
        return res as Response & { _status: number; _json: unknown; _ended: boolean };
    }

    it('should create a JsonRouter with all methods', () => {
        const jsonRouter = createJsonRouter();

        expect(jsonRouter.get).toBeDefined();
        expect(jsonRouter.post).toBeDefined();
        expect(jsonRouter.put).toBeDefined();
        expect(jsonRouter.patch).toBeDefined();
        expect(jsonRouter.delete).toBeDefined();
        expect(jsonRouter.router).toBeDefined();
    });

    it('should return itself for chaining', () => {
        const jsonRouter = createJsonRouter();

        const result = jsonRouter
            .get('/test', () => ({}))
            .post('/test', () => ({}))
            .put('/test', () => ({}))
            .patch('/test', () => ({}))
            .delete('/test', () => ({}));

        expect(result).toBe(jsonRouter);
    });

    describe('handler wrapping', () => {
        it('should return JSON for object result', async () => {
            const jsonRouter = createJsonRouter();
            jsonRouter.get('/test', () => ({ message: 'hello' }));

            // Get the wrapped handler from the express router
            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            // Wait for async execution
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res._json).toEqual({ message: 'hello' });
        });

        it('should return 204 for null result', async () => {
            const jsonRouter = createJsonRouter();
            jsonRouter.post('/test', () => null);

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res._status).toBe(204);
            expect(res._ended).toBe(true);
        });

        it('should return 204 for undefined result', async () => {
            const jsonRouter = createJsonRouter();
            jsonRouter.delete('/test', () => undefined);

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res._status).toBe(204);
            expect(res._ended).toBe(true);
        });

        it('should call next with error on exception', async () => {
            const jsonRouter = createJsonRouter();
            const testError = new Error('Test error');

            jsonRouter.get('/test', () => {
                throw testError;
            });

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(next).toHaveBeenCalledWith(testError);
        });

        it('should not send response if headers already sent', async () => {
            const jsonRouter = createJsonRouter();

            jsonRouter.get('/test', (_req, res) => {
                res.status(201).json({ custom: true });
                return { should: 'not appear' };
            });

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res._json).toEqual({ custom: true });
            expect(res._status).toBe(201);
        });

        it('should create request context with body and params', async () => {
            const jsonRouter = createJsonRouter();
            let capturedContext: { body: unknown; params: unknown } | undefined;

            jsonRouter.post('/users/:id', () => {
                capturedContext = {
                    body: getContext().body,
                    params: getContext().params
                };
                return { ok: true };
            });

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq({
                body: { name: 'John' },
                params: { id: '123' }
            });
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(capturedContext).toBeDefined();
            expect(capturedContext?.body).toEqual({ name: 'John' });
            expect(capturedContext?.params).toEqual({ id: '123' });
        });

        it('should handle async handlers', async () => {
            const jsonRouter = createJsonRouter();

            jsonRouter.get('/test', async () => {
                await new Promise(resolve => setTimeout(resolve, 5));
                return { async: true };
            });

            const route = jsonRouter.router.stack[0];
            const handler = route?.route?.stack[0]?.handle;

            const req = createMockReq();
            const res = createMockRes();
            const next = vi.fn();

            await handler?.(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 20));

            expect(res._json).toEqual({ async: true });
        });
    });
});
