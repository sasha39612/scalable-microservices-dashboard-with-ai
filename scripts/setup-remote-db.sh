#!/bin/bash

# Remote PostgreSQL Database Setup Script
# Server: dev@138.199.175.38
# This script should be run on the remote server with sudo privileges

set -e

echo "======================================"
echo "PostgreSQL Remote Database Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="microservices_dashboard"
DB_USER="dashboard_user"
DB_PASSWORD="$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)"
POSTGRES_VERSION="14"

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update

echo -e "${YELLOW}Step 2: Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

echo -e "${YELLOW}Step 3: Starting PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo -e "${GREEN}PostgreSQL installed successfully!${NC}"

echo -e "${YELLOW}Step 4: Creating database and user...${NC}"

# Create database and user as postgres user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE ${DB_NAME};

-- Create user with password
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Show created database
\l ${DB_NAME}
EOF

echo -e "${GREEN}Database and user created successfully!${NC}"

echo -e "${YELLOW}Step 5: Configuring PostgreSQL for remote connections...${NC}"

# Get PostgreSQL config directory
PG_CONF_DIR="/etc/postgresql/${POSTGRES_VERSION}/main"

# Backup original configs
sudo cp ${PG_CONF_DIR}/postgresql.conf ${PG_CONF_DIR}/postgresql.conf.backup
sudo cp ${PG_CONF_DIR}/pg_hba.conf ${PG_CONF_DIR}/pg_hba.conf.backup

# Configure postgresql.conf to listen on all interfaces
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" ${PG_CONF_DIR}/postgresql.conf

# Add connection limit settings
sudo bash -c "cat >> ${PG_CONF_DIR}/postgresql.conf << 'PGCONF'

# Custom connection settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
PGCONF"

# Configure pg_hba.conf to allow remote connections
# Add rule for remote connections with password authentication
sudo bash -c "cat >> ${PG_CONF_DIR}/pg_hba.conf << 'HBACONF'

# Allow remote connections from anywhere (consider restricting to specific IPs in production)
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
HBACONF"

echo -e "${GREEN}PostgreSQL configured for remote access!${NC}"

echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"

# Check if ufw is active
if sudo ufw status | grep -q "Status: active"; then
    echo "UFW firewall is active, adding PostgreSQL rule..."
    sudo ufw allow 5432/tcp
    echo -e "${GREEN}Firewall rule added for PostgreSQL (port 5432)${NC}"
else
    echo -e "${YELLOW}UFW firewall is not active. If using another firewall, ensure port 5432 is open.${NC}"
fi

echo -e "${YELLOW}Step 7: Restarting PostgreSQL...${NC}"
sudo systemctl restart postgresql

echo -e "${GREEN}PostgreSQL service restarted!${NC}"

echo -e "${YELLOW}Step 8: Verifying installation...${NC}"

# Check PostgreSQL status
sudo systemctl status postgresql --no-pager | head -n 10

# Test connection
sudo -u postgres psql -c "SELECT version();"

echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Database Connection Details:"
echo "----------------------------"
echo "Host: $(hostname -I | awk '{print $1}')"
echo "Port: 5432"
echo "Database: ${DB_NAME}"
echo "Username: ${DB_USER}"
echo "Password: ${DB_PASSWORD}"
echo ""
echo "Connection String:"
echo "----------------------------"
echo "postgresql://${DB_USER}:${DB_PASSWORD}@$(hostname -I | awk '{print $1}'):5432/${DB_NAME}"
echo ""
echo "Connection String (using server IP):"
echo "----------------------------"
echo "postgresql://${DB_USER}:${DB_PASSWORD}@138.199.175.38:5432/${DB_NAME}"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
echo -e "${YELLOW}Add the connection string to your .env file as DATABASE_URL${NC}"
echo ""
echo "To test connection from your local machine:"
echo "psql \"postgresql://${DB_USER}:${DB_PASSWORD}@138.199.175.38:5432/${DB_NAME}\""
echo ""
