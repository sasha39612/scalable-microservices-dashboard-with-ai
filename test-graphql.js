// Simple script to test GraphQL schema and mutations
const fetch = require('node-fetch');

async function testGraphQLSchema() {
  try {
    // First, test the introspection query to get the schema
    const introspectionQuery = {
      query: `
        query IntrospectionQuery {
          __schema {
            mutationType {
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          }
        }
      `
    };

    console.log('🔍 Testing GraphQL introspection...');
    
    const introspectionResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(introspectionQuery)
    });

    const introspectionData = await introspectionResponse.json();
    
    if (introspectionData.errors) {
      console.log('❌ Introspection errors:', introspectionData.errors);
    } else {
      console.log('✅ Introspection successful!');
      
      // Look for chat mutation
      const mutations = introspectionData.data.__schema.mutationType?.fields || [];
      const chatMutation = mutations.find(m => m.name === 'chat');
      
      if (chatMutation) {
        console.log('✅ Chat mutation found:', JSON.stringify(chatMutation, null, 2));
      } else {
        console.log('❌ Chat mutation not found in schema');
        console.log('Available mutations:', mutations.map(m => m.name));
      }
    }

    // Now test a valid chat mutation
    console.log('\n🚀 Testing valid chat mutation...');
    
    const validChatMutation = {
      query: `
        mutation TestChat($input: ChatRequestInput!) {
          chat(input: $input) {
            message
            role
            timestamp
          }
        }
      `,
      variables: {
        input: {
          messages: [
            {
              role: "user",
              content: "Hello, this is a test message"
            }
          ],
          options: {
            model: "gpt-3.5-turbo",
            temperature: 0.7
          }
        }
      }
    };

    const chatResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validChatMutation)
    });

    const chatData = await chatResponse.json();
    
    if (chatData.errors) {
      console.log('❌ Chat mutation errors:', JSON.stringify(chatData.errors, null, 2));
    } else {
      console.log('✅ Chat mutation successful:', JSON.stringify(chatData.data, null, 2));
    }

    // Test the invalid format that's causing issues
    console.log('\n⚠️ Testing invalid chat mutation (the problematic format)...');
    
    const invalidChatMutation = {
      query: `
        mutation TestChat($input: ChatRequestInput!) {
          chat(input: $input) {
            message
            role
            timestamp
          }
        }
      `,
      variables: {
        input: {
          message: "Is it working?",
          model: "gpt-3.5-turbo"
        }
      }
    };

    const invalidResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidChatMutation)
    });

    const invalidData = await invalidResponse.json();
    console.log('Expected error for invalid format:', JSON.stringify(invalidData.errors, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testGraphQLSchema();
}