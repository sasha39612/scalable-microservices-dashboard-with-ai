"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AppError = AppError;
