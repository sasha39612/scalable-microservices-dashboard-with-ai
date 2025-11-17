"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = require("dotenv");
const env_validation_1 = require("./env.validation");
(0, dotenv_1.config)(); // Load from .env
exports.appConfig = (0, env_validation_1.validate)(process.env);
