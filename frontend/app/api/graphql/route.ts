import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Copy authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // @ts-ignore
      headers['Authorization'] = authHeader;
    }

    // Try multiple possible URLs for the GraphQL endpoint
    const possibleUrls = [
      process.env.NEXT_PUBLIC_API_URL,
      process.env.API_URL,
      'http://api-gateway:4000/graphql',
      'http://localhost:4000/graphql'
    ].filter(Boolean);

    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('- API_URL:', process.env.API_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    let lastError;
    
    for (const url of possibleUrls) {
      try {
        console.log(`Attempting to connect to: ${url}`);
        
        const response = await fetch(url!, {
          method: 'POST',
          headers,
          body,
        });

        const data = await response.text();
        console.log(`✅ Success! Connected to: ${url}`);
        console.log('GraphQL response status:', response.status);
        console.log('GraphQL response preview:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));

        return new NextResponse(data, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } catch (error) {
        console.error(`❌ Failed to connect to ${url}:`, error instanceof Error ? error.message : error);
        lastError = error;
        continue;
      }
    }

    // If all URLs failed, return the last error
    throw lastError;
    
  } catch (error) {
    console.error('GraphQL proxy error (all attempts failed):', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: 'Could not connect to GraphQL server', 
          details: error instanceof Error ? error.message : 'Unknown error',
          attempted_urls: [
            process.env.NEXT_PUBLIC_API_URL,
            process.env.API_URL,
            'http://api-gateway:4000/graphql',
            'http://localhost:4000/graphql'
          ].filter(Boolean)
        }] 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}