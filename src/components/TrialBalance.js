import React, { useState, useEffect } from 'react';
import './trialbalance.css';

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrialBalance = async () => {
    try {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  let totalDebits = 0;
  let totalCredits = 0;

  const filteredTrialBalance = Object.keys(trialBalance).reduce((result, noteNumber) => {
    const { total_debits, total_credits, relevant_accounts, parent_account } = trialBalance[noteNumber];
    totalDebits += total_debits;
    totalCredits += total_credits;
    result[noteNumber] = {
      parent_account: parent_account || 'Unknown',
      relevant_accounts,
      total_debits,
      total_credits,
    };
    return result;
  }, {});

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
            const subaccounts = Object.keys(relevant_accounts);

            return (
              <React.Fragment key={noteNumber}>
                {subaccounts.map((account, index) => {
                  const total = relevant_accounts[account].total;
                  return (
                    <tr key={account}>
                      {index === 0 && <td rowSpan={subaccounts.length}>{parent_account}</td>}
                      <td>{account}</td>
                      <td>{total_debits > 0 ? total_debits.toFixed(2) : '0.00'}</td>
                      <td>{total_credits > 0 ? total_credits.toFixed(2) : '0.00'}</td>
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
