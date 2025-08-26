import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './TransactionList.css'; // Import the CSS file

const AccountsTransactions = () => {
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    console.log('Token:', token);

    if (!token) {
      setError(new Error('No token found. Please log in again.'));
      setLoading(false);
      return;
    }

    try {
      let url = 'https://backend.youmingtechnologies.co.ke/transactions/accounts';

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

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions. Please try again later.');
      }

      const data = await response.json();
      console.log('Data:', data);

      // Extract the account balances from the response
      const accountBalances = data.account_balances || [];

      // Group accounts by parent account and note number
      const groupedAccounts = groupAccountsByParentAndNote(accountBalances);
      setTransactions(groupedAccounts);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error);
      setLoading(false);
    }
  };

  const groupAccountsByParentAndNote = (accounts) => {
    const grouped = {};
    accounts.forEach((account) => {
      const key = `${account.parent_account || 'No Parent'}`;
      if (!grouped[key]) {
        grouped[key] = { accounts: [], total: 0 };
      }
      grouped[key].accounts.push(account);
      grouped[key].total += account.balance;
    });
    return grouped;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES', // Kenyan Shillings
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportToExcel = () => {
    const worksheetData = [];

    Object.entries(transactions).forEach(([parentAccount, { accounts, total }]) => {
      accounts.forEach((account) => {
        if (account.note_number && account.note_number !== 'N/A') {
          worksheetData.push({
            'Parent Account': parentAccount,
            'Note Number': account.note_number,
            'Account': account.account,
            'Balance': account.balance,
          });
        }
      });

      // Add total row for each parent account
      worksheetData.push({
        'Parent Account': `Total for ${parentAccount}`,
        'Note Number': '',
        'Account': '',
        'Balance': total,
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AccountBalances");
    XLSX.writeFile(workbook, "AccountBalances.xlsx");
  };

  if (loading) {
    return <div className="loading">Loading financial data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Account Balances</h1>

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
        <button onClick={fetchTransactions} className="filter-button">Filter</button>
      </div>

      <button onClick={exportToExcel} className="export-button">
        Export to Excel
      </button>
      {Object.keys(transactions).length === 0 ? (
        <div className="no-data">No transactions available.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Note Number</th>
              <th>Account</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(transactions).map(([parentAccount, { accounts, total }], index) => {
              // Filter out accounts with "N/A" or missing note_number
              const filteredAccounts = accounts.filter(
                (account) => account.note_number && account.note_number !== 'N/A'
              );

              return (
                <React.Fragment key={index}>
                  <tr className="group-header">
                    <td>{parentAccount}</td>
                    <td></td>
                    <td colSpan="2"></td>
                  </tr>
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account, idx) => (
                      <tr key={idx}>
                        <td></td>
                        <td>{account.note_number}</td>
                        <td>{account.account}</td>
                        <td>{formatCurrency(account.balance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No valid accounts available for this parent.</td>
                    </tr>
                  )}
                  <tr className="group-total">
                    <td colSpan="3" style={{ color: 'orange' }}>
                      Total for {parentAccount}
                    </td>
                    <td style={{ color: 'orange' }}>{formatCurrency(total)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AccountsTransactions;
