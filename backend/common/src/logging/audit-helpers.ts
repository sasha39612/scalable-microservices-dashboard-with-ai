export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract audit context from Express request
 */
export function extractAuditContext(req: { user?: { sub?: string; id?: string; userId?: string; email?: string; role?: string }; headers: Record<string, string | string[] | undefined>; connection?: { remoteAddress?: string }; socket?: { remoteAddress?: string }; ip?: string }): AuditContext {
  const context: AuditContext = {};

  // Extract user info from JWT payload (if authenticated)
  if (req.user) {
    context.userId = req.user.sub || req.user.id || req.user.userId;
    context.userEmail = req.user.email;
    context.userRole = req.user.role;
  }

  // Extract IP address
  context.ipAddress = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] as string ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;

  // Extract user agent
  context.userAgent = req.headers['user-agent'] as string;

  return context;
}

/**
 * Extract audit context from GraphQL context
 */
export function extractAuditContextFromGraphQL(context: { req?: { user?: { sub?: string; id?: string; userId?: string; email?: string; role?: string }; headers: Record<string, string | string[] | undefined>; connection?: { remoteAddress?: string }; socket?: { remoteAddress?: string }; ip?: string } }): AuditContext {
  const auditContext: AuditContext = {};

  // Extract user info from GraphQL context
  if (context.req?.user) {
    auditContext.userId = context.req.user.sub || context.req.user.id || context.req.user.userId;
    auditContext.userEmail = context.req.user.email;
    auditContext.userRole = context.req.user.role;
  }

  // Extract IP address
  const req = context.req;
  if (req) {
    auditContext.ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip;

    // Extract user agent
    auditContext.userAgent = req.headers['user-agent'] as string;
  }

  return auditContext;
}

/**
 * Sanitize metadata to remove sensitive information
 */
export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...metadata };
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'refreshToken',
    'accessToken',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'creditCard',
    'ssn',
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeMetadata(sanitized[key] as Record<string, unknown>);
    }
  }

  return sanitized;
}
