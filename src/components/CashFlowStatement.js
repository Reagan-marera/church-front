import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './CashFlowStatement.css'; // Import CSS for styling
import { useBalance } from './BalanceContext';

const CashFlowStatement = () => {
  const { balances } = useBalance();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/cash-flow', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Network response was not ok');
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

  const calculateTotals = (data) => {
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;
    const categoryTotals = {};

    Object.entries(data).forEach(([category, accounts]) => {
      let categoryTotal = 0;
      accounts.forEach((account) => {
        const inflowCash = account.inflow_cash || 0;
        const inflowBank = account.inflow_bank || 0;
        const outflowCash = account.outflow_cash || 0;
        const outflowBank = account.outflow_bank || 0;
        const netCashFlow = inflowCash + inflowBank - outflowCash - outflowBank;
        categoryTotal += netCashFlow;

        if (category === 'Operating Activities') {
          totalOperating += netCashFlow;
        } else if (category === 'Investing Activities') {
          totalInvesting += netCashFlow;
        } else if (category === 'Financing Activities') {
          totalFinancing += netCashFlow;
        }
      });

      categoryTotals[category] = categoryTotal;
    });

    const netCashFlow = totalOperating + totalInvesting + totalFinancing;
    return {
      totalOperating,
      totalInvesting,
      totalFinancing,
      netCashFlow,
      categoryTotals,
    };
  };

  const {
    totalOperating,
    totalInvesting,
    totalFinancing,
    netCashFlow,
    categoryTotals,
  } = calculateTotals(balanceData);

  const exportToExcel = () => {
    const dataForExcel = [];

    Object.entries(balanceData).forEach(([category, accounts]) => {
      accounts.forEach((account) => {
        dataForExcel.push({
          Category: category,
          ParentAccount: account.parent_account,
          InflowCash: account.inflow_cash || 0,
          InflowBank: account.inflow_bank || 0,
          OutflowCash: account.outflow_cash || 0,
          OutflowBank: account.outflow_bank || 0,
          NetCashFlow: (account.inflow_cash + account.inflow_bank - account.outflow_cash - account.outflow_bank) || 0,
        });
      });

      // Add Category Total row
      dataForExcel.push({
        Category: `${category} Total`,
        ParentAccount: 'N/A',
        InflowCash: 'N/A',
        InflowBank: 'N/A',
        OutflowCash: 'N/A',
        OutflowBank: 'N/A',
        NetCashFlow: categoryTotals[category],
      });
    });

    // Add Overall Totals row
    dataForExcel.push({
      Category: 'Overall Total',
      ParentAccount: 'N/A',
      InflowCash: 'N/A',
      InflowBank: 'N/A',
      OutflowCash: 'N/A',
      OutflowBank: 'N/A',
      NetCashFlow: netCashFlow,
    });

    // Create a new worksheet and add the data
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CashFlowStatement');

    // Export the Excel file
    XLSX.writeFile(wb, 'CashFlowStatement.xlsx');
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0.00"; // Handle undefined or null
    if (value < 0) {
      return `(${Math.abs(value).toLocaleString()})`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="cash-flow-statement-container">
      <h1>Cash Flow Statement</h1>

      {/* Button to Export to Excel */}
      <button onClick={exportToExcel} className="export-button">
        Export to Excel
      </button>

      {/* Display category-wise cash flow */}
      {Object.entries(balanceData || {}).map(([category, accounts]) => {
        const categoryTotal = accounts.reduce(
          (acc, account) =>
            acc +
            (account.inflow_cash || 0) +
            (account.inflow_bank || 0) -
            (account.outflow_cash || 0) -
            (account.outflow_bank || 0),
          0
        );

        return (
          <div key={category} className="category-section">
            <h2>{category}</h2>
            <table className="cash-flow-table">
              <thead>
                <tr>
                  <th>Parent Account</th>
                  <th>Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => {
                  const netCashFlow =
                    (account.inflow_cash || 0) +
                    (account.inflow_bank || 0) -
                    (account.outflow_cash || 0) -
                    (account.outflow_bank || 0);

                  return (
                    <tr key={index}>
                      <td>{account.parent_account}</td>
                      <td>{formatNumber(netCashFlow)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td><strong>Net CashFlows From {category}</strong></td>
                  <td><strong>{formatNumber(categoryTotal)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Display Overall Net Cash Flow */}
      <div className="totals-section">
        <h2>Overall Net Cash Flow</h2>
        <table className="totals-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Opening Balance</strong></td>
              <td><strong>{formatNumber(balances.openingBalance)}</strong></td>
            </tr>
            <tr>
              <td><strong>Net Increase/(Decrease) in Cash & Cash Equivalents</strong></td>
              <td><strong>{formatNumber(netCashFlow)}</strong></td>
            </tr>
            <tr>
              <td><strong>Cash Closing</strong></td> {/* Renamed to "Cash Closing" */}
              <td><strong>{formatNumber(balances.cashClosing)}</strong></td>
            </tr>
            <tr>
              <td><strong>Passed Balance</strong></td> {/* Added "Passed Balance" */}
              <td><strong>{formatNumber(balances.cashClosing)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowStatement;