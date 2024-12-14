import React, { useState, useEffect } from 'react';

const UsersTable = ({ role, token }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users based on the role
    const fetchData = async () => {
      try {
        let url = 'http://127.0.0.1:5000/users';
        if (role === 'User') {
          // If the role is 'User', fetch only the logged-in user's data (use token to identify)
          url = `/api/users/me`; // This endpoint can be your API for fetching a single user's data
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`, // Add token to the headers for authentication
          },
        });

        const data = await response.json();

        if (Array.isArray(data)) {
          setUsers(data); // Set the users (or user) data
        } else {
          console.error('Expected an array of users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchData();
  }, [role, token]); // Re-run the effect if `role` or `token` changes

  return (
    <div>
      <h1>Users Table</h1>
      {Array.isArray(users) && users.length > 0 ? (
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.name}</li>
          ))}
        </ul>
      ) : (
        <p>No users found</p>
      )}
    </div>
  );
};

export default UsersTable;
