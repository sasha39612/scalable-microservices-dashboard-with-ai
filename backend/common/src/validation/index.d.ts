import { ValidationError } from "class-validator";
/**
 * Runs class-validator against a DTO instance
 */
export declare function validateDto<T extends object>(dtoClass: new () => T, plain: object): Promise<T>;
/**
 * Custom exception for validation errors
 */
export declare class ValidationException extends Error {
    readonly errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
