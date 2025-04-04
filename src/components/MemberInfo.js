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
      const response = await fetch(`https://yoming.boogiecoin.com/member/${username}`, {
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
      <h2 style={styles.header}>Member Information</h2>
      {loading && <p style={styles.loading}>Loading...</p>}
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      {memberInfo ? (
        <div>
          {/* Check if we have a list of all members or just a single member */}
          {Array.isArray(memberInfo) ? (
            <div>
              <h3 style={styles.subHeader}>All Members Information</h3>
              {memberInfo.map((member, index) => (
                <div key={index} style={styles.memberCard}>
                  <p style={styles.memberText}><strong>Username:</strong> {member.username}</p>
                  <p style={styles.memberText}><strong>Email:</strong> {member.email}</p>
                  <p style={styles.memberText}><strong>Role:</strong> {member.role}</p>
                  <hr style={styles.hr} />
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.memberCard}>
              <p style={styles.memberText}><strong>Username:</strong> {memberInfo.username}</p>
              <p style={styles.memberText}><strong>Email:</strong> {memberInfo.email}</p>
              <p style={styles.memberText}><strong>Role:</strong> {memberInfo.role}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '700px',
    margin: '50px auto',
    padding: '20px',
    backgroundColor: '#000',  // Black background
    borderRadius: '12px',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6)',
    color: '#e50914',  // Red text color for contrast
  },
  header: {
    fontSize: '2rem',
    color: '#e50914',  // Red color for the header
    marginBottom: '20px',
    fontWeight: '700',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: '1.5rem',
    color: '#e50914',  // Red color for subheader
    marginBottom: '15px',
    fontWeight: '600',
  },
  error: {
    color: '#e50914',  // Red color for error message
    fontSize: '1rem',
    marginTop: '10px',
    textAlign: 'center',
  },
  loading: {
    color: '#fff',  // White loading text on black background
    fontSize: '1.2rem',
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: '#000',  // Black background for member cards
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 5px 10px rgba(0, 0, 0, 0.6)',
  },
  memberText: {
    fontSize: '1rem',
    marginBottom: '10px',
    color: '#e50914',  // Red text for member details
  },
  hr: {
    borderColor: '#e50914',  // Red color for horizontal rule
    marginTop: '15px',
  },
};

export default MemberInfo;
