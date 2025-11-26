import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from "class-validator";

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

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsString()
  REDIS_PORT?: string;

  @IsOptional()
  @IsString()
  WORKER_SERVICE_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  // Convert PORT to number
  const converted = {
    ...config,
    PORT: config.PORT !== undefined ? Number(config.PORT) : undefined,
    DATABASE_URL: config.DATABASE_URL ?? undefined,
    OPENAI_API_KEY: config.OPENAI_API_KEY ?? undefined,
    REDIS_URL: config.REDIS_URL ?? undefined,
    REDIS_PASSWORD: config.REDIS_PASSWORD ?? undefined,
    REDIS_HOST: config.REDIS_HOST ?? undefined,
    REDIS_PORT: config.REDIS_PORT ?? undefined,
    WORKER_SERVICE_URL: config.WORKER_SERVICE_URL ?? undefined,
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
