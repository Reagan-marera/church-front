import React, { useEffect, useState } from 'react';
import './incomestatement.css';

const IncomeStatement = () => {
  const [incomeData, setIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      <h1>Income Statement</h1>
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
              <div className="parent-account">
                <h2>{data.parent_account}</h2>
              </div>
              {data.account_names.map((accountName, index) => (
                <div className="account-section" key={index}>
                  <h3>{accountName}</h3>
                  <ul>
                    {data.relevant_accounts.map((account, idx) => (
                      <li key={idx}>{account}</li>
                    ))}
                  </ul>
                  <div>Total Amount: {data.total_amount}</div>
                </div>
              ))}
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
