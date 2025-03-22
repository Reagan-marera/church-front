import React, { useEffect, useState } from 'react';

const BalanceSheet = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  // Debugging: Log the balanceData
  console.log('balanceData:', JSON.stringify(balanceData, null, 2));

  // Function to calculate totals for assets and liabilities
  const calculateTotals = (data) => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    Object.entries(data).forEach(([accountName, accountData]) => {
      const accountNumber = parseInt(accountName.split('-')[0], 10);

      if (accountNumber >= 100 && accountNumber <= 1999) {
        totalAssets += accountData.total_amount || 0;
      } else if (accountNumber >= 2000 && accountNumber <= 3999) {
        totalLiabilities += accountData.total_amount || 0;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
    };
  };

  const { totalAssets, totalLiabilities } = calculateTotals(balanceData);

  return (
    <div className="balance-statement-container">
      <h1>Balance Sheet</h1>

      {/* Single Table for Account Details and Totals */}
      <table className="balance-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* Render Parent Accounts */}
          {Object.entries(balanceData).map(([accountName, accountData]) => {
            const accountNumber = parseInt(accountName.split('-')[0], 10);

            return (
              <React.Fragment key={accountName}>
                {/* Render Parent Account Total */}
                <tr>
                  <td>{accountName}</td>
                  <td>{accountData.total_amount.toLocaleString()}</td>
                </tr>

                {/* Render Individual Parent Accounts */}
                {Object.entries(accountData.parent_accounts).map(([parentAccount, amount]) => (
                  <tr key={parentAccount}>
                    <td style={{ paddingLeft: '20px' }}>↳ {parentAccount}</td>
                    <td>{amount.toLocaleString()}</td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}

          {/* Render Totals */}
          <tr>
            <td colSpan={2} style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              Totals
            </td>
          </tr>
          <tr>
            <td><strong>Total Assets (100-1999)</strong></td>
            <td><strong>{totalAssets.toLocaleString()}</strong></td>
          </tr>
          <tr>
            <td><strong>Total Liabilities (2000-3999)</strong></td>
            <td><strong>{totalLiabilities.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BalanceSheet;