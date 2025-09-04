import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";

/**
 * Runs class-validator against a DTO instance
 */
export async function validateDto<T extends object>(
  dtoClass: new () => T,
  plain: object
): Promise<T> {
  const instance = plainToInstance(dtoClass, plain);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return instance;
}

/**
 * Custom exception for validation errors
 */
export class ValidationException extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super("Validation failed");
    this.errors = errors;
  }
}
