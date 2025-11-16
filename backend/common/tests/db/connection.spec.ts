import { DataSource } from "typeorm";
import {
  DatabaseConnection,
  getDatabaseConnection,
  createConnection,
} from "../../src/db/connection";
import { appConfig } from "../../src/config";

// Mock the config module
jest.mock("../../src/config", () => ({
  appConfig: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
    PORT: 3000,
  },
}));

// Mock TypeORM DataSource
jest.mock("typeorm", () => {
  const actualTypeorm = jest.requireActual("typeorm");
  return {
    ...actualTypeorm,
    DataSource: jest.fn().mockImplementation(function (this: any, options: any) {
      this.options = options;
      this.isInitialized = false;
      this.initialize = jest.fn().mockImplementation(async () => {
        this.isInitialized = true;
        return this;
      });
      this.destroy = jest.fn().mockImplementation(async () => {
        this.isInitialized = false;
      });
      this.query = jest.fn().mockResolvedValue([{ result: 1 }]);
      this.runMigrations = jest.fn().mockResolvedValue([]);
      this.undoLastMigration = jest.fn().mockResolvedValue(undefined);
      return this;
    }),
  };
});

describe("DatabaseConnection", () => {
  let dbConnection: DatabaseConnection;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear singleton instance before each test
    (DatabaseConnection as any).instance = undefined;
    dbConnection = DatabaseConnection.getInstance();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(async () => {
    // Cleanup after each test
    await dbConnection.disconnect();
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should return the same instance via getDatabaseConnection", () => {
      const instance1 = getDatabaseConnection();
      const instance2 = getDatabaseConnection();
      expect(instance1).toBe(instance2);
    });
  });

  describe("connect()", () => {
    it("should successfully establish database connection", async () => {
      const dataSource = await dbConnection.connect();

      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Database connection established successfully"
      );
    });

    it("should return existing connection if already connected", async () => {
      const dataSource1 = await dbConnection.connect();
      const dataSource2 = await dbConnection.connect();

      expect(dataSource1).toBe(dataSource2);
      expect(dataSource1.initialize).toHaveBeenCalledTimes(1);
    });

    it("should use correct configuration for test environment", async () => {
      const dataSource = await dbConnection.connect();

      expect(dataSource.options).toMatchObject({
        type: "postgres",
        url: "postgresql://test:test@localhost:5432/testdb",
        synchronize: true, // true in test environment
        logging: false, // false in test environment
        ssl: false,
      });
    });

    it("should handle connection errors", async () => {
      const mockError = new Error("Connection refused");
      
      // Mock DataSource to throw error on initialize
      (DataSource as jest.Mock).mockImplementationOnce(function (this: any) {
        this.isInitialized = false;
        this.initialize = jest.fn().mockRejectedValue(mockError);
        return this;
      });

      // Create new instance to use mocked DataSource
      (DatabaseConnection as any).instance = undefined;
      dbConnection = DatabaseConnection.getInstance();

      await expect(dbConnection.connect()).rejects.toThrow(
        "Failed to connect to database: Connection refused"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database connection failed:",
        "Connection refused"
      );
    });

    it("should handle non-Error exceptions", async () => {
      // Mock DataSource to throw non-Error
      (DataSource as jest.Mock).mockImplementationOnce(function (this: any) {
        this.isInitialized = false;
        this.initialize = jest.fn().mockRejectedValue("String error");
        return this;
      });

      (DatabaseConnection as any).instance = undefined;
      dbConnection = DatabaseConnection.getInstance();

      await expect(dbConnection.connect()).rejects.toThrow(
        "Failed to connect to database: Unknown error"
      );
    });
  });

  describe("getDataSource()", () => {
    it("should return connected DataSource", async () => {
      await dbConnection.connect();
      const dataSource = dbConnection.getDataSource();

      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it("should throw error if not connected", () => {
      expect(() => dbConnection.getDataSource()).toThrow(
        "Database not connected. Call connect() first."
      );
    });
  });

  describe("isConnected()", () => {
    it("should return false when not connected", () => {
      expect(dbConnection.isConnected()).toBe(false);
    });

    it("should return true when connected", async () => {
      await dbConnection.connect();
      expect(dbConnection.isConnected()).toBe(true);
    });

    it("should return false after disconnect", async () => {
      await dbConnection.connect();
      await dbConnection.disconnect();
      expect(dbConnection.isConnected()).toBe(false);
    });
  });

  describe("disconnect()", () => {
    it("should close database connection", async () => {
      const dataSource = await dbConnection.connect();
      await dbConnection.disconnect();

      expect(dataSource.destroy).toHaveBeenCalled();
      expect(dbConnection.isConnected()).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith("Database connection closed");
    });

    it("should handle disconnect when not connected", async () => {
      await dbConnection.disconnect();
      // Should not throw error
      expect(dbConnection.isConnected()).toBe(false);
    });
  });

  describe("testConnection()", () => {
    it("should return true for successful connection", async () => {
      const result = await dbConnection.testConnection();

      expect(result).toBe(true);
      expect(dbConnection.isConnected()).toBe(true);
    });

    it("should return false for failed connection", async () => {
      // Mock DataSource to throw error
      (DataSource as jest.Mock).mockImplementationOnce(function (this: any) {
        this.isInitialized = false;
        this.initialize = jest.fn().mockRejectedValue(new Error("Connection failed"));
        return this;
      });

      (DatabaseConnection as any).instance = undefined;
      dbConnection = DatabaseConnection.getInstance();

      const result = await dbConnection.testConnection();
      expect(result).toBe(false);
    });
  });

  describe("runMigrations()", () => {
    it("should run migrations successfully", async () => {
      const dataSource = await dbConnection.connect();
      await dbConnection.runMigrations();

      expect(dataSource.runMigrations).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Migrations executed successfully"
      );
    });

    it("should throw error if not connected", async () => {
      await expect(dbConnection.runMigrations()).rejects.toThrow(
        "Database not connected. Call connect() first."
      );
    });
  });

  describe("revertMigration()", () => {
    it("should revert last migration successfully", async () => {
      const dataSource = await dbConnection.connect();
      await dbConnection.revertMigration();

      expect(dataSource.undoLastMigration).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Last migration reverted successfully"
      );
    });

    it("should throw error if not connected", async () => {
      await expect(dbConnection.revertMigration()).rejects.toThrow(
        "Database not connected. Call connect() first."
      );
    });
  });

  describe("createConnection()", () => {
    it("should create and return connected DataSource", async () => {
      const dataSource = await createConnection();

      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });
  });

  describe("Configuration", () => {
    it("should use production config in production environment", async () => {
      // Mock production environment
      (appConfig as any).NODE_ENV = "production";
      
      (DatabaseConnection as any).instance = undefined;
      dbConnection = DatabaseConnection.getInstance();
      
      const dataSource = await dbConnection.connect();

      expect(dataSource.options).toMatchObject({
        synchronize: false, // false in production
        logging: false,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      // Reset to test environment
      (appConfig as any).NODE_ENV = "test";
    });

    it("should use development config in development environment", async () => {
      // Mock development environment
      (appConfig as any).NODE_ENV = "development";
      
      (DatabaseConnection as any).instance = undefined;
      dbConnection = DatabaseConnection.getInstance();
      
      const dataSource = await dbConnection.connect();

      expect(dataSource.options).toMatchObject({
        synchronize: true, // true in development
        logging: true, // true in development
        ssl: false,
      });

      // Reset to test environment
      (appConfig as any).NODE_ENV = "test";
    });

    it("should include connection pool settings", async () => {
      const dataSource = await dbConnection.connect();

      expect(dataSource.options.extra).toEqual({
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    });

    it("should include User entity in configuration", async () => {
      const dataSource = await dbConnection.connect();

      expect(dataSource.options.entities).toBeDefined();
      expect((dataSource.options.entities as any[]).length).toBeGreaterThan(0);
    });
  });
});
