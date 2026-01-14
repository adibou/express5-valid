import { Router, Request, Response, NextFunction } from 'express';
import { requestStorage, RequestContext } from './middleware';

type JsonHandler = (req: Request, res: Response) => unknown | Promise<unknown>;

export interface JsonRouter {
    get: (path: string, handler: JsonHandler) => JsonRouter;
    post: (path: string, handler: JsonHandler) => JsonRouter;
    put: (path: string, handler: JsonHandler) => JsonRouter;
    patch: (path: string, handler: JsonHandler) => JsonRouter;
    delete: (path: string, handler: JsonHandler) => JsonRouter;
    router: Router;
}

function wrapHandler(handler: JsonHandler) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Créer le contexte ici, quand les params sont disponibles
        const context: RequestContext = {
            body: req.body,
            params: req.params as Record<string, unknown>,
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
        get: (path, handler) => {
            expressRouter.get(path, wrapHandler(handler));
            return jsonRouter;
        },
        post: (path, handler) => {
            expressRouter.post(path, wrapHandler(handler));
            return jsonRouter;
        },
        put: (path, handler) => {
            expressRouter.put(path, wrapHandler(handler));
            return jsonRouter;
        },
        patch: (path, handler) => {
            expressRouter.patch(path, wrapHandler(handler));
            return jsonRouter;
        },
        delete: (path, handler) => {
            expressRouter.delete(path, wrapHandler(handler));
            return jsonRouter;
        },
    };

    return jsonRouter;
}
