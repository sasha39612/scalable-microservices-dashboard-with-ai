# @microservices-dashboard/common

Shared library for microservices-dashboard backend microservices.
Provides reusable DTOs, entities, validation, error handling, logging, and configuration to ensure consistency across all services.

## 📦 Features

* DTOs – Standardized data transfer objects for input/output.
* Entities – Shared database models (TypeORM/Prisma/Sequelize compatible).
* Validation – Centralized class-validator utilities with consistent error handling.
* Errors – Custom error classes with structured error codes.
* Logging – Shared Winston-based logger.
* Config – Centralized environment configuration loader and validation.

## 🗂️ Directory Structure

```bash
src/
├── dto/                # Shared Data Transfer Objects
├── entities/           # Database entities
├── validation/         # Validation utilities
├── errors/             # Custom error classes
├── logging/            # Logger setup
├── config/             # App configuration & env validation
└── index.ts            # Export all modules
```

## ⚙️ Installation

This module is intended for local use in microservices, imported via path alias or relative import.

# From root of microservices-dashboard

```bash
 backend/common
npm install
npm run build
```

## 🔗 Usage

### Import shared modules

Using TypeScript path alias (@common) or relative imports:

```bash
import { logger, AppError } from "@common";
import { validateDto, ValidationException } from "@common/validation";
import { CreateUserDto } from "@common/dto";

Example: Validate DTO
async function registerUser(reqBody: any) {
  try {
    const dto = await validateDto(CreateUserDto, reqBody);
    console.log("Validated DTO:", dto);
  } catch (err) {
    if (err instanceof ValidationException) {
      console.error("Validation errors:", err.errors);
    }
  }
}
```

### Example: Logger

```bash
import { logger } from "@common";

logger.info("Service started successfully");
logger.error("Something went wrong", { context: "registerUser" });

🛠 Scripts
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "rm -rf dist"
  }
}
```

build – Compile TypeScript into dist/.
clean – Remove compiled files.

## ⚡ Notes

* Always use validateDto for input validation across services.
* Use AppError and structured error codes for consistent error handling.
* This library should be imported only by backend services, not frontend.
