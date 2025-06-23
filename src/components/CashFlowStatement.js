import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './CashFlowStatement.css';
import { useBalance } from './BalanceContext';

const CashFlowStatement = () => {
  const { balances } = useBalance();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = 'https://backend.youmingtechnologies.co.ke';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${api}/cash-flow`, {
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

  const calculateTotals = (data) => {
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;
    let cashOpening = 0;
    const categoryTotals = {};

    Object.entries(data).forEach(([category, accounts]) => {
      if (category === 'Cash Opening') {
        cashOpening = accounts[0]?.total_cash_opening || 0;
        categoryTotals[category] = cashOpening;
      } else {
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
      }
    });

    const netCashFlow = totalOperating + totalInvesting + totalFinancing;

    return {
      totalOperating,
      totalInvesting,
      totalFinancing,
      cashOpening,
      netCashFlow,
      categoryTotals,
    };
  };

  const {
    totalOperating,
    totalInvesting,
    totalFinancing,
    cashOpening,
    netCashFlow,
    categoryTotals,
  } = calculateTotals(balanceData || {});

  const cashClosing = balances?.closingBalance || 0;
  const unpresentedDeposits = balances?.unpresentedDeposits || 0;

  const exportToExcel = () => {
    const dataForExcel = [];

    Object.entries(balanceData || {}).forEach(([category, accounts]) => {
      if (category === 'Cash Opening') {
        dataForExcel.push({
          Category: category,
          ParentAccount: 'Total Cash Opening',
          InflowCash: 'N/A',
          InflowBank: 'N/A',
          OutflowCash: 'N/A',
          OutflowBank: 'N/A',
          NetCashFlow: accounts[0]?.total_cash_opening || 0,
        });
      } else {
        accounts.forEach((account) => {
          dataForExcel.push({
            Category: category,
            ParentAccount: account.parent_account,
            InflowCash: account.inflow_cash || 0,
            InflowBank: account.inflow_bank || 0,
            OutflowCash: account.outflow_cash || 0,
            OutflowBank: account.outflow_bank || 0,
            NetCashFlow: (account.inflow_cash || 0) + (account.inflow_bank || 0) - (account.outflow_cash || 0) - (account.outflow_bank || 0),
          });
        });

        dataForExcel.push({
          Category: `${category} Total`,
          ParentAccount: 'N/A',
          InflowCash: 'N/A',
          InflowBank: 'N/A',
          OutflowCash: 'N/A',
          OutflowBank: 'N/A',
          NetCashFlow: categoryTotals[category],
        });
      }
    });

    dataForExcel.push({
      Category: 'Overall Total',
      ParentAccount: 'N/A',
      InflowCash: 'N/A',
      InflowBank: 'N/A',
      OutflowCash: 'N/A',
      OutflowBank: 'N/A',
      NetCashFlow: netCashFlow,
    });

    dataForExcel.push({
      Category: 'Cash Closing Balance',
      ParentAccount: 'N/A',
      InflowCash: 'N/A',
      InflowBank: 'N/A',
      OutflowCash: 'N/A',
      OutflowBank: 'N/A',
      NetCashFlow: cashClosing,
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CashFlowStatement');
    XLSX.writeFile(wb, 'CashFlowStatement.xlsx');
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0.00";
    if (value < 0) {
      return `(${Math.abs(value).toLocaleString()})`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="cash-flow-statement-container">
      <h1>Cash Flow Statement</h1>
      <button onClick={exportToExcel} className="export-button">
        Export to Excel
      </button>

      <div className="unpresented-deposits">
        <h2>Unpresented Deposits (Deposits in Transit)</h2>
        <p>{formatNumber(unpresentedDeposits)}</p>
      </div>

      {Object.entries(balanceData || {}).map(([category, accounts]) => {
        if (category === 'Cash Opening') {
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
                  <tr>
                    <td>Total Cash Opening</td>
                    <td>{formatNumber(accounts[0]?.total_cash_opening || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        } else {
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
                    <td><strong>Net Cash Flows From {category}</strong></td>
                    <td><strong>{formatNumber(categoryTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
      })}

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
              <td><strong>Cash Opening</strong></td>
              <td><strong>{formatNumber(cashOpening)}</strong></td>
            </tr>
            <tr>
              <td><strong>Net Increase/(Decrease) in Cash & Cash Equivalents</strong></td>
              <td><strong>{formatNumber(netCashFlow)}</strong></td>
            </tr>
            <tr>
              <td><strong>Cash Closing</strong></td>
              <td><strong>{formatNumber(cashClosing)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowStatement;
