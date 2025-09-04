import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  // Convert PORT to number
  const converted = {
    ...config,
    PORT: config.PORT !== undefined ? Number(config.PORT) : undefined,
    DATABASE_URL: config.DATABASE_URL ?? undefined,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, converted, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
