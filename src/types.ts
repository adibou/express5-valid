export type ParamType = 'body' | 'params';

export interface NumberArrayConfig {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;
}

export interface StringArrayConfig {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    trim?: boolean;
}
