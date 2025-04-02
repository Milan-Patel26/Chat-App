"use client"

import React, { useState } from 'react';
import { useShape } from '@electric-sql/react';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, Prisma } from '@prisma/client';

interface User {
  id: string;
  username: string | null;
  created_at: Date | string | null;
  [key: string]: any;
}

function UserManagementComponent() {
  const [newUsername, setNewUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const prisma = new PrismaClient();

  const ELECTRIC_URL = process.env.NEXT_PUBLIC_ELECTRIC_URL || 'http://localhost:5000';

  const { isLoading, data: usersData } = useShape<User>({
    url: `${ELECTRIC_URL}/v1/shape`,
    params: {
      table: `users`
    },
    parser: {
      created_at: (value: string | null): Date | null => value ? new Date(value) : null,
    },
  });

  const sortedUsers = usersData
    ? [...usersData].sort((a, b) => a.username?.localeCompare(b.username ?? '') ?? 0)
    : [];

  async function handleAddUserDirectPrisma(event: React.FormEvent) {
    event.preventDefault();
    if (!newUsername.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const userId = uuidv4();
    const userData = {
      id: userId,
      username: newUsername.trim(),
    };

    try {
      const newUser = await prisma.users.create({
        data: {
          id: userData.id,
          username: userData.username,
        },
      });
      console.log('Direct Prisma write successful. User *might* appear via Electric sync eventually.', newUser);
      setNewUsername('');
    } catch (error: any) {
      console.error('Failed to add user via direct Prisma write:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        setSubmitError(`A user with this ${target} already exists.`);
      } else {
        setSubmitError(error.message || 'An unknown error occurred during Prisma write.');
      }

    } finally {
       setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto border rounded-lg shadow-md space-y-4 bg-white">
      <h2 className="text-xl font-semibold text-center text-gray-800">User Management (Insecure Direct Prisma Write)</h2>
      <p className="text-center text-red-600 font-bold border border-red-600 p-2 rounded">
        ⚠️ WARNING: This component uses an insecure method of writing to the database directly from the browser. Do not use in production!
      </p>

      <form onSubmit={handleAddUserDirectPrisma} className="flex gap-2 items-start">
        <div className="flex-grow space-y-1">
            <input
              type="text"
              name="username"
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => {
                  setNewUsername(e.target.value);
                  if (submitError) setSubmitError(null);
              }}
              required
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${submitError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} disabled:bg-gray-100 disabled:cursor-not-allowed`}
              disabled={isSubmitting}
              aria-invalid={!!submitError}
              aria-describedby={submitError ? "username-error" : undefined}
            />
            {submitError && (
                <p id="username-error" className="text-red-600 text-xs px-1">
                    {submitError}
                </p>
            )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isSubmitting || !newUsername.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add User (Insecure)'}
        </button>
      </form>

      <hr className="border-gray-200"/>

      <div className="space-y-2">
        <h4 className="text-lg font-medium text-gray-700">Existing Users:</h4>
         {isLoading && !usersData && (
            <div className="text-center py-4"><p className="text-gray-500 italic">Loading users...</p></div>
        )}
        {!isLoading && sortedUsers.length === 0 && (
            <div className="bg-gray-50 p-3 rounded text-center"><p className="text-gray-500 italic">No users found.</p></div>
        )}
        {sortedUsers.length > 0 && (
          <ul className="list-none bg-gray-50 p-3 rounded max-h-60 overflow-y-auto space-y-1 border border-gray-200">
            {sortedUsers.map((user) => (
              <li key={user.id} className="text-sm truncate py-1 px-2 flex items-center justify-between hover:bg-gray-100 rounded">
                  <div>
                      <span className="font-mono text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2" title={user.id}>
                          {user.id.substring(0, 8)}
                      </span>
                      <span className="text-gray-800">
                          {user.username || <span className="text-gray-400 italic">(No username)</span>}
                      </span>
                  </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserManagementComponent;
