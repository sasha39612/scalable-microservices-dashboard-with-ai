"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationException = void 0;
exports.validateDto = validateDto;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
/**
 * Runs class-validator against a DTO instance
 */
async function validateDto(dtoClass, plain) {
    const instance = (0, class_transformer_1.plainToInstance)(dtoClass, plain);
    const errors = await (0, class_validator_1.validate)(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
        throw new ValidationException(errors);
    }
    return instance;
}
/**
 * Custom exception for validation errors
 */
class ValidationException extends Error {
    errors;
    constructor(errors) {
        super("Validation failed");
        this.errors = errors;
    }
}
exports.ValidationException = ValidationException;
