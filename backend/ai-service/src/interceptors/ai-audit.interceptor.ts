import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { aiServiceAuditLogger, AuditAction } from 'common';

/**
 * Interceptor to audit AI service operations
 */
@Injectable()
export class AIAuditInterceptor implements NestInterceptor {
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
    if (url.includes('/chat') && method === 'POST') {
      action = AuditAction.AI_CHAT_CREATE;
    } else if (url.includes('/insights') && method === 'POST') {
      action = AuditAction.AI_ANALYSIS_REQUEST;
    } else if (url.includes('/conversation') && method === 'GET') {
      action = AuditAction.AI_CHAT_VIEW;
    } else if (url.includes('/conversation') && method === 'DELETE') {
      action = AuditAction.AI_CHAT_DELETE;
    }
    
    // Skip non-auditable operations
    if (!action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - startTime;
        
        await aiServiceAuditLogger.logSuccess(
          action!,
          userId,
          {
            userEmail,
            userRole,
            ipAddress,
            userAgent: headers['user-agent'],
            resource: 'ai-service',
            metadata: {
              endpoint: url,
              method,
              requestSize: JSON.stringify(body).length,
              responseTime: duration,
            },
            duration,
          }
        );
      }),
      catchError(async (error: Error) => {
        const duration = Date.now() - startTime;
        
        await aiServiceAuditLogger.logError(
          action!,
          userId,
          error,
          {
            userEmail,
            userRole,
            ipAddress,
            userAgent: headers['user-agent'],
            resource: 'ai-service',
            metadata: {
              endpoint: url,
              method,
              requestSize: JSON.stringify(body).length,
            },
            duration,
          }
        );
        
        throw error;
      })
    );
  }
}
