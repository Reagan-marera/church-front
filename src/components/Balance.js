import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

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
    if (['50-Other Expenditures', '50-Operating Expenses', '50-perating Expenses', '40-Revenue'].includes(accountType)) return;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'https://backend.youmingtechnologies.co.ke/balance-statement/accounts';

      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Fetch balance statement data
      const balanceResponse = await fetch(url, {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!accountData) {
    return <div>No data available.</div>;
  }

  const groupedData = groupByAccountType(accountData);
  const totals = calculateTotals(accountData);
  const netDifference = totals.totalAssets - totals.totalLiabilities;

  // Function to export data to Excel
  const exportToExcel = () => {
    const worksheetData = [];

    Object.entries(groupedData).forEach(([accountType, accounts]) => {
      accounts.forEach((account) => {
        worksheetData.push({
          'Account Type': accountType,
          'Account Name': account.accountName,
          'Note Number': account.noteNumber,
          'Parent Account': account.parentAccount,
          'Total Amount': account.totalAmount,
        });
      });
    });

    // Add totals and net difference
    worksheetData.push(
      {
        'Account Type': 'Totals',
        'Account Name': '',
        'Note Number': '',
        'Parent Account': 'Total Assets',
        'Total Amount': totals.totalAssets,
      },
      {
        'Account Type': 'Totals',
        'Account Name': '',
        'Note Number': '',
        'Parent Account': 'Total Liabilities',
        'Total Amount': totals.totalLiabilities,
      },
      {
        'Account Type': 'Totals',
        'Account Name': '',
        'Note Number': '',
        'Parent Account': 'Net Difference (Assets - Liabilities)',
        'Total Amount': netDifference,
      }
    );

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Balance Statement");
    XLSX.writeFile(workbook, "BalanceStatement.xlsx");
  };

  return (
    <div className="balance-statement-container">
      <h1>Balance Statement Accounts</h1>

      {/* Date filtering options */}
      <div className="date-filter">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={fetchData} className="filter-button">Filter</button>
      </div>

      <button onClick={exportToExcel} className="export-button">Export to Excel</button>
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
                  <td>{account.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'KSH' })}</td>
                </tr>
              ))}
              {accountType === '10-Assets' && (
                <tr>
                  <td colSpan={4} className="total-row" style={{ color: 'orange' }}>
                    Total Assets:
                  </td>
                  <td style={{ color: 'orange' }}>{totals.totalAssets.toLocaleString('en-US', { style: 'currency', currency: 'KSH' })}</td>
                </tr>
              )}
              {accountType === '20-Liabilities' && (
                <>
                  <tr>
                    <td colSpan={4} className="total-row" style={{ color: 'orange' }}>
                      Total Liabilities:
                    </td>
                    <td style={{ color: 'orange' }}>{totals.totalLiabilities.toLocaleString('en-US', { style: 'currency', currency: 'KSH' })}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="net-difference-row" style={{ color: 'orange' }}>
                      Net Difference (Assets - Liabilities):
                    </td>
                    <td style={{ color: 'orange' }}>{netDifference.toLocaleString('en-US', { style: 'currency', currency: 'KSH' })}</td>
                  </tr>
                </>
              )}
            </React.Fragment>
          ))}
          <tr style={{ fontWeight: 'bold', color: 'orange', backgroundColor: 'orange' }}>
            <td colSpan={4}>30-Net Assets</td>
            <td style={{ color: 'orange' }}>{netDifference.toLocaleString('en-US', { style: 'currency', currency: 'KSH' })}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BalanceStatementAccounts;
