import React, { useState, useEffect } from 'react';
import './trialbalance.css';

const TrialBalance = () => {
  // State to store trial balance data and loading state
  const [trialBalance, setTrialBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch trial balance data from the server
  const fetchTrialBalance = async () => {
    try {
      // Retrieve the JWT token from local storage or wherever it's stored
      const token = localStorage.getItem('token');

      const response = await fetch('http://127.0.0.1:5000/trial-balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial balance data');
      }

      const data = await response.json();
      setTrialBalance(data);
    } catch (err) {
      setError(err.message); // Handle any error that occurs during fetching
    } finally {
      setLoading(false);
    }
  };

  // Fetch the trial balance data when the component mounts
  useEffect(() => {
    fetchTrialBalance();
  }, []);

  // Calculate the totals of debits and credits
  let totalDebits = 0;
  let totalCredits = 0;

  // Filter and sum the debits and credits
  const filteredTrialBalance = Object.keys(trialBalance).filter((noteNumber) => {
    const { total_debits, total_credits } = trialBalance[noteNumber];
    if (total_debits > 0 || total_credits > 0) {
      totalDebits += total_debits;
      totalCredits += total_credits;
      return true;
    }
    return false;
  }).reduce((result, noteNumber) => {
    result[noteNumber] = trialBalance[noteNumber];
    return result;
  }, {});

  // Render the component based on loading and error states
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Render the trial balance data
  return (
    <div>
      <h1>Trial Balance</h1>
      <table>
        <thead>
          <tr>
            <th className="mose">Parent Account</th>
            <th className="mose">Subaccounts</th>
            <th className="mose">Total Debits</th>
            <th className="mose">Total Credits</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(filteredTrialBalance).map((noteNumber) => {
            const { parent_account, relevant_accounts, total_debits, total_credits } = filteredTrialBalance[noteNumber];
            return (
              <React.Fragment key={noteNumber}>
                <tr>
                  <td rowSpan={Object.keys(relevant_accounts).length + 1}>{parent_account}</td>
                </tr>
                {Object.keys(relevant_accounts).map((account) => {
                  const { amounts, total } = relevant_accounts[account];
                  return (
                    <tr key={account}>
                      <td>{account}</td>
                      <td>{total_debits > 0 ? total.toFixed(2) : '0.00'}</td>
                      <td>{total_credits > 0 ? total.toFixed(2) : '0.00'}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" className="mose"><strong>Total</strong></td>
            <td>{totalDebits.toFixed(2)}</td>
            <td>{totalCredits.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TrialBalance;