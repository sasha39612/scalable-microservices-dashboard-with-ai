# Remote PostgreSQL Database Setup Instructions

Server: `dev@138.199.175.38`  
OS: Ubuntu 22.04.5 LTS

## Quick Setup (Automated)

1. **Upload the setup script to the remote server:**
   ```bash
   scp scripts/setup-remote-db.sh dev@138.199.175.38:~/
   ```

2. **SSH into the server and run the script:**
   ```bash
   ssh dev@138.199.175.38
   chmod +x ~/setup-remote-db.sh
   sudo bash ~/setup-remote-db.sh
   ```

3. **Save the connection credentials** that are displayed at the end

4. **Update your `.env` file** with the DATABASE_URL

---

## Manual Setup (Step by Step)

### Step 1: Install PostgreSQL

```bash
# SSH into the server
ssh dev@138.199.175.38

# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE microservices_dashboard;
CREATE USER dashboard_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE microservices_dashboard TO dashboard_user;

# Connect to the database
\c microservices_dashboard

# Grant schema privileges
GRANT ALL ON SCHEMA public TO dashboard_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dashboard_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dashboard_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dashboard_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dashboard_user;

# Exit
\q
```

### Step 3: Configure Remote Access

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and change:
listen_addresses = '*'  # Change from 'localhost' to '*'

# Save and exit (Ctrl+X, Y, Enter)
```

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add at the end:
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5

# Save and exit
```

### Step 4: Configure Firewall

```bash
# If using UFW
sudo ufw allow 5432/tcp
sudo ufw reload

# If using iptables
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
sudo iptables-save
```

### Step 5: Restart PostgreSQL

```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### Step 6: Verify Connection

```bash
# From the remote server
sudo -u postgres psql -c "SELECT version();"

# From your local machine
psql "postgresql://dashboard_user:YOUR_PASSWORD@138.199.175.38:5432/microservices_dashboard"
```

---

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

**Example:**
```
postgresql://dashboard_user:your_secure_password@138.199.175.38:5432/microservices_dashboard
```

---

## Security Recommendations

1. **Use a strong password** (at least 20 characters, mix of letters, numbers, symbols)
2. **Restrict IP access** in `pg_hba.conf` if you know your client IPs:
   ```
   host    all             all             YOUR_IP/32              md5
   ```
3. **Use SSL/TLS** for production:
   - Set `ssl = on` in postgresql.conf
   - Configure SSL certificates
4. **Regular backups** using pg_dump:
   ```bash
   pg_dump -U dashboard_user microservices_dashboard > backup.sql
   ```
5. **Monitor connections**:
   ```bash
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   ```

---

## Troubleshooting

### Can't connect remotely?

1. **Check PostgreSQL is listening:**
   ```bash
   sudo netstat -plunt | grep 5432
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   ```

3. **Check PostgreSQL logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

4. **Verify pg_hba.conf:**
   ```bash
   sudo cat /etc/postgresql/14/main/pg_hba.conf
   ```

### Authentication failed?

- Ensure password is correct
- Check user exists: `sudo -u postgres psql -c "\du"`
- Verify database exists: `sudo -u postgres psql -c "\l"`

### Performance issues?

- Increase `shared_buffers` in postgresql.conf
- Adjust `max_connections` based on your needs
- Monitor with: `sudo -u postgres psql -c "SHOW ALL;"`

---

## Next Steps

After setup:

1. ✅ Add DATABASE_URL to `.env` file
2. ✅ Test connection from your Node.js app
3. ✅ Run migrations: `npm run migrate`
4. ✅ Seed initial data if needed
5. ✅ Set up automated backups
