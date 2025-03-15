import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './CashFlowStatement.css'; // Import CSS for styling

const CashFlowStatement = () => {
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

  // Function to calculate totals for revenue and expenses based on categories
  const calculateTotals = (data) => {
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;

    Object.entries(data).forEach(([category, accounts]) => {
      accounts.forEach((account) => {
        const inflowCash = account.inflow_cash || 0;
        const inflowBank = account.inflow_bank || 0;
        const outflowCash = account.outflow_cash || 0;
        const outflowBank = account.outflow_bank || 0;

        if (category === 'Operating Activities') {
          totalOperating += inflowCash + inflowBank - outflowCash - outflowBank;
        } else if (category === 'Investing Activities') {
          totalInvesting += inflowCash + inflowBank - outflowCash - outflowBank;
        } else if (category === 'Financing Activities') {
          totalFinancing += inflowCash + inflowBank - outflowCash - outflowBank;
        }
      });
    });

    const netCashFlow = totalOperating + totalInvesting + totalFinancing;

    return {
      totalOperating,
      totalInvesting,
      totalFinancing,
      netCashFlow,
    };
  };

  const {
    totalOperating,
    totalInvesting,
    totalFinancing,
    netCashFlow,
  } = calculateTotals(balanceData);

  // Function to handle Excel export
  const exportToExcel = () => {
    const dataForExcel = [];
    
    // Loop through the categories and prepare data for the Excel file
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
    });

    // Add Totals row
    dataForExcel.push({
      Category: 'Total',
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

  return (
    <div className="cash-flow-statement-container">
      <h1>Cash Flow Statement</h1>

      {/* Button to Export to Excel */}
      <button onClick={exportToExcel} className="export-button">
        Export to Excel
      </button>

      {Object.entries(balanceData).map(([category, accounts]) => {
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
                {accounts.map((account, index) => (
                  <tr key={index}>
                    <td>{account.parent_account}</td>
                   
                    <td>{(account.inflow_cash + account.inflow_bank - account.outflow_cash - account.outflow_bank).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Display Totals */}
      <div className="totals-section">
        <h2>Totals</h2>
        <table className="totals-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Net Cash Flow</strong></td>
              <td><strong>{netCashFlow.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowStatement;
