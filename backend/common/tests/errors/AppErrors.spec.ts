import { AppError } from '../../src/errors/AppError';

describe('AppError', () => {
  it('should create an error with default statusCode', () => {
    const error = new AppError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500); // default
    expect(error.details).toBeUndefined();
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should create an error with custom statusCode and details', () => {
    const details = { field: 'email', issue: 'invalid' };
    const error = new AppError('Validation failed', 400, details);

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
    expect(error instanceof AppError).toBe(true);
  });
});
