/**
 * Standardized API response utilities
 * Provides consistent response formatting across all microservices
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ErrorDetails;
    message?: string;
    timestamp: string;
    requestId?: string;
}
export interface ErrorDetails {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
/**
 * Creates a successful API response
 */
export declare function successResponse<T>(data: T, message?: string, requestId?: string): ApiResponse<T>;
/**
 * Creates an error API response
 */
export declare function errorResponse(code: string, message: string, details?: unknown, stack?: string, requestId?: string): ApiResponse;
/**
 * Creates a paginated success response
 */
export declare function paginatedResponse<T>(data: T[], page: number, limit: number, total: number, message?: string, requestId?: string): PaginatedResponse<T>;
/**
 * HTTP status code constants
 */
export declare const HttpStatus: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * Common error codes
 */
export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    readonly AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
};
/**
 * Response wrapper for GraphQL
 */
export declare class GraphQLResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ErrorDetails;
    message?: string;
    constructor(success: boolean, data?: T, error?: ErrorDetails, message?: string);
    static success<T>(data: T, message?: string): GraphQLResponse<T>;
    static error(code: string, message: string, details?: unknown): GraphQLResponse;
}
