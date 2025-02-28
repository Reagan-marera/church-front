import React, { useEffect, useState } from 'react';

const Incomestatement = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/income-statement/accounts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setBalanceData(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="balance-statement-container">
      <h1>Income Statement </h1>
      {Object.entries(balanceData).map(([accountName, data]) => (
        <div key={accountName} className="account-group">
          <h2>{accountName}</h2>
          <table className="balance-table">
            <thead>
              <tr>
                <th>Parent Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Check if parent_accounts is an array or object */}
              {Array.isArray(data.parent_accounts)
                ? data.parent_accounts.map((parentAccount, index) => (
                    <tr key={index}>
                      <td>{parentAccount}</td>
                      <td>{data.amounts[index].toLocaleString()}</td>
                    </tr>
                  ))
                : Object.entries(data.parent_accounts).map(([parentAccount, amount]) => (
                    <tr key={parentAccount}>
                      <td>{parentAccount}</td>
                      <td>{amount.toLocaleString()}</td>
                    </tr>
                  ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total Amount</strong></td>
                <td><strong>{data.total_amount.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Incomestatement;
