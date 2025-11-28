import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { workerServiceAuditLogger, AuditAction } from 'common';

/**
 * Interceptor to audit Worker service operations
 */
@Injectable()
export class WorkerAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    
    // Extract user info from headers (set by API Gateway)
    const userId = headers['x-user-id'];
    const userEmail = headers['x-user-email'];
    const userRole = headers['x-user-role'];
    const ipAddress = headers['x-forwarded-for']?.split(',')[0] || request.ip;
    
    const startTime = Date.now();
    let action: AuditAction | undefined;
    
    // Map endpoint to audit action
    if (url.includes('/tasks') && method === 'POST') {
      action = AuditAction.TASK_CREATE;
    } else if (url.includes('/tasks') && method === 'PUT') {
      action = AuditAction.TASK_UPDATE;
    } else if (url.includes('/tasks') && method === 'DELETE') {
      action = AuditAction.TASK_DELETE;
    } else if (url.includes('/tasks') && method === 'GET') {
      action = AuditAction.TASK_VIEW;
    } else if (url.includes('/jobs') && method === 'POST') {
      action = AuditAction.JOB_CREATE;
    } else if (url.includes('/jobs') && method === 'DELETE') {
      action = AuditAction.JOB_CANCEL;
    } else if (url.includes('/jobs') && method === 'GET') {
      action = AuditAction.JOB_VIEW;
    }
    
    // Skip non-auditable operations (health checks, etc.)
    if (!action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - startTime;
        
        await workerServiceAuditLogger.logSuccess(
          action!,
          userId,
          {
            userEmail,
            userRole,
            ipAddress,
            userAgent: headers['user-agent'],
            resource: url.includes('/tasks') ? 'task' : 'job',
            resourceId: body?.id || url.split('/').pop(),
            metadata: {
              endpoint: url,
              method,
              duration,
            },
          }
        );
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        await workerServiceAuditLogger.logError(
          action!,
          userId,
          error,
          {
            userEmail,
            userRole,
            ipAddress,
            userAgent: headers['user-agent'],
            resource: url.includes('/tasks') ? 'task' : 'job',
            resourceId: body?.id || url.split('/').pop(),
            metadata: {
              endpoint: url,
              method,
              duration,
              error: error.message,
            },
          }
        );
        
        throw error;
      })
    );
  }
}
