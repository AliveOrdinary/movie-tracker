'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { AuthService } from '@/lib/auth/authService';

export default function AuthTestPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [result, setResult] = useState<string>('');
  const client = useApolloClient();
  const authService = new AuthService(client);

  const handleLogin = async () => {
    try {
      const result = await authService.login({
        email: testEmail,
        password: testPassword,
      });
      setResult(`Login successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`Login error: ${error.message}`);
    }
  };

  const handleSignup = async () => {
    try {
      const result = await authService.signUp({
        email: testEmail,
        password: testPassword,
        username: testEmail.split('@')[0],
      });
      setResult(`Signup successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`Signup error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setResult('Logout successful');
    } catch (error) {
      setResult(`Logout error: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(
            {
              isAuthenticated,
              loading,
              user,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 rounded mr-2"
          />
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Password"
            className="border p-2 rounded"
          />
        </div>

        <div className="space-x-2">
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          <button
            onClick={handleSignup}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Signup
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Test Logout
          </button>
        </div>

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-2 rounded">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}