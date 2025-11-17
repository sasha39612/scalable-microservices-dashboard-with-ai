"use strict";
/**
 * Standardized API response utilities
 * Provides consistent response formatting across all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLResponse = exports.ErrorCodes = exports.HttpStatus = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.paginatedResponse = paginatedResponse;
/**
 * Creates a successful API response
 */
function successResponse(data, message, requestId) {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        requestId,
    };
}
/**
 * Creates an error API response
 */
function errorResponse(code, message, details, stack, requestId) {
    return {
        success: false,
        error: {
            code,
            message,
            details,
            stack: process.env.NODE_ENV === 'development' ? stack : undefined,
        },
        timestamp: new Date().toISOString(),
        requestId,
    };
}
/**
 * Creates a paginated success response
 */
function paginatedResponse(data, page, limit, total, message, requestId) {
    return {
        success: true,
        data,
        message,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
        requestId,
    };
}
/**
 * HTTP status code constants
 */
exports.HttpStatus = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
/**
 * Common error codes
 */
exports.ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};
/**
 * Response wrapper for GraphQL
 */
class GraphQLResponse {
    success;
    data;
    error;
    message;
    constructor(success, data, error, message) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.message = message;
    }
    static success(data, message) {
        return new GraphQLResponse(true, data, undefined, message);
    }
    static error(code, message, details) {
        return new GraphQLResponse(false, undefined, { code, message, details });
    }
}
exports.GraphQLResponse = GraphQLResponse;
