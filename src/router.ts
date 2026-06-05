import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { requestStorage, RequestContext } from './middleware';

type JsonHandler = (req: Request, res: Response) => unknown | Promise<unknown>;
type Middleware = RequestHandler;

export interface JsonRouter {
    get: (path: string, handler: JsonHandler, ...middlewares: Middleware[]) => JsonRouter;
    post: (path: string, handler: JsonHandler, ...middlewares: Middleware[]) => JsonRouter;
    put: (path: string, handler: JsonHandler, ...middlewares: Middleware[]) => JsonRouter;
    patch: (path: string, handler: JsonHandler, ...middlewares: Middleware[]) => JsonRouter;
    delete: (path: string, handler: JsonHandler, ...middlewares: Middleware[]) => JsonRouter;
    router: Router;
}

function wrapHandler(handler: JsonHandler) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Créer le contexte ici, quand les params sont disponibles
        const context: RequestContext = {
            body: req.body,
            params: req.params as Record<string, unknown>,
            query: req.query as Record<string, unknown>,
        };

        requestStorage.run(context, async () => {
            try {
                const result = await handler(req, res);

                if (res.headersSent) {
                    return;
                }

                if (result === undefined || result === null) {
                    res.status(204).end();
                } else {
                    res.json(result);
                }
            } catch (error) {
                next(error);
            }
        });
    };
}

export function createJsonRouter(): JsonRouter {
    const expressRouter = Router();

    const jsonRouter: JsonRouter = {
        router: expressRouter,
        get: (path, handler, ...middlewares) => {
            expressRouter.get(path, ...middlewares, wrapHandler(handler));
            return jsonRouter;
        },
        post: (path, handler, ...middlewares) => {
            expressRouter.post(path, ...middlewares, wrapHandler(handler));
            return jsonRouter;
        },
        put: (path, handler, ...middlewares) => {
            expressRouter.put(path, ...middlewares, wrapHandler(handler));
            return jsonRouter;
        },
        patch: (path, handler, ...middlewares) => {
            expressRouter.patch(path, ...middlewares, wrapHandler(handler));
            return jsonRouter;
        },
        delete: (path, handler, ...middlewares) => {
            expressRouter.delete(path, ...middlewares, wrapHandler(handler));
            return jsonRouter;
        },
    };

    return jsonRouter;
}
