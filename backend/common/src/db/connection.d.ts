import { DataSource } from "typeorm";
/**
 * Database connection configuration
 * Supports PostgreSQL with TypeORM
 */
export declare class DatabaseConnection {
    private static instance;
    private dataSource;
    private constructor();
    /**
     * Get singleton instance of DatabaseConnection
     */
    static getInstance(): DatabaseConnection;
    /**
     * Get TypeORM DataSource options from environment configuration
     */
    private getDataSourceOptions;
    /**
     * Initialize and return the database connection
     * @throws Error if connection fails
     */
    connect(): Promise<DataSource>;
    /**
     * Get the current DataSource instance
     * @throws Error if not connected
     */
    getDataSource(): DataSource;
    /**
     * Check if database is connected
     */
    isConnected(): boolean;
    /**
     * Close the database connection
     */
    disconnect(): Promise<void>;
    /**
     * Test database connection
     * @returns true if connection is successful
     */
    testConnection(): Promise<boolean>;
    /**
     * Run migrations
     */
    runMigrations(): Promise<void>;
    /**
     * Revert last migration
     */
    revertMigration(): Promise<void>;
}
/**
 * Get database connection instance (singleton)
 */
export declare const getDatabaseConnection: () => DatabaseConnection;
/**
 * Create and return a connected DataSource
 * Convenience function for quick usage
 */
export declare const createConnection: () => Promise<DataSource>;
/**
 * Export default instance for direct usage
 */
declare const _default: DatabaseConnection;
export default _default;
