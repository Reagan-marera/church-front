import React, { useEffect, useState } from 'react';
import './incomestatement.css';

const IncomeStatement = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Retrieve the JWT token from local storage or wherever it's stored
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

    fetchData();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredData = incomeData
    ? Object.entries(incomeData).filter(([note, data]) => {
        const accountNameMatch = data.account_names.some(accountName =>
          accountName.toLowerCase().includes(searchQuery)
        );
        const parentAccountMatch = data.parent_account
          .toLowerCase()
          .includes(searchQuery);

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

      {incomeData && filteredData.length > 0 ? (
        <div className="income-statement-content">
          {filteredData.map(([note, data]) => (
            <div className="note-group" key={note}>
              {/* Display account names as the heading */}
              <div className="parent-account">
                <h2>{data.account_names.join(', ')}</h2>
              </div>

              {/* Table to display the data */}
              <table className="income-table">
                <thead>
                  <tr>
                    <th>Parent Account</th>
                    <th>Note Number</th>
                  
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.parent_account}</td>
                    <td>{note}</td>
                   
                    <td>{data.total_amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default IncomeStatement;