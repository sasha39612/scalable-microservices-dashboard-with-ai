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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
      tap(async (result: any) => {
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
      catchError(async (error: any) => {
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

  private extractResourceId(result: any, args: any): string | undefined {
    if (!result) return undefined;
    
    // Try to extract ID from result
    if (result.id) return result.id;
    if (result.data?.id) return result.data.id;
    
    // Try to extract ID from args
    if (args.id) return args.id;
    if (args.input?.id) return args.input.id;
    
    return undefined;
  }

  private sanitizeArgs(args: any): any {
    const sanitized = { ...args };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;
    
    if (sanitized.input) {
      delete sanitized.input.password;
      delete sanitized.input.refreshToken;
      delete sanitized.input.accessToken;
    }
    
    return sanitized;
  }
}
