import 'reflect-metadata'
import { validate, EnvironmentVariables } from '../../src/config/env.validation';

describe('Environment Validation', () => {
  it('should validate correct environment variables', () => {
    const env = { NODE_ENV: 'development', PORT: 3000, DATABASE_URL: 'postgres://test' };
    const validated = validate(env);
    expect(validated).toBeInstanceOf(EnvironmentVariables);
    expect(validated.PORT).toBe(3000);
  });

  it('should throw for missing variables', () => {
    const env = { NODE_ENV: 'development', PORT: 3000 }; // missing DATABASE_URL
    expect(() => validate(env)).toThrow();
  });
});
