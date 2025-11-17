"use strict";
/**
 * Common types, enums, and interfaces shared across all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthStatus = exports.FileType = exports.NotificationChannel = exports.NotificationType = exports.AggregationType = exports.TimeRange = exports.ChartType = exports.WidgetType = exports.JobPriority = exports.JobStatus = exports.EventType = exports.FilterOperator = exports.SortOrder = exports.HttpMethod = exports.AuthProvider = exports.UserStatus = exports.UserRole = exports.LogLevel = exports.Environment = void 0;
// ============================================================================
// Environment & Configuration
// ============================================================================
/**
 * Application environment types
 */
var Environment;
(function (Environment) {
    Environment["Development"] = "development";
    Environment["Production"] = "production";
    Environment["Test"] = "test";
    Environment["Staging"] = "staging";
})(Environment || (exports.Environment = Environment = {}));
/**
 * Log levels for application logging
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["Error"] = "error";
    LogLevel["Warn"] = "warn";
    LogLevel["Info"] = "info";
    LogLevel["Debug"] = "debug";
    LogLevel["Verbose"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// ============================================================================
// User & Authentication
// ============================================================================
/**
 * User roles for authorization
 */
var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "admin";
    UserRole["User"] = "user";
    UserRole["Moderator"] = "moderator";
    UserRole["Guest"] = "guest";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * User account status
 */
var UserStatus;
(function (UserStatus) {
    UserStatus["Active"] = "active";
    UserStatus["Inactive"] = "inactive";
    UserStatus["Suspended"] = "suspended";
    UserStatus["Pending"] = "pending";
    UserStatus["Deleted"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
/**
 * Authentication provider types
 */
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["Local"] = "local";
    AuthProvider["Google"] = "google";
    AuthProvider["GitHub"] = "github";
    AuthProvider["Facebook"] = "facebook";
    AuthProvider["Apple"] = "apple";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
// ============================================================================
// HTTP & API
// ============================================================================
/**
 * HTTP methods
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["PATCH"] = "PATCH";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["OPTIONS"] = "OPTIONS";
    HttpMethod["HEAD"] = "HEAD";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
/**
 * Sort order for queries
 */
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "ASC";
    SortOrder["DESC"] = "DESC";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
/**
 * Filter operators for queries
 */
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["Equal"] = "eq";
    FilterOperator["NotEqual"] = "ne";
    FilterOperator["GreaterThan"] = "gt";
    FilterOperator["GreaterThanOrEqual"] = "gte";
    FilterOperator["LessThan"] = "lt";
    FilterOperator["LessThanOrEqual"] = "lte";
    FilterOperator["Like"] = "like";
    FilterOperator["In"] = "in";
    FilterOperator["NotIn"] = "notIn";
    FilterOperator["IsNull"] = "isNull";
    FilterOperator["IsNotNull"] = "isNotNull";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
// ============================================================================
// Events & Messaging
// ============================================================================
/**
 * Event types for inter-service communication
 */
var EventType;
(function (EventType) {
    EventType["UserCreated"] = "user.created";
    EventType["UserUpdated"] = "user.updated";
    EventType["UserDeleted"] = "user.deleted";
    EventType["DashboardViewed"] = "dashboard.viewed";
    EventType["DashboardUpdated"] = "dashboard.updated";
    EventType["JobScheduled"] = "job.scheduled";
    EventType["JobCompleted"] = "job.completed";
    EventType["JobFailed"] = "job.failed";
    EventType["NotificationSent"] = "notification.sent";
    EventType["AIAnalysisRequested"] = "ai.analysis.requested";
    EventType["AIAnalysisCompleted"] = "ai.analysis.completed";
})(EventType || (exports.EventType = EventType = {}));
// ============================================================================
// Jobs & Workers
// ============================================================================
/**
 * Job status for background tasks
 */
var JobStatus;
(function (JobStatus) {
    JobStatus["Pending"] = "pending";
    JobStatus["Processing"] = "processing";
    JobStatus["Completed"] = "completed";
    JobStatus["Failed"] = "failed";
    JobStatus["Cancelled"] = "cancelled";
    JobStatus["Retrying"] = "retrying";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
/**
 * Job priority levels
 */
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["Low"] = 1] = "Low";
    JobPriority[JobPriority["Normal"] = 5] = "Normal";
    JobPriority[JobPriority["High"] = 10] = "High";
    JobPriority[JobPriority["Critical"] = 20] = "Critical";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
// ============================================================================
// Dashboard & Analytics
// ============================================================================
/**
 * Dashboard widget types
 */
var WidgetType;
(function (WidgetType) {
    WidgetType["Chart"] = "chart";
    WidgetType["Table"] = "table";
    WidgetType["Metric"] = "metric";
    WidgetType["Text"] = "text";
    WidgetType["Map"] = "map";
    WidgetType["Custom"] = "custom";
})(WidgetType || (exports.WidgetType = WidgetType = {}));
/**
 * Chart types for visualization
 */
var ChartType;
(function (ChartType) {
    ChartType["Line"] = "line";
    ChartType["Bar"] = "bar";
    ChartType["Pie"] = "pie";
    ChartType["Doughnut"] = "doughnut";
    ChartType["Area"] = "area";
    ChartType["Scatter"] = "scatter";
    ChartType["Radar"] = "radar";
})(ChartType || (exports.ChartType = ChartType = {}));
/**
 * Time range for analytics
 */
var TimeRange;
(function (TimeRange) {
    TimeRange["Hour"] = "1h";
    TimeRange["Day"] = "1d";
    TimeRange["Week"] = "1w";
    TimeRange["Month"] = "1m";
    TimeRange["Quarter"] = "3m";
    TimeRange["Year"] = "1y";
    TimeRange["Custom"] = "custom";
})(TimeRange || (exports.TimeRange = TimeRange = {}));
/**
 * Metric aggregation types
 */
var AggregationType;
(function (AggregationType) {
    AggregationType["Sum"] = "sum";
    AggregationType["Average"] = "avg";
    AggregationType["Min"] = "min";
    AggregationType["Max"] = "max";
    AggregationType["Count"] = "count";
    AggregationType["Median"] = "median";
    AggregationType["Percentile"] = "percentile";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
// ============================================================================
// Notifications
// ============================================================================
/**
 * Notification types
 */
var NotificationType;
(function (NotificationType) {
    NotificationType["Info"] = "info";
    NotificationType["Success"] = "success";
    NotificationType["Warning"] = "warning";
    NotificationType["Error"] = "error";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
/**
 * Notification channels
 */
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["Email"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["Push"] = "push";
    NotificationChannel["InApp"] = "in_app";
    NotificationChannel["Webhook"] = "webhook";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
// ============================================================================
// File & Media
// ============================================================================
/**
 * File types
 */
var FileType;
(function (FileType) {
    FileType["Image"] = "image";
    FileType["Video"] = "video";
    FileType["Audio"] = "audio";
    FileType["Document"] = "document";
    FileType["Archive"] = "archive";
    FileType["Other"] = "other";
})(FileType || (exports.FileType = FileType = {}));
// ============================================================================
// Service Health & Monitoring
// ============================================================================
/**
 * Service health status
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["Healthy"] = "healthy";
    HealthStatus["Degraded"] = "degraded";
    HealthStatus["Unhealthy"] = "unhealthy";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
