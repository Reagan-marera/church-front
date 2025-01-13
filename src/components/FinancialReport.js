import React, { useState, useEffect } from 'react';

const FinancialReport = () => {
  const [reportData, setReportData] = useState([]);
  const [visibleSubAccounts, setVisibleSubAccounts] = useState({});
  const [overallTotals, setOverallTotals] = useState({
    totalReceipts: 0.0,
    totalDisbursements: 0.0,
    overallClosingBalance: 0.0,
  });

  // Get the token from localStorage
  const token = localStorage.getItem('token');

  // Toggle the visibility of subaccounts for a particular parent account
  const toggleSubAccounts = (parentAccountId) => {
    setVisibleSubAccounts((prevState) => {
      const newState = {
        ...prevState,
        [parentAccountId]: !prevState[parentAccountId],
      };
      console.log('Updated visibleSubAccounts state:', newState); // Debug log
      return newState;
    });
  };

  useEffect(() => {
    if (!token) {
      console.log('No token found. Please login.');
      return;
    }

    fetch('http://127.0.0.1:5000/cash-and-cash-equivalents-report', {
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
        console.log('Fetched Data:', data);

        // Ensure the response is in the expected format
        const uniqueReportData =
          data.report_data?.filter((value, index, self) =>
            index === self.findIndex((t) => t.parent_account === value.parent_account)
          ) || [];

        setReportData(uniqueReportData);

        // Set the overall totals from the API response
        setOverallTotals({
          totalReceipts: parseFloat(data.overall_totals.total_receipts),
          totalDisbursements: parseFloat(data.overall_totals.total_disbursements),
          overallClosingBalance: parseFloat(data.overall_totals.overall_closing_balance),
        });
      })
      .catch((error) => console.error('Error fetching financial report:', error));
  }, [token]);

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
    tableRowSubAccount: { backgroundColor: '#e0e0e0' },
    toggleButton: {
      padding: '5px 10px',
      margin: '5px 0',
      cursor: 'pointer',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
    },
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
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num == null || isNaN(num)) {
      console.warn('Invalid number passed to formatNumber:', num);
      return '0.00';
    }
    const validNum = parseFloat(num);
    if (isNaN(validNum)) {
      console.warn('Invalid number passed to formatNumber:', num);
      return '0.00';
    }
    return validNum.toFixed(2);
  };

  // Ensure receipt and disbursement are correctly formatted before rendering
  const getFormattedValue = (value) => {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0.00 : parsedValue.toFixed(2);
  };

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Account</th>
            <th style={styles.tableHeader}>Opening Balance</th>
            <th style={styles.tableHeader}>Receipts</th>
            <th style={styles.tableHeader}>Disbursements</th>
            <th style={styles.tableHeader}>Closing Balance</th>
            <th style={styles.tableHeader}>Subaccounts</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length > 0 ? (
            reportData.map((parentAccount, index) => {
              console.log('Parent Account:', parentAccount); // Debug log to check subaccount details
              const openingBalance = parentAccount.opening_balance || '0.00';
              const receipts = parentAccount.receipts || '0.00';
              const disbursements = parentAccount.disbursements || '0.00';
              const closingBalance = parentAccount.closing_balance || '0.00';

              return (
                <React.Fragment key={index}>
                  {/* Parent Account row */}
                  <tr style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td style={styles.tableCell}>{parentAccount.parent_account}</td>
                    <td style={styles.tableCell}>{getFormattedValue(openingBalance)}</td>
                    <td style={styles.tableCell}>{getFormattedValue(receipts)}</td>
                    <td style={styles.tableCell}>{getFormattedValue(disbursements)}</td>
                    <td style={styles.tableCell}>{getFormattedValue(closingBalance)}</td>
                    <td style={styles.tableCell}>
                      <button
                        style={styles.toggleButton}
                        onClick={() => toggleSubAccounts(parentAccount.parent_account)}
                      >
                        {visibleSubAccounts[parentAccount.parent_account]
                          ? 'Hide Subaccounts'
                          : 'Show Subaccounts'}
                      </button>
                    </td>
                  </tr>

                  {/* Check for subaccount name */}
                  {parentAccount.sub_account_name ? (
                    visibleSubAccounts[parentAccount.parent_account] && (
                      <tr style={styles.tableRowSubAccount}>
                        <td style={styles.tableCell}>{parentAccount.sub_account_name}</td>
                        <td style={styles.tableCell}>{getFormattedValue(openingBalance)}</td>
                        <td style={styles.tableCell}>{getFormattedValue(receipts)}</td>
                        <td style={styles.tableCell}>{getFormattedValue(disbursements)}</td>
                        <td style={styles.tableCell}>{getFormattedValue(closingBalance)}</td>
                        <td></td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan="6" style={styles.tableCell}>
                        No subaccounts available
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" style={styles.tableCell}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
              <td style={styles.tableCell}>{getFormattedValue(overallTotals.totalReceipts)}</td>
              <td style={styles.tableCell}>{getFormattedValue(overallTotals.totalDisbursements)}</td>
              <td style={styles.tableCell}>{getFormattedValue(overallTotals.overallClosingBalance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialReport;
