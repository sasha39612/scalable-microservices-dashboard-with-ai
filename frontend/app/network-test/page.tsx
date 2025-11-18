'use client';

import { useState } from 'react';

export default function NetworkTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');

    try {
      // Test basic fetch to GraphQL endpoint
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __typename }'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Connection successful: ${JSON.stringify(data)}`);
      } else {
        setTestResult(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGraphQLQuery = async () => {
    setIsLoading(true);
    setTestResult('Testing GraphQL query...');

    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query DashboardStats {
              dashboardStats {
                title
                value
                trend
                trendValue
              }
            }
          `
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ GraphQL Query successful: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Network Connectivity Test</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button 
            onClick={testConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Basic Connection
          </button>
          
          <button 
            onClick={testGraphQLQuery}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test GraphQL Query
          </button>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {testResult || 'Click a button to test the connection'}
          </pre>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <ul className="text-sm space-y-1">
            <li>• Frontend URL: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</li>
            <li>• GraphQL URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql'}</li>
            <li>• User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}