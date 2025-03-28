import React, { useEffect, useState } from 'react';

const ConsolidatedBudget = () => {
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/consolidated-budget', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch consolidated budgets');
        }

        const data = await response.json();
        setBudget(data);
      } catch (error) {
        console.error('Error fetching consolidated budgets:', error);
      }
    };

    fetchBudget();
  }, []);

  if (!budget) {
    return <div>Loading...</div>;
  }

  // Function to format amount in KSH with commas
  const formatAmount = (amount) => {
    return amount.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    });
  };

  // Function to calculate the total for each category
  const calculateTotal = (accounts, type) => {
    return accounts.reduce((total, account) => total + account[type], 0);
  };

  return (
    <div>
      <h2>Consolidated Budget</h2>

      {/* Capital Budget */}
      <div>
        <h3>Capital Budget</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              <th>Adjusted Total</th>
            </tr>
          </thead>
          <tbody>
            {budget.capital_budget.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                <td>{formatAmount(account.adjusted_total)}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.capital_budget.accounts, 'original_total'))}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.capital_budget.accounts, 'adjusted_total'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Receipts */}
      <div>
        <h3>Receipts</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              <th>Adjusted Total</th>
            </tr>
          </thead>
          <tbody>
            {budget.receipts.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                <td>{formatAmount(account.adjusted_total)}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.receipts.accounts, 'original_total'))}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.receipts.accounts, 'adjusted_total'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div>
        <h3>Payments</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              <th>Adjusted Total</th>
            </tr>
          </thead>
          <tbody>
            {budget.payments.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                <td>{formatAmount(account.adjusted_total)}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.payments.accounts, 'original_total'))}
              </td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.payments.accounts, 'adjusted_total'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Surplus/Deficit */}
      <div>
        <h3 style={{ textAlign: 'right', fontWeight: 'bold' }}>Surplus/Deficit for the year</h3>
        <p style={{ color: 'black', textAlign: 'right', fontWeight: 'bold' }}>
          Original: {formatAmount(budget.surplus_deficit.original_total)}
        </p>
        <p style={{ color: 'black', textAlign: 'right', fontWeight: 'bold' }}>
          Adjusted: {formatAmount(budget.surplus_deficit.adjusted_total)}
        </p>
      </div>
    </div>
  );
};

export default ConsolidatedBudget;
