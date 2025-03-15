import React, { useEffect, useState } from 'react';

const CashFlowStatement = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/cash_flow_statement', {
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

  // Function to calculate totals for revenue and expenses
  const calculateTotals = (data) => {
    let totalRevenue400to449 = 0;
    let totalRevenue450to479 = 0;
    let totalExpenses500to599 = 0;

    Object.entries(data).forEach(([accountName, accountData]) => {
      const accountNumber = parseInt(accountName.split('-')[0], 10);

      if (accountNumber >= 400 && accountNumber <= 449) {
        totalRevenue400to449 += accountData.total_amount || 0;
      } else if (accountNumber >= 450 && accountNumber <= 479) {
        totalRevenue450to479 += accountData.total_amount || 0;
      } else if (accountNumber >= 500 && accountNumber <= 599) {
        totalExpenses500to599 += accountData.total_amount || 0;
      }
    });

    const totalRevenue = totalRevenue400to449 + totalRevenue450to479;
    const netSurplusDeficit = totalRevenue - totalExpenses500to599;

    return {
      totalRevenue400to449,
      totalRevenue450to479,
      totalRevenue,
      totalExpenses500to599,
      netSurplusDeficit,
    };
  };

  const {
    totalRevenue400to449,
    totalRevenue450to479,
    totalRevenue,
    totalExpenses500to599,
    netSurplusDeficit,
  } = calculateTotals(balanceData);

  // Function to group parent accounts by note numbers and filter out accounts without amounts
  const groupByNoteNumber = (data) => {
    const groupedData = {};

    Object.entries(data).forEach(([accountName, accountData]) => {
      if (Array.isArray(accountData.parent_accounts)) {
        accountData.parent_accounts.forEach((parentAccount, index) => {
          const noteNumber = accountData.notes ? accountData.notes[index] : null;
          const amount = accountData.amounts ? accountData.amounts[index] : 'N/A';

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
      } else {
        Object.entries(accountData.parent_accounts).forEach(([parentAccount, parentData]) => {
          const noteNumber = parentData.note_number || null;
          const amount = parentData.amount ? parentData.amount : 'N/A';

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

  return (
    <div className="balance-statement-container">
      <h1>Income Statement</h1>
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
              <td>Total Revenue (400-449)</td>
              <td>{totalRevenue400to449.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total Revenue (450-479)</td>
              <td>{totalRevenue450to479.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Total Revenue</strong></td>
              <td><strong>{totalRevenue.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td>Total Expenses (500-599)</td>
              <td>{totalExpenses500to599.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Net Surplus/Deficit</strong></td>
              <td><strong>{netSurplusDeficit.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowStatement;