import React, { useEffect, useState } from 'react';

// Helper function to calculate totals
const calculateTotals = (data) => {
  let totalAssets100to149 = 0;
  let totalAssets150to199 = 0;
  let totalLiabilities200to259 = 0;
  let totalLiabilities250to299 = 0;

  Object.entries(data).forEach(([key, accountGroup]) => {
    const accountNumber = parseInt(accountGroup.account_name.split('-')[0], 10);
    const totalAmount = Math.abs(accountGroup.total_amount || 0); // Ensure positive amounts

    if (accountNumber >= 10 && accountNumber <= 149) {
      totalAssets100to149 += totalAmount;
    } else if (accountNumber >= 150 && accountNumber <= 199) {
      totalAssets150to199 += totalAmount;
    } else if (accountNumber >= 200 && accountNumber <= 259) {
      totalLiabilities200to259 += totalAmount;
    } else if (accountNumber >= 250 && accountNumber <= 299) {
      totalLiabilities250to299 += totalAmount;
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

// Helper function to group data by account type
const groupByAccountType = (data) => {
  const groupedData = {};

  Object.entries(data).forEach(([key, accountGroup]) => {
    const accountType = accountGroup.account_type;

    if (['40-Revenue', '50-Expenses'].includes(accountType)) return;

    let accountName = accountGroup.account_name.replace(/-\d+$/, '');

    if (!groupedData[accountType]) {
      groupedData[accountType] = {};
    }

    const accountKey = `${accountName}-${accountGroup.parent_account}`;

    if (!groupedData[accountType][accountKey]) {
      groupedData[accountType][accountKey] = {
        accountName,
        noteNumber: accountGroup.note_number,
        parentAccount: accountGroup.parent_account,
        totalAmount: 0,
      };
    }

    groupedData[accountType][accountKey].totalAmount += Math.abs(accountGroup.total_amount); // Ensure positive amounts
  });

  Object.keys(groupedData).forEach((accountType) => {
    groupedData[accountType] = Object.values(groupedData[accountType]).sort((a, b) =>
      a.parentAccount.localeCompare(b.parentAccount, undefined, { numeric: true })
    );
  });

  return groupedData;
};

const BalanceStatementAccounts = () => {
  const [accountData, setAccountData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch balance statement data
        const balanceResponse = await fetch('http://127.0.0.1:5000/balance-statement/accounts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!balanceResponse.ok) {
          throw new Error(`HTTP error! status: ${balanceResponse.status}`);
        }

        const balanceData = await balanceResponse.json();
        setAccountData(balanceData);

        // Fetch income statement data
        const incomeResponse = await fetch('http://127.0.0.1:5000/income-statement/accounts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!incomeResponse.ok) {
          throw new Error(`HTTP error! status: ${incomeResponse.status}`);
        }

        const incomeData = await incomeResponse.json();
        setIncomeData(incomeData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const groupedData = groupByAccountType(accountData);
  const totals = calculateTotals(accountData);
  const netDifference = totals.totalAssets - totals.totalLiabilities;

  // Calculate net surplus/deficit from income statement data
  const groupByAccountTypeIncome = (data) => {
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

  const incomeGroupedData = groupByAccountTypeIncome(incomeData);
  const categoryTotals = {};
  Object.entries(incomeGroupedData).forEach(([accountType, accounts]) => {
    categoryTotals[accountType] = accounts.reduce((sum, account) => sum + account.totalAmount, 0);
  });

  const totalIncome = categoryTotals['40-Revenue'] || 0;
  const totalExpenses = categoryTotals['50-Expenses'] || 0;
  const netSurplusDeficit = totalIncome - totalExpenses;

  return (
    <div className="balance-statement-container">
      <h1>Balance Statement Accounts</h1>
      <table className="balance-table" role="table" aria-label="Balance Statement">
        <thead>
          <tr>
            <th>Account Type</th>
            <th>Account Name</th>
            <th>Note Number</th>
            <th>Parent Account</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedData).map(([accountType, accounts]) => (
            <React.Fragment key={accountType}>
              <tr>
                <td colSpan={5} className="account-type-header">
                  {accountType}
                </td>
              </tr>
              {accounts.map((account, index) => (
                <tr key={`${accountType}-${index}`}>
                  <td></td>
                  <td>{account.accountName}</td>
                  <td>{account.noteNumber}</td>
                  <td>{account.parentAccount}</td>
                  <td>{account.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
                </tr>
              ))}
              {accountType === '10-Assets' && (
                <tr>
                  <td colSpan={4} className="total-row" style={{ color: 'orange' }}>
                    Total Assets:
                  </td>
                  <td style={{ color: 'orange' }}>{totals.totalAssets.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
                </tr>
              )}
              {accountType === '20-Liabilities' && (
                <>
                  <tr>
                    <td colSpan={4} className="total-row" style={{ color: 'orange' }}>
                      Total Liabilities:
                    </td>
                    <td style={{ color: 'orange' }}>{totals.totalLiabilities.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="net-difference-row" style={{ color: 'orange' }}>
                      Net Difference (Assets - Liabilities):
                    </td>
                    <td style={{ color: 'orange' }}>{netDifference.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
                  </tr>
                </>
              )}
            </React.Fragment>
          ))}
          {/* Net Surplus/Deficit Row */}
          <tr style={{ fontWeight: 'bold', color: 'orange', backgroundColor: 'orange' }}>
            <td colSpan={4}>Net Surplus/Deficit</td>
            <td>{netSurplusDeficit.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
          </tr>
          {/* Net Assets Row */}
          <tr style={{ fontWeight: 'bold', color: 'orange', backgroundColor: 'orange' }}>
            <td colSpan={4}>30-Net Assets</td>
            <td style={{ color: 'orange' }}>{netDifference.toLocaleString('en-US', { style: 'currency', currency: 'ksh' })}</td>
          </tr>
          {/* Unrestricted Net Assets Row */}
         
        </tbody>
      </table>
    </div>
  );
};

export default BalanceStatementAccounts;
