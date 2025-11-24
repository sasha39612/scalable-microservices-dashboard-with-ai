-- Create audit_logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'error')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- User information
  user_id UUID,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- Request information
  ip_address INET,
  user_agent TEXT,
  
  -- Resource information
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  
  -- Additional data
  metadata JSONB,
  error_message TEXT,
  
  -- Service information
  service_name VARCHAR(50) NOT NULL,
  duration INTEGER, -- Duration in milliseconds
  
  -- Indexes for efficient querying
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for common query patterns
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_service_name ON audit_logs(service_name);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- Composite indexes for common filter combinations
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_severity_timestamp ON audit_logs(severity, timestamp DESC) WHERE severity IN ('high', 'critical');

-- GIN index for JSONB metadata queries
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all sensitive operations across microservices';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., user.login, user.delete, ai.chat.create)';
COMMENT ON COLUMN audit_logs.status IS 'Result status: success, failure, or error';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: low, medium, high, or critical';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual information in JSON format';
COMMENT ON COLUMN audit_logs.duration IS 'Operation duration in milliseconds';
