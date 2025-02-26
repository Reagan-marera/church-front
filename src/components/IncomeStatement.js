import React, { useEffect, useState } from 'react';

const IncomeStatement = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the Flask backend
    fetch('http://127.0.0.1:5000/income-statement/accounts')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setIncomeData(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Income Statement</h1>
      {incomeData && Object.keys(incomeData).length > 0 ? (
        <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Note Number</th>
              <th>Parent Account</th>
              <th>Relevant Accounts</th>
              <th>Amounts</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(incomeData).map(([note, data]) => (
              <tr key={note}>
                <td>{note}</td>
                <td>{data.parent_account}</td>
                <td>{data.relevant_accounts.join(', ')}</td>
                <td>{data.amounts.join(', ')}</td>
                <td>{data.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default IncomeStatement;
