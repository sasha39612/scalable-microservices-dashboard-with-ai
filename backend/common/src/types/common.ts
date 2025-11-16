/**
 * Common types, enums, and interfaces shared across all microservices
 */

// ============================================================================
// Environment & Configuration
// ============================================================================

/**
 * Application environment types
 */
export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Staging = "staging",
}

/**
 * Log levels for application logging
 */
export enum LogLevel {
  Error = "error",
  Warn = "warn",
  Info = "info",
  Debug = "debug",
  Verbose = "verbose",
}

// ============================================================================
// User & Authentication
// ============================================================================

/**
 * User roles for authorization
 */
export enum UserRole {
  Admin = "admin",
  User = "user",
  Moderator = "moderator",
  Guest = "guest",
}

/**
 * User account status
 */
export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
  Pending = "pending",
  Deleted = "deleted",
}

/**
 * Authentication provider types
 */
export enum AuthProvider {
  Local = "local",
  Google = "google",
  GitHub = "github",
  Facebook = "facebook",
  Apple = "apple",
}

/**
 * JWT token payload interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Authentication context for requests
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

// ============================================================================
// HTTP & API
// ============================================================================

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
}

/**
 * Response metadata for additional context
 */
export interface ResponseMetadata {
  timestamp: Date;
  requestId?: string;
  version?: string;
  duration?: number;
}

// ============================================================================
// Pagination & Filtering
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated data with metadata
 */
export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Sort order for queries
 */
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/**
 * Generic sort parameters
 */
export interface SortParams {
  field: string;
  order: SortOrder;
}

/**
 * Filter operators for queries
 */
export enum FilterOperator {
  Equal = "eq",
  NotEqual = "ne",
  GreaterThan = "gt",
  GreaterThanOrEqual = "gte",
  LessThan = "lt",
  LessThanOrEqual = "lte",
  Like = "like",
  In = "in",
  NotIn = "notIn",
  IsNull = "isNull",
  IsNotNull = "isNotNull",
}

/**
 * Generic filter parameter
 */
export interface FilterParam {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

// ============================================================================
// Database & Entities
// ============================================================================

/**
 * Base entity timestamps
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft delete functionality
 */
export interface SoftDeletable {
  deletedAt?: Date | null;
  isDeleted: boolean;
}

/**
 * Entity with audit trail
 */
export interface Auditable extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// Events & Messaging
// ============================================================================

/**
 * Event types for inter-service communication
 */
export enum EventType {
  UserCreated = "user.created",
  UserUpdated = "user.updated",
  UserDeleted = "user.deleted",
  DashboardViewed = "dashboard.viewed",
  DashboardUpdated = "dashboard.updated",
  JobScheduled = "job.scheduled",
  JobCompleted = "job.completed",
  JobFailed = "job.failed",
  NotificationSent = "notification.sent",
  AIAnalysisRequested = "ai.analysis.requested",
  AIAnalysisCompleted = "ai.analysis.completed",
}

/**
 * Base event structure
 */
export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  source: string; // Service name
  correlationId?: string;
  userId?: string;
}

/**
 * Event with payload
 */
export interface Event<T = unknown> extends BaseEvent {
  payload: T;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Jobs & Workers
// ============================================================================

/**
 * Job status for background tasks
 */
export enum JobStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
  Retrying = "retrying",
}

/**
 * Job priority levels
 */
export enum JobPriority {
  Low = 1,
  Normal = 5,
  High = 10,
  Critical = 20,
}

/**
 * Background job interface
 */
export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  priority: JobPriority;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: unknown;
}

// ============================================================================
// Dashboard & Analytics
// ============================================================================

/**
 * Dashboard widget types
 */
export enum WidgetType {
  Chart = "chart",
  Table = "table",
  Metric = "metric",
  Text = "text",
  Map = "map",
  Custom = "custom",
}

/**
 * Chart types for visualization
 */
export enum ChartType {
  Line = "line",
  Bar = "bar",
  Pie = "pie",
  Doughnut = "doughnut",
  Area = "area",
  Scatter = "scatter",
  Radar = "radar",
}

/**
 * Time range for analytics
 */
export enum TimeRange {
  Hour = "1h",
  Day = "1d",
  Week = "1w",
  Month = "1m",
  Quarter = "3m",
  Year = "1y",
  Custom = "custom",
}

/**
 * Metric aggregation types
 */
export enum AggregationType {
  Sum = "sum",
  Average = "avg",
  Min = "min",
  Max = "max",
  Count = "count",
  Median = "median",
  Percentile = "percentile",
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Notification types
 */
export enum NotificationType {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  Email = "email",
  SMS = "sms",
  Push = "push",
  InApp = "in_app",
  Webhook = "webhook",
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  data?: Record<string, unknown>;
  sentAt?: Date;
  readAt?: Date;
}

// ============================================================================
// File & Media
// ============================================================================

/**
 * File types
 */
export enum FileType {
  Image = "image",
  Video = "video",
  Audio = "audio",
  Document = "document",
  Archive = "archive",
  Other = "other",
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  type: FileType;
  uploadedBy: string;
  uploadedAt: Date;
}

// ============================================================================
// Validation & Constraints
// ============================================================================

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  constraint?: string;
  value?: unknown;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = unknown> {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    index: number;
    error: string;
    item?: T;
  }>;
}

// ============================================================================
// Service Health & Monitoring
// ============================================================================

/**
 * Service health status
 */
export enum HealthStatus {
  Healthy = "healthy",
  Degraded = "degraded",
  Unhealthy = "unhealthy",
}

/**
 * Service health check response
 */
export interface HealthCheck {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  version?: string;
  dependencies?: Record<string, DependencyHealth>;
}

/**
 * Dependency health information
 */
export interface DependencyHealth {
  status: HealthStatus;
  responseTime?: number;
  message?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extract keys of type T that are of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Omit properties by type
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Constructor type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Abstract constructor type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T;

/**
 * Async function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 */
export type Optional<T> = T | undefined;

/**
 * Maybe type (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined;
