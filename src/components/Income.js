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

  // Group accounts by account_type
  const groupByAccountType = (data) => {
    const groupedData = {};

    Object.entries(data).forEach(([accountName, accountGroup]) => {
      const accountType = accountGroup.account_type;

      if (!groupedData[accountType]) {
        groupedData[accountType] = [];
      }

      groupedData[accountType].push({
        accountName,
        parentAccounts: accountGroup.parent_accounts,
        totalAmount: accountGroup.total_amount,
      });
    });

    return groupedData;
  };

  const groupedData = groupByAccountType(balanceData);

  return (
    <div className="balance-statement-container">
      <h1>Income Statement</h1>
      <table className="balance-table">
        <thead>
          <tr>
            <th>Account Type</th>
            <th>Account Name</th>
            <th>Parent Account</th>
            <th>Amount</th>
            <th>Note Number</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([accountType, accounts]) => (
            <React.Fragment key={accountType}>
              {/* Render account type as a header row */}
              <tr>
                <td colSpan={5} style={{ fontWeight: 'bold', color: 'black', backgroundColor: '#f0f0f0' }}>
                  {accountType}
                </td>
              </tr>
              {/* Render each account under the account type */}
              {accounts.map((account, index) => (
                Object.entries(account.parentAccounts)
                  .filter(([_, parentData]) => parentData.amount > 0) // Filter out accounts with amount 0
                  .map(([parentAccount, parentData], idx) => (
                    <tr key={`${accountType}-${index}-${idx}`}>
                      <td></td> {/* Empty cell for account type column */}
                      <td>{account.accountName}</td>
                      <td>{parentAccount}</td>
                      <td>{parentData.amount.toLocaleString()}</td>
                      <td>{parentData.note_number}</td>
                    </tr>
                  ))
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Incomestatement;