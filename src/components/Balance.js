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

  // Function to calculate totals for assets and liabilities
  const calculateTotals = (data) => {
    let totalAssets100to149 = 0;
    let totalAssets150to199 = 0;
    let totalLiabilities200to259 = 0;
    let totalLiabilities250to299 = 0;

    Object.entries(data).forEach(([accountName, accountData]) => {
      const accountNumber = parseInt(accountName.split('-')[0], 10);

      if (accountNumber >= 100 && accountNumber <= 149) {
        totalAssets100to149 += accountData.total_amount || 0;
      } else if (accountNumber >= 150 && accountNumber <= 199) {
        totalAssets150to199 += accountData.total_amount || 0;
      } else if (accountNumber >= 200 && accountNumber <= 259) {
        totalLiabilities200to259 += accountData.total_amount || 0;
      } else if (accountNumber >= 250 && accountNumber <= 299) {
        totalLiabilities250to299 += accountData.total_amount || 0;
      }
    });

    const totalAssets = totalAssets100to149 + totalAssets150to199;
    const totalLiabilities = totalLiabilities200to259 + totalLiabilities250to299;

    return {
      totalAssets100to149,
      totalAssets150to199,
      totalAssets,
      totalLiabilities200to259,
      totalLiabilities250to299,
      totalLiabilities,
    };
  };

  const {
    totalAssets100to149,
    totalAssets150to199,
    totalAssets,
    totalLiabilities200to259,
    totalLiabilities250to299,
    totalLiabilities,
  } = calculateTotals(balanceData);

  // Function to group parent accounts by note numbers and filter out accounts without amounts
  const groupByNoteNumber = (data) => {
    const groupedData = {};

    Object.entries(data).forEach(([accountName, accountData]) => {
      const { notes, parent_accounts } = accountData;

      // Ensure notes and parent_accounts exist
      if (Array.isArray(notes) && parent_accounts && typeof parent_accounts === 'object') {
        // Iterate over parent_accounts
        Object.entries(parent_accounts).forEach(([parentAccount, amount], index) => {
          const noteNumber = notes[index] || null;

          // Only include accounts with a valid note number and amount
          if (noteNumber && amount !== 'N/A') {
            if (!groupedData[noteNumber]) {
              groupedData[noteNumber] = [];
            }
            groupedData[noteNumber].push({
              parentAccount,
              amount,
              accountName,
            });
          }
        });
      }
    });

    return groupedData;
  };

  // Debugging: Log the balanceData and groupedData
  console.log('balanceData:', JSON.stringify(balanceData, null, 2));
  const groupedData = groupByNoteNumber(balanceData);
  console.log('groupedData:', groupedData);

  return (
    <div className="balance-statement-container">
      <h1>Balance Sheet</h1>
      {Object.entries(balanceData).map(([accountName, data]) => {
        const groupedData = groupByNoteNumber({ [accountName]: data });

        // Skip rendering if no valid note numbers or amounts are found
        if (Object.keys(groupedData).length === 0) {
          return null;
        }

        return (
          <div key={accountName} className="account-group">
            <h2>{accountName}</h2>
            <table className="balance-table">
              <thead>
                <tr>
                  <th>Parent Account</th>
                  <th>Note Number</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedData).map(([noteNumber, parentAccounts]) => (
                  <React.Fragment key={noteNumber}>
                    {parentAccounts.map(({ parentAccount, amount }, index) => (
                      <tr key={`${noteNumber}-${index}`}>
                        <td>{parentAccount}</td>
                        <td>{index === 0 ? noteNumber : ''}</td>
                        <td>{amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ color: '#ff8c42' }}>
                    <strong>Total Amount for {accountName}</strong>
                  </td>
                  <td>
                    <strong>{data.total_amount.toLocaleString()}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      {/* Display Totals */}
      <div className="totals-section">
        <h2>Totals</h2>
        <table className="balance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Assets (100-149)</td>
              <td>{totalAssets100to149.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total Assets (150-199)</td>
              <td>{totalAssets150to199.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Total Assets</strong></td>
              <td><strong>{totalAssets.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td>Total Liabilities (200-259)</td>
              <td>{totalLiabilities200to259.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total Liabilities (250-299)</td>
              <td>{totalLiabilities250to299.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Total Liabilities</strong></td>
              <td><strong>{totalLiabilities.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BalanceSheet;