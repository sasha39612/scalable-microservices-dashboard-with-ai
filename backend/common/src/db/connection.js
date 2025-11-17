"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = exports.getDatabaseConnection = exports.DatabaseConnection = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("../config");
const user_entity_1 = require("../entities/user.entity");
const logger_1 = require("../logging/logger");
/**
 * Database connection configuration
 * Supports PostgreSQL with TypeORM
 */
class DatabaseConnection {
    static instance;
    dataSource = null;
    constructor() { }
    /**
     * Get singleton instance of DatabaseConnection
     */
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    /**
     * Get TypeORM DataSource options from environment configuration
     */
    getDataSourceOptions() {
        const isProduction = config_1.appConfig.NODE_ENV === "production";
        const isTest = config_1.appConfig.NODE_ENV === "test";
        return {
            type: "postgres",
            url: config_1.appConfig.DATABASE_URL,
            entities: [user_entity_1.User],
            synchronize: !isProduction, // Auto-sync schema in dev/test only
            logging: !isProduction && !isTest,
            ssl: isProduction
                ? {
                    rejectUnauthorized: false,
                }
                : false,
            // Connection pool settings
            extra: {
                max: 20, // Maximum number of connections
                min: 5, // Minimum number of connections
                idleTimeoutMillis: 30000, // Close idle connections after 30s
                connectionTimeoutMillis: 10000, // Timeout after 10s
            },
        };
    }
    /**
     * Initialize and return the database connection
     * @throws Error if connection fails
     */
    async connect() {
        if (this.dataSource?.isInitialized) {
            return this.dataSource;
        }
        try {
            const options = this.getDataSourceOptions();
            this.dataSource = new typeorm_1.DataSource(options);
            await this.dataSource.initialize();
            logger_1.logger.info("Database connection established successfully");
            return this.dataSource;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            logger_1.logger.error("Database connection failed", { error: message });
            throw new Error(`Failed to connect to database: ${message}`);
        }
    }
    /**
     * Get the current DataSource instance
     * @throws Error if not connected
     */
    getDataSource() {
        if (!this.dataSource?.isInitialized) {
            throw new Error("Database not connected. Call connect() first.");
        }
        return this.dataSource;
    }
    /**
     * Check if database is connected
     */
    isConnected() {
        return this.dataSource?.isInitialized ?? false;
    }
    /**
     * Close the database connection
     */
    async disconnect() {
        if (this.dataSource?.isInitialized) {
            await this.dataSource.destroy();
            this.dataSource = null;
            logger_1.logger.info("Database connection closed");
        }
    }
    /**
     * Test database connection
     * @returns true if connection is successful
     */
    async testConnection() {
        try {
            const ds = await this.connect();
            await ds.query("SELECT 1");
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Run migrations
     */
    async runMigrations() {
        const ds = this.getDataSource();
        await ds.runMigrations();
        logger_1.logger.info("Migrations executed successfully");
    }
    /**
     * Revert last migration
     */
    async revertMigration() {
        const ds = this.getDataSource();
        await ds.undoLastMigration();
        logger_1.logger.info("Last migration reverted successfully");
    }
}
exports.DatabaseConnection = DatabaseConnection;
/**
 * Get database connection instance (singleton)
 */
const getDatabaseConnection = () => {
    return DatabaseConnection.getInstance();
};
exports.getDatabaseConnection = getDatabaseConnection;
/**
 * Create and return a connected DataSource
 * Convenience function for quick usage
 */
const createConnection = async () => {
    const dbConnection = (0, exports.getDatabaseConnection)();
    return await dbConnection.connect();
};
exports.createConnection = createConnection;
/**
 * Export default instance for direct usage
 */
exports.default = (0, exports.getDatabaseConnection)();
