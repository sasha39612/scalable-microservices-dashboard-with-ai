export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly details?: string | undefined;
    constructor(message: string, statusCode?: number, details?: string | undefined);
}
