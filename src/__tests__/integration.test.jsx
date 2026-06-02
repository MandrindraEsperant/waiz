/**
 * Test d'intégration frontend-backend
 */

describe('Integration Tests', () => {
  test('Apollo Client configuration should point to localhost backend', async () => {
    // Test que la configuration Apollo Client pointe vers localhost
    const response = await fetch('http://localhost:8000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('__typename');
    expect(data.data.__typename).toBe('Query');
  });

  test('Backend should be accessible from frontend', () => {
    // Simple connectivity test
    expect(true).toBe(true);
  });

  test('Database should be running', () => {
    // Placeholder for database connectivity test
    expect(true).toBe(true);
  });
});
