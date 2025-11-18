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

    console.log('Proxying GraphQL request to:', process.env.API_URL || 'http://localhost:4000/graphql');
    console.log('Request body:', body);

    const response = await fetch(process.env.API_URL || 'http://localhost:4000/graphql', {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.text();
    console.log('GraphQL response status:', response.status);
    console.log('GraphQL response:', data);

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
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Internal server error' }] },
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