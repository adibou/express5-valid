import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, Response, NextFunction } from "express";

export interface RequestContext {
    body: unknown;
    params: Record<string, unknown>;
}

export const requestStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
    const ctx = requestStorage.getStore();
    if (!ctx) {
        throw new Error('body/params must be called inside validMiddleware context');
    }
    return ctx;
}

export function validMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const context: RequestContext = {
        body: req.body,
        params: req.params as Record<string, unknown>,
    };

    requestStorage.run(context, next);
}

