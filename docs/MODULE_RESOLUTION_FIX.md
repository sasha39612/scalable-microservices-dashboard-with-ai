# TypeScript Module Resolution Fix

## Issue

After fixing lint errors, `ai-service` and `worker-service` failed to build with:
```
Cannot find module 'common' or its corresponding type declarations
```

## Root Cause

`ai-service` and `worker-service` lacked TypeScript path mapping for the shared `common` package, while `api-gateway` already had it configured.

## Fix

Added path mapping to both services' `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "common": ["../common/src"],
      "common/*": ["../common/src/*"]
    }
  },
  "include": ["src", "../common/src"],
  "exclude": ["node_modules", "dist"]
}
```

Files modified:
- `backend/ai-service/tsconfig.json`
- `backend/worker-service/tsconfig.json`

## Related Lint Fixes Made in the Same Pass

- `backend/common/src/logging/audit-logger.ts` — `metadata?: Record<string, any>` → `Record<string, unknown>` in `logSuccess()`, `logFailure()`, `logError()`.
- `backend/api-gateway/src/modules/tasks/tasks.service.ts` — removed `console.warn()` calls and unused `catch (error)` parameters.
- `backend/api-gateway/src/services/audit-logger-initializer.ts` — removed `console.log`/`console.error` and an unused catch parameter.
- `backend/worker-service/src/guards/api-key.guard.ts` — removed a `console.warn()` about missing API key.
