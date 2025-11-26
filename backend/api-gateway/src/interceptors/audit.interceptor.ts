import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { 
  apiGatewayAuditLogger, 
  AuditAction, 
  extractAuditContextFromGraphQL,
  sanitizeMetadata 
} from 'common';

/**
 * Interceptor to automatically log audit events for GraphQL operations
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly actionMap: Map<string, AuditAction> = new Map([
    // Auth operations
    ['signup', AuditAction.USER_SIGNUP],
    ['login', AuditAction.USER_LOGIN],
    ['logout', AuditAction.USER_LOGOUT],
    ['refreshTokens', AuditAction.TOKEN_REFRESH],
    
    // User operations
    ['createUser', AuditAction.USER_CREATE],
    ['updateUser', AuditAction.USER_UPDATE],
    ['deleteUser', AuditAction.USER_DELETE],
    ['user', AuditAction.USER_VIEW],
    ['users', AuditAction.USER_VIEW],
    ['updateUserRole', AuditAction.USER_ROLE_CHANGE],
    
    // AI operations
    ['createChat', AuditAction.AI_CHAT_CREATE],
    ['getChat', AuditAction.AI_CHAT_VIEW],
    ['deleteChat', AuditAction.AI_CHAT_DELETE],
    ['analyzeData', AuditAction.AI_ANALYSIS_REQUEST],
    
    // Task operations
    ['createTask', AuditAction.TASK_CREATE],
    ['updateTask', AuditAction.TASK_UPDATE],
    ['deleteTask', AuditAction.TASK_DELETE],
    ['task', AuditAction.TASK_VIEW],
    ['tasks', AuditAction.TASK_VIEW],
    
    // Job operations
    ['createJob', AuditAction.JOB_CREATE],
    ['cancelJob', AuditAction.JOB_CANCEL],
    ['job', AuditAction.JOB_VIEW],
    ['jobs', AuditAction.JOB_VIEW],
    
    // Dashboard operations
    ['dashboard', AuditAction.DASHBOARD_VIEW],
    ['exportDashboard', AuditAction.DASHBOARD_EXPORT],
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const ctx = gqlContext.getContext();
    const args = gqlContext.getArgs();
    
    const operationName = info?.fieldName;
    const action = this.actionMap.get(operationName);
    
    // Only audit mapped operations
    if (!action) {
      return next.handle();
    }

    const startTime = Date.now();
    const auditContext = extractAuditContextFromGraphQL(ctx);

    return next.handle().pipe(
      tap(async (result: unknown) => {
        const duration = Date.now() - startTime;
        
        // Log successful operation
        await apiGatewayAuditLogger.logSuccess(
          action,
          auditContext.userId,
          {
            userEmail: auditContext.userEmail,
            userRole: auditContext.userRole,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            resource: operationName,
            resourceId: this.extractResourceId(result, args),
            metadata: sanitizeMetadata({
              operationType: info.operation.operation,
              operationName: info.operation.name?.value,
              args: this.sanitizeArgs(args),
            }),
            duration,
          }
        );
      }),
      catchError(async (error: Error) => {
        const duration = Date.now() - startTime;
        
        // Log failed operation
        await apiGatewayAuditLogger.logError(
          action,
          auditContext.userId,
          error,
          {
            userEmail: auditContext.userEmail,
            userRole: auditContext.userRole,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            resource: operationName,
            metadata: sanitizeMetadata({
              operationType: info.operation.operation,
              operationName: info.operation.name?.value,
              args: this.sanitizeArgs(args),
            }),
            duration,
          }
        );
        
        throw error;
      })
    );
  }

  private extractResourceId(result: unknown, args: Record<string, unknown>): string | undefined {
    if (!result) return undefined;
    
    // Try to extract ID from result
    if (typeof result === 'object' && result !== null) {
      const resultObj = result as Record<string, unknown>;
      if (typeof resultObj.id === 'string') return resultObj.id;
      if (typeof resultObj.data === 'object' && resultObj.data !== null) {
        const dataObj = resultObj.data as Record<string, unknown>;
        if (typeof dataObj.id === 'string') return dataObj.id;
      }
    }
    
    // Try to extract ID from args
    if (typeof args.id === 'string') return args.id;
    if (typeof args.input === 'object' && args.input !== null) {
      const inputObj = args.input as Record<string, unknown>;
      if (typeof inputObj.id === 'string') return inputObj.id;
    }
    
    return undefined;
  }

  private sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...args };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;
    
    if (typeof sanitized.input === 'object' && sanitized.input !== null) {
      const inputObj = sanitized.input as Record<string, unknown>;
      delete inputObj.password;
      delete inputObj.refreshToken;
      delete inputObj.accessToken;
    }
    
    return sanitized;
  }
}
