import { DataSource, DataSourceOptions } from "typeorm";
import { appConfig } from "../config";
import { User } from "../entities/user.entity";

/**
 * Database connection configuration
 * Supports PostgreSQL with TypeORM
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private dataSource: DataSource | null = null;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseConnection
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Get TypeORM DataSource options from environment configuration
   */
  private getDataSourceOptions(): DataSourceOptions {
    const isProduction = appConfig.NODE_ENV === "production";
    const isTest = appConfig.NODE_ENV === "test";

    return {
      type: "postgres",
      url: appConfig.DATABASE_URL,
      entities: [User],
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
  async connect(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    try {
      const options = this.getDataSourceOptions();
      this.dataSource = new DataSource(options);
      await this.dataSource.initialize();
      
      console.log("Database connection established successfully");
      return this.dataSource;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Database connection failed:", message);
      throw new Error(`Failed to connect to database: ${message}`);
    }
  }

  /**
   * Get the current DataSource instance
   * @throws Error if not connected
   */
  getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error(
        "Database not connected. Call connect() first."
      );
    }
    return this.dataSource;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.dataSource?.isInitialized ?? false;
  }

  /**
   * Close the database connection
   */
  async disconnect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
      console.log("Database connection closed");
    }
  }

  /**
   * Test database connection
   * @returns true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const ds = await this.connect();
      await ds.query("SELECT 1");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run migrations
   */
  async runMigrations(): Promise<void> {
    const ds = this.getDataSource();
    await ds.runMigrations();
    console.log("Migrations executed successfully");
  }

  /**
   * Revert last migration
   */
  async revertMigration(): Promise<void> {
    const ds = this.getDataSource();
    await ds.undoLastMigration();
    console.log("Last migration reverted successfully");
  }
}

/**
 * Get database connection instance (singleton)
 */
export const getDatabaseConnection = (): DatabaseConnection => {
  return DatabaseConnection.getInstance();
};

/**
 * Create and return a connected DataSource
 * Convenience function for quick usage
 */
export const createConnection = async (): Promise<DataSource> => {
  const dbConnection = getDatabaseConnection();
  return await dbConnection.connect();
};

/**
 * Export default instance for direct usage
 */
export default getDatabaseConnection();
