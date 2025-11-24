export enum AuditAction {
  // Authentication actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_SIGNUP = 'user.signup',
  TOKEN_REFRESH = 'token.refresh',
  PASSWORD_CHANGE = 'password.change',
  PASSWORD_RESET = 'password.reset',
  
  // User management actions
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_VIEW = 'user.view',
  USER_ROLE_CHANGE = 'user.role.change',
  
  // AI service actions
  AI_CHAT_CREATE = 'ai.chat.create',
  AI_CHAT_VIEW = 'ai.chat.view',
  AI_CHAT_DELETE = 'ai.chat.delete',
  AI_ANALYSIS_REQUEST = 'ai.analysis.request',
  AI_MODEL_CHANGE = 'ai.model.change',
  
  // Task/Job actions
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_DELETE = 'task.delete',
  TASK_VIEW = 'task.view',
  JOB_CREATE = 'job.create',
  JOB_CANCEL = 'job.cancel',
  JOB_VIEW = 'job.view',
  
  // Dashboard actions
  DASHBOARD_VIEW = 'dashboard.view',
  DASHBOARD_EXPORT = 'dashboard.export',
  
  // System actions
  SETTINGS_CHANGE = 'settings.change',
  PERMISSION_CHANGE = 'permission.change',
  ACCESS_DENIED = 'access.denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  action: AuditAction;
  status: AuditStatus;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  serviceName: string;
  duration?: number;
}
