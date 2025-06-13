import React, { useState, useEffect } from 'react';

// Function to decode JWT token and get the payload
const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    const parsedPayload = JSON.parse(decodedPayload);
    console.log('Decoded JWT Payload:', parsedPayload); // Log the entire decoded payload
    const username = parsedPayload?.sub?.username || parsedPayload?.sub?.email;
    return username;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const CreatePledge = () => {
  const [amountPledged, setAmountPledged] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [username, setUsername] = useState('');
  const [allPledges, setAllPledges] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPledgeId, setSelectedPledgeId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('User is not authenticated. Please log in.');
      return;
    }

    const userUsername = decodeJWT(token);
    if (!userUsername) {
      setErrorMessage('Username is not found in JWT token.');
    } else {
      setUsername(userUsername);
      fetchPledges();  // Fetch pledges once the username is decoded
    }
  }, []);

  const fetchPledges = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('z/create-pledge', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched Pledges:', data);

      if (Array.isArray(data.pledges)) {
        setAllPledges(data.pledges);
      } else {
        setErrorMessage('Received invalid data format for pledges.');
      }
    } else {
      setErrorMessage('Failed to fetch pledges.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
  
    if (!amountPledged || !month || !year) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
  
    const token = localStorage.getItem('token');
    const response = await fetch('https://backend.youmingtechnologies.co.ke/create-pledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount_pledged: amountPledged,
        month: month,
        year: year,
        timestamp: new Date().toISOString(), // Add timestamp to pledge
      }),
    });
  
    const data = await response.json();
  
    if (response.ok) {
      setSuccessMessage(data.message);
      setAmountPledged('');
      setMonth('');
      setYear('');
      fetchPledges();  // Refresh the pledges after successful creation
    } else {
      setErrorMessage(data.error || 'Failed to create pledge');
    }
  };

  const handleDelete = async (pledgeId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('User is not authenticated. Please log in.');
      return;
    }

    try {
      const response = await fetch(`https://backend.youmingtechnologies.co.ke/delete-pledge/${pledgeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Pledge deleted successfully');
        fetchPledges();
      } else {
        setErrorMessage(data.error || 'Failed to delete pledge');
      }
    } catch (error) {
      setErrorMessage(`Error deleting pledge: ${error.message}`);
    }
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
  
    if (!paymentAmount || !selectedPledgeId) {
      setErrorMessage('Please provide both pledge ID and payment amount.');
      return;
    }
  
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://backend.youmingtechnologies.co.ke/make-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pledge_id: selectedPledgeId,
          amount_paid: paymentAmount,
          payment_timestamp: new Date().toISOString(), // Timestamp for payment
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSuccessMessage(data.message);
        setPaymentAmount('');
        setSelectedPledgeId('');
        fetchPledges();  // Refresh pledges after payment is made
      } else {
        setErrorMessage(data.error || 'Failed to make payment');
      }
    } catch (error) {
      // Catching the error in case of network or other failures
      console.error("Error during payment:", error);
      setErrorMessage(`Error during payment: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Create a Tithe Pledge</h1>
      <form onSubmit={handleSubmit}>
        <label>Amount Pledged:</label>
        <input
          type="number"
          value={amountPledged}
          onChange={(e) => setAmountPledged(e.target.value)}
        />
        <br />
        <label>Month:</label>
        <input
          type="text"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <br />
        <label>Year:</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <br />
        <button type="submit">Create Pledge</button>
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <h2>Your Pledges</h2>
      {allPledges.length === 0 ? (
        <p>No pledges available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Amount Pledged</th>
              <th>Month</th>
              <th>Year</th>
              <th>Total Amount</th>
              <th>Remaining Amount</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPledges.map((pledge) => (
              <tr key={pledge.id}>
                <td>{pledge.amount_pledged}</td>
                <td>{pledge.month}</td>
                <td>{pledge.year}</td>
                <td>{pledge.total_amount}</td>
                <td>{pledge.remaining_amount}</td>
                <td>{new Date(pledge.timestamp).toLocaleString()}</td> {/* Display timestamp */}
                <td>
                  <button onClick={() => handleDelete(pledge.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Make a Payment</h2>
      <form onSubmit={handlePayment}>
        <label>Select a Pledge:</label>
        <select
          value={selectedPledgeId}
          onChange={(e) => setSelectedPledgeId(e.target.value)}
        >
          <option value="">--Select a Pledge--</option>
          {allPledges.map((pledge) => (
            <option key={pledge.id} value={pledge.id}>
              {`Pledge for ${pledge.amount_pledged} in ${pledge.month} ${pledge.year}`}
            </option>
          ))}
        </select>
        <br />
        <label>Amount Paid:</label>
        <input
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />
        <br />
        <button type="submit">Make Payment</button>
      </form>
    </div>
  );
};

export default CreatePledge;
