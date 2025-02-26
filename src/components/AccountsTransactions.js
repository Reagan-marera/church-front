import React, { useEffect, useState } from 'react';

const AccountsTransactions = () => {
  const [noteGroups, setNoteGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the data from the Flask route
    fetch('http://127.0.0.1:5000/transactions/accounts')
      .then((response) => response.json())
      .then((data) => {
        console.log("Data fetched:", data); // Log the data to see what is received
        setNoteGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err); // Log any fetch errors
        setError('Error fetching data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Helper function to render note groups in table rows
  const renderNoteGroups = () => {
    if (!noteGroups || typeof noteGroups !== 'object') return <div>No data available</div>;

    return Object.entries(noteGroups).map(([noteNumber, data]) => {
      console.log("Rendering note group:", noteNumber, data); // Log each note group

      // Ensure the required fields exist before rendering the table
      if (!data.amounts || !data.parent_account || !data.total_amount) return null;

      return (
        <div key={noteNumber}>
          <h2>Note Number: {noteNumber}</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Parent Account</th>
                <th>Account</th>
                <th>Total for Account</th>
              </tr>
            </thead>
            <tbody>
              {/* Render amounts and relevant accounts */}
              {data.relevant_accounts && data.relevant_accounts.map((account, index) => (
                <tr key={account}>
                  <td>{data.parent_account || 'N/A'}</td>
                  <td>{account}</td>
                  <td>{data.amounts[index]}</td> {/* Sum up the amounts if needed */}
                </tr>
              ))}
              <tr>
                <td colSpan="3"><strong>Total for Note</strong></td>
                <td><strong>{data.total_amount}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    });
  };

  return (
    <div>
      <h1>Transactions Grouped by Note Numbers</h1>
      {renderNoteGroups()}
    </div>
  );
};

export default AccountsTransactions;
