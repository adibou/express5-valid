import { ErrorRequestHandler } from "express";
import ArgError from "./arg-error";

const validErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (error instanceof ArgError) {
        res.status(400).json({
            error: error.message,
            code: 400,
            errorCode: error.code,
            params: error.params,
            field: error.field,
            url: req.originalUrl,
            message: error.msg
        });
    } else {
        next(error);
    }
};

export default validErrorHandler;