// global.d.ts

// Example: Add custom environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    DATABASE_URL: string;
  }
}

// Example: Extend global Window interface
interface Window {
  myCustomGlobal: () => void;
}
