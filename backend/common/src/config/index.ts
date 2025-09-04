import { config } from "dotenv";
import { validate, EnvironmentVariables } from "./env.validation";

config(); // Load from .env
export const appConfig: EnvironmentVariables = validate(process.env);
