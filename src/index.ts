import ArgError from "./arg-error";
import ValidBase from "./valid-base";
import { getContext } from "./middleware";

export { ArgError };
export { validMiddleware } from "./middleware";
export { default as validErrorHandler } from "./valid-error-handler";
export { createJsonRouter, type JsonRouter } from "./router";
export type { NumberArrayConfig, StringArrayConfig } from "./types";

export function body(name: string): ValidBase {
    const ctx = getContext();
    if (ctx.body === undefined) {
        throw new ArgError('body', 'BODY_UNDEFINED', 'body must be defined');
    }
    if (ctx.body === null) {
        throw new ArgError('body', 'BODY_NULL', 'body must not be null');
    }
    if (Array.isArray(ctx.body)) {
        throw new ArgError('body', 'BODY_ARRAY', 'body must not be an array');
    }
    return validArgument(ctx.body as Record<string, unknown>, name);
}

export function params(name: string): ValidBase {
    const ctx = getContext();
    return validArgument(ctx.params, name);
}

export function validArgument(obj: Record<string, unknown>, name: string): ValidBase {
    return new ValidBase(obj[name], name);
}
