import 'reflect-metadata';
import { validate, EnvironmentVariables } from '../../src/config/env.validation';

describe('EnvironmentVariables validation', () => {
  it('should validate correct environment variables', () => {
    const env = {
      NODE_ENV: 'development',
      PORT: '3000',                 // string from process.env
      DATABASE_URL: 'postgres://db' // string
    };

    const validated = validate({
      ...env,
      PORT: Number(env.PORT) // convert string -> number
    });

    expect(validated).toBeInstanceOf(EnvironmentVariables);
    expect(validated.PORT).toBe(3000);
    expect(validated.DATABASE_URL).toBe('postgres://db');
  });
});
