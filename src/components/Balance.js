import React, { useEffect, useState } from 'react';
import './incomestatement.css';

const Balance = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/balance-statement/accounts', {
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
      setIncomeData(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredData = incomeData
    ? Object.entries(incomeData).filter(([accountName, data]) => {
        const accountNameMatch = accountName.toLowerCase().includes(searchQuery);
        const parentAccountMatch = data.parent_accounts.some((parentAccount) =>
          parentAccount.toLowerCase().includes(searchQuery)
        );
        return accountNameMatch || parentAccountMatch;
      })
    : [];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="income-statement-container">
      <h1>Balance Statement</h1>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Account Name or Parent Account..."
          onChange={handleSearch}
        />
      </div>

      {filteredData.length > 0 ? (
        <div className="income-statement-content">
          {filteredData.map(([accountName, data]) => (
            <div className="note-group" key={accountName}>
              <div className="parent-account">
                <h2>{accountName}</h2>
              </div>

              {/* Table to display the data */}
              <div className="tables-container">
                <table className="excel-like-table">
                  <thead>
                    <tr>
                      <th>Parent Account</th>
                      <th>Note Number</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.parent_accounts.map((parentAccount, index) => (
                      <tr key={index}>
                        <td>{parentAccount}</td>
                        <td>{data.notes[index]}</td>
                        {/* Display the total amount only in the first row */}
                        {index === 0 ? (
                          <td rowSpan={data.parent_accounts.length}>
                            {data.total_amount}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default Balance;
