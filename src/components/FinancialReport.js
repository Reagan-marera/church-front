import React, { useState, useEffect } from 'react';

const FinancialReport = () => {
  const [reportData, setReportData] = useState([]);
  const [overallTotals, setOverallTotals] = useState({
    totalReceipts: 0.0,
    totalDisbursements: 0.0,
    overallClosingBalance: 0.0,
  });

  const [reportType, setReportType] = useState('cash_and_cash_equivalents');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [asOfDate, setAsOfDate] = useState('');

  // Get the token from localStorage
  const token = localStorage.getItem('token');

  // Fetch report data whenever any of the dependencies change
  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate, asOfDate, token]); // Include all relevant state as dependencies

  const fetchReportData = () => {
    if (!token) {
      console.log('No token found. Please login.');
      return;
    }

    let url = `http://127.0.0.1:5000/reports?type=${reportType}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (asOfDate) url += `&as_of_date=${asOfDate}`;

    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login to access the data.');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched Data:', data); // Check the fetched data

        if (data.error) {
          console.error(data.error);
          return;
        }

        if (reportType === 'cash_and_cash_equivalents') {
          setReportData([{
            parent_account: 'Cash',
            opening_balance: data.cash_opening_balance,
            receipts: data.total_receipts,
            disbursements: data.total_disbursements,
            closing_balance: data.cash_closing_balance,
            sub_account_details: data.sub_account_details || [], // Include sub-account details
          }]);
        } else if (reportType === 'income_statement') {
          setReportData([{
            revenue: data.revenue,
            expenses: data.expenses,
            net_income: data.net_income,
            sub_account_details: data.sub_account_details || [], // Include sub-account details
          }]);
        } else if (reportType === 'balance_sheet') {
          setReportData([{
            assets: data.assets,
            liabilities: data.liabilities,
            equity: data.equity,
            sub_account_details: data.sub_account_details || [], // Include sub-account details
          }]);
        }

        // Set the overall totals (assuming they are returned from the API)
        setOverallTotals({
          totalReceipts: parseFloat(data.total_receipts || 0.0),
          totalDisbursements: parseFloat(data.total_disbursements || 0.0),
          overallClosingBalance: parseFloat(data.cash_closing_balance || 0.0),
        });
      })
      .catch((error) => console.error('Error fetching financial report:', error));
  };

  const styles = {
    tableContainer: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: {
      backgroundColor: '#f2f2f2',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: '8px',
      border: '1px solid #ddd',
    },
    tableCell: {
      padding: '8px',
      textAlign: 'right',
      border: '1px solid #ddd',
    },
    tableRowEven: { backgroundColor: '#f9f9f9' },
    tableRowOdd: { backgroundColor: '#fff' },
    overallTotalsSection: {
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#f2f2f2',
      borderRadius: '4px',
    },
    overallTotalsTable: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    boldText: {
      fontWeight: 'bold',
    },
    dateInput: {
      margin: '5px 0',
      padding: '5px',
      width: '200px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    selectInput: {
      margin: '5px 0',
      padding: '5px',
      width: '200px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    dateLabel: {
      fontWeight: 'bold',
      marginRight: '10px',
      display: 'inline-block',
      width: '150px',
    },
    formGroup: {
      marginBottom: '15px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num == null || isNaN(num)) {
      return '0.00';
    }
    return parseFloat(num).toFixed(2);
  };

  return (
    <div>
      {/* Report Type Selection */}
      <div>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={styles.selectInput}
        >
          <option value="cash_and_cash_equivalents">Cash and Cash Equivalents</option>
          <option value="income_statement">Income Statement</option>
          <option value="balance_sheet">Balance Sheet</option>
        </select>
      </div>

      {/* Date Filters for Report */}
      <div>
        <div style={styles.formGroup}>
          <label style={styles.dateLabel}>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.dateLabel}>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        {reportType === 'balance_sheet' && (
          <div style={styles.formGroup}>
            <label style={styles.dateLabel}>As Of Date:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              style={styles.dateInput}
            />
          </div>
        )}
      </div>

      {/* Report Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              {reportType === 'cash_and_cash_equivalents' && (
                <>
                  <th style={styles.tableHeader}>Account</th>
                  <th style={styles.tableHeader}>Opening Balance</th>
                  <th style={styles.tableHeader}>Receipts</th>
                  <th style={styles.tableHeader}>Disbursements</th>
                  <th style={styles.tableHeader}>Closing Balance</th>
                </>
              )}
              {reportType === 'income_statement' && (
                <>
                  <th style={styles.tableHeader}>Revenue</th>
                  <th style={styles.tableHeader}>Expenses</th>
                  <th style={styles.tableHeader}>Net Income</th>
                </>
              )}
              {reportType === 'balance_sheet' && (
                <>
                  <th style={styles.tableHeader}>Assets</th>
                  <th style={styles.tableHeader}>Liabilities</th>
                  <th style={styles.tableHeader}>Equity</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {reportData.length > 0 ? (
              reportData.map((data, index) => (
                <tr style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd} key={index}>
                  {reportType === 'cash_and_cash_equivalents' && (
                    <>
                      <td style={styles.tableCell}>Cash</td>
                      <td style={styles.tableCell}>{formatNumber(data.opening_balance)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.receipts)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.disbursements)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.closing_balance)}</td>
                    </>
                  )}
                  {reportType === 'income_statement' && (
                    <>
                      <td style={styles.tableCell}>{formatNumber(data.revenue)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.expenses)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.net_income)}</td>
                    </>
                  )}
                  {reportType === 'balance_sheet' && (
                    <>
                      <td style={styles.tableCell}>{formatNumber(data.assets.cash_and_equivalents)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.liabilities.accounts_payable)}</td>
                      <td style={styles.tableCell}>{formatNumber(data.equity.owner_equity)}</td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={styles.tableCell}>No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Display Sub-Account Details */}
      {reportData.length > 0 && reportData[0]?.sub_account_details?.length > 0 && (
        <div style={styles.overallTotalsSection}>
          <h3>Sub-Account Details</h3>
          <table style={styles.overallTotalsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Sub-Account Name</th>
                <th style={styles.tableHeader}>Sub-Account Balance</th>
              </tr>
            </thead>
            <tbody>
              {reportData[0].sub_account_details.map((subAccount, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{subAccount.sub_account_name}</td>
                  <td style={styles.tableCell}>{formatNumber(subAccount.sub_account_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display Overall Totals */}
      <div style={styles.overallTotalsSection}>
        <h3>Overall Totals</h3>
        <table style={styles.overallTotalsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Total Receipts</th>
              <th style={styles.tableHeader}>Total Disbursements</th>
              <th style={styles.tableHeader}>Overall Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.tableCell}>{formatNumber(overallTotals.totalReceipts)}</td>
              <td style={styles.tableCell}>{formatNumber(overallTotals.totalDisbursements)}</td>
              <td style={styles.tableCell}>{formatNumber(overallTotals.overallClosingBalance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialReport;
