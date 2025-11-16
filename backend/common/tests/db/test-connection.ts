/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import { getDatabaseConnection } from "../../src/db/connection";

/**
 * Test script to verify database connection
 * Run with: npm run ts-node tests/db/test-connection.ts
 */
async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  const dbConnection = getDatabaseConnection();

  try {
    // Test 1: Connect to database
    console.log("1️⃣ Connecting to database...");
    const dataSource = await dbConnection.connect();
    console.log("✅ Connected successfully!");
    console.log(`   - Database: ${dataSource.options.database || "microservices_dashboard"}`);
    console.log(`   - Host: ${(dataSource.options as any).url?.split("@")[1]?.split("/")[0] || "remote server"}`);
    console.log();

    // Test 2: Run a simple query
    console.log("2️⃣ Running test query (SELECT 1)...");
    const result = await dataSource.query("SELECT 1 as test");
    console.log("✅ Query executed successfully!");
    console.log(`   - Result:`, result);
    console.log();

    // Test 3: Check database version
    console.log("3️⃣ Checking PostgreSQL version...");
    const versionResult = await dataSource.query("SELECT version()");
    console.log("✅ Version retrieved!");
    console.log(`   - ${versionResult[0].version.split('\n')[0]}`);
    console.log();

    // Test 4: List existing tables
    console.log("4️⃣ Listing existing tables...");
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`✅ Found ${tables.length} table(s):`);
    if (tables.length > 0) {
      tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
    } else {
      console.log("   - (No tables yet - this is expected for a new database)");
    }
    console.log();

    // Test 5: Check connection status
    console.log("5️⃣ Checking connection status...");
    const isConnected = dbConnection.isConnected();
    console.log(`✅ Connection status: ${isConnected ? "Connected" : "Disconnected"}`);
    console.log();

    // Test 6: Get connection pool stats
    console.log("6️⃣ Connection pool configuration...");
    const options = dataSource.options;
    console.log("✅ Pool settings:");
    console.log(`   - Max connections: ${(options as any).extra?.max || "default"}`);
    console.log(`   - Min connections: ${(options as any).extra?.min || "default"}`);
    console.log(`   - Idle timeout: ${(options as any).extra?.idleTimeoutMillis || "default"}ms`);
    console.log();

    // Clean up
    console.log("7️⃣ Closing connection...");
    await dbConnection.disconnect();
    console.log("✅ Connection closed successfully!");
    console.log();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 All tests passed! Database is ready to use.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection test failed!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error details:");
    console.error(error instanceof Error ? error.message : error);
    console.error("\nTroubleshooting tips:");
    console.error("1. Verify DATABASE_URL in .env file");
    console.error("2. Check if PostgreSQL is running on the server");
    console.error("3. Ensure firewall allows connections on port 5432");
    console.error("4. Verify credentials (username/password)");
    console.error("5. Check pg_hba.conf allows remote connections");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await dbConnection.disconnect();
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
