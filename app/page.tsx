"use client";

import { useShape } from '@electric-sql/react';
import React, { useState } from 'react';

interface User {
  id: string;
  username: string | null;
  created_at: Date | string | null;
  [key: string]: any;
}

function UserList() {
  const { data } = useShape<{ users: { id: string; username: string; created_at: string }[] }>({
    url: `http://localhost:3000/v1/shape`,
    params: {
      table: `users`
    }
  });

  const users = data || [];

  return (
    <div>
      <h2>Current Users (from Shape API)</h2>
      {users.length === 0 && <p>No users found yet.</p>}
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error: ${response.statusText}`);
      }

      setSuccessMessage(`User "${result.username}" added successfully! ID: ${result.id}`);
      setUsername('');
    } catch (err: any) {
      console.error("Failed to add user:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Chat App</h1>

      <section style={{ marginBottom: '30px' }}>
        <h2>Add New User (via Prisma API)</h2>
        <form onSubmit={handleAddUser}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={isLoading}
            required
            style={{ marginRight: '10px', padding: '8px' }}
          />
          <button type="submit" disabled={isLoading} style={{ padding: '8px 15px' }}>
            {isLoading ? 'Adding...' : 'Add User'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      </section>

      <hr />

      <section>
        <UserList />
      </section>
    </main>
  );
}
