export interface ErrorParams {
    [key: string]: unknown;
}

export default class ArgError extends Error {
    field: string;
    code: string;
    details: string;
    params: ErrorParams;

    constructor(field: string, code: string, details: string, params: ErrorParams = {}) {
        super(`${field} ${details}`);
        this.field = field;
        this.code = code;
        this.details = details;
        this.params = params;
    }

    get msg(): string {
        return this.details;
    }
}