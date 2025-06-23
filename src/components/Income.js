import React, { useEffect, useState } from 'react';

const IncomeStatement = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://backend.youmingtechnologies.co.ke/income-statement/accounts', {
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

      // Calculate total amount for each account
      const totalAmount = Object.values(accountGroup.parent_accounts).reduce(
        (sum, parentData) => sum + parentData.amount, 0
      );

      groupedData[accountType].push({
        accountName,
        parentAccounts: accountGroup.parent_accounts,
        totalAmount, // Include totalAmount in the account object
      });
    });

    return groupedData;
  };

  const groupedData = groupByAccountType(balanceData);

  // Calculate total amounts for each category
  const categoryTotals = {};
  Object.entries(groupedData).forEach(([accountType, accounts]) => {
    categoryTotals[accountType] = accounts.reduce((sum, account) => sum + account.totalAmount, 0);
  });

  // Calculate net surplus/deficit
  const totalIncome = categoryTotals['40-Revenue'] || 0;
  const totalExpenses = categoryTotals['50-Operating Expenses'] || 0;
  const netSurplusDeficit = totalIncome - totalExpenses;

  return (
    <div className="balance-statement-container">
      <h1>Income Statement</h1>
      <table className="balance-table">
        <thead>
          <tr>
            <th>Account Type</th>
            <th>Account Name</th>
            <th>Note Number</th>
            <th>Parent Account</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([accountType, accounts]) => (
            <React.Fragment key={accountType}>
              <tr>
                <td colSpan={5} style={{ fontWeight: 'bold', color: 'black', backgroundColor: '#f0f0f0' }}>
                  {accountType}
                </td>
              </tr>
              {accounts.map((account, index) => (
                Object.entries(account.parentAccounts)
                  .filter(([_, parentData]) => parentData.amount > 0)
                  .map(([parentAccount, parentData], idx) => (
                    <tr key={`${accountType}-${index}-${idx}`}>
                      <td></td>
                      <td>{account.accountName}</td>
                      <td>{parentData.note_number}</td>
                      <td>{parentAccount}</td>
                      <td>{parentData.amount.toLocaleString()}</td>
                    </tr>
                  ))
              ))}
            </React.Fragment>
          ))}
          <tr style={{ fontWeight: 'bold', color: 'orange', backgroundColor: '#fff8e1' }}>
            <td colSpan={4}>Net Surplus/Deficit</td>
            <td>{netSurplusDeficit.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default IncomeStatement;
