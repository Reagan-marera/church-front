import React, { useState, useEffect } from 'react';

const MemberInfo = () => {
  const [memberInfo, setMemberInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);  // Track loading state
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');  // Retrieve the JWT token
    if (!token) {
      setErrorMessage('User is not authenticated');
      setLoading(false);
      return;
    }

    const decodedToken = decodeJWT(token);  // Decode the token to get the username
    if (!decodedToken) {
      setErrorMessage('Failed to decode token');
      setLoading(false);
      return;
    }

    setUsername(decodedToken);  // Set the username from the decoded token
    fetchMemberInfo(decodedToken);  // Fetch member info using the username
  }, []);

  // Decode JWT function to extract the username
  const decodeJWT = (token) => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);
      return parsedPayload?.sub?.username || null;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const fetchMemberInfo = async (username) => {
    try {
      setLoading(true);  // Start loading
      const response = await fetch(`https://church.boogiecoin.com/member/${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`  // Ensure authorization token is sent
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMemberInfo(data.member_info || data.all_members_info);  // Handling different responses based on user role
      } else {
        setErrorMessage(data.error || 'Failed to fetch member info');
      }
    } catch (error) {
      setErrorMessage('Error fetching member info');
    } finally {
      setLoading(false);  // End loading
    }
  };

  return (
    <div style={styles.container}>
      <h2>Member Information</h2>
      {loading && <p>Loading...</p>}
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {memberInfo ? (
        <div>
          {/* Check if we have a list of all members or just a single member */}
          {Array.isArray(memberInfo) ? (
            <div>
              <h3>All Members Information</h3>
              {memberInfo.map((member, index) => (
                <div key={index}>
                  <p><strong>Username:</strong> {member.username}</p>
                  <p><strong>Email:</strong> {member.email}</p>
                  <p><strong>Role:</strong> {member.role}</p>
                  <p><strong>Residence:</strong> {member.residence}</p>
                  <p><strong>Phone Number:</strong> {member.phone_number}</p>
                  <p><strong>Occupation:</strong> {member.occupation}</p>
                  <p><strong>Member Number:</strong> {member.member_number}</p>
                  <p><strong>Church Name:</strong> {member.church_name}</p>
                  <hr />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p><strong>Username:</strong> {memberInfo.username}</p>
              <p><strong>Email:</strong> {memberInfo.email}</p>
              <p><strong>Role:</strong> {memberInfo.role}</p>
              <p><strong>Residence:</strong> {memberInfo.residence}</p>
              <p><strong>Phone Number:</strong> {memberInfo.phone_number}</p>
              <p><strong>Occupation:</strong> {memberInfo.occupation}</p>
              <p><strong>Member Number:</strong> {memberInfo.member_number}</p>
              <p><strong>Church Branch:</strong> {memberInfo.church_name}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  },
  error: {
    color: '#e74c3c',
    fontSize: '1rem',
    marginTop: '10px',
  },
};

export default MemberInfo;
