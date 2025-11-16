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
export function successResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
): ApiResponse<T> {
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
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  stack?: string,
  requestId?: string,
): ApiResponse {
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
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  requestId?: string,
): PaginatedResponse<T> {
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
export const HttpStatus = {
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
} as const;

/**
 * Common error codes
 */
export const ErrorCodes = {
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
} as const;

/**
 * Response wrapper for GraphQL
 */
export class GraphQLResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  message?: string;

  constructor(
    success: boolean,
    data?: T,
    error?: ErrorDetails,
    message?: string,
  ) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
  }

  static success<T>(data: T, message?: string): GraphQLResponse<T> {
    return new GraphQLResponse(true, data, undefined, message);
  }

  static error(
    code: string,
    message: string,
    details?: unknown,
  ): GraphQLResponse {
    return new GraphQLResponse(false, undefined, { code, message, details });
  }
}
