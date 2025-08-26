import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const ConsolidatedBudget = () => {
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://backend.youmingtechnologies.co.ke/consolidated-budget', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch consolidated budgets');
        }

        const data = await response.json();
        setBudget(data);
      } catch (error) {
        console.error('Error fetching consolidated budgets:', error);
      }
    };

    fetchBudget();
  }, []);

  if (!budget) {
    return <div>Loading...</div>;
  }

  // Function to format amount in KSH with commas
  const formatAmount = (amount) => {
    return amount.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    });
  };

  // Function to calculate the total for each category
  const calculateTotal = (accounts, type) => {
    return accounts.reduce((total, account) => {
      const value = account[type] || account.original_total;
      return total + value;
    }, 0);
  };

  const exportToExcel = () => {
    const worksheetData = [];

    // Capital Budget Data
    budget.capital_budget.accounts.forEach((account) => {
      worksheetData.push({
        Category: 'Capital Budget',
        'Parent Account': account.parent_account,
        'Original Total': account.original_total,
        Quantity: account.quantity,
        'Unit Price': account.unit_price,
        'Adjusted Total': account.adjusted_total || '-',
        'Adjusted Quantity': account.adjusted_quantity || '-',
        'Adjusted Price': account.adjusted_price ? account.adjusted_price : '-',
      });
    });

    // Receipts Data
    budget.receipts.accounts.forEach((account) => {
      worksheetData.push({
        Category: 'Receipts',
        'Parent Account': account.parent_account,
        'Original Total': account.original_total,
        'Adjusted Total': account.adjusted_total || '-',
      });
    });

    // Payments Data
    budget.payments.accounts.forEach((account) => {
      worksheetData.push({
        Category: 'Payments',
        'Parent Account': account.parent_account,
        'Original Total': account.original_total,
        'Adjusted Total': account.adjusted_total || '-',
      });
    });

    // Surplus/Deficit Data
    worksheetData.push({
      Category: 'Surplus/Deficit',
      'Original Total': budget.surplus_deficit.original_total,
      'Adjusted Total': budget.surplus_deficit.adjusted_total || '-',
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ConsolidatedBudget");
    XLSX.writeFile(workbook, "ConsolidatedBudget.xlsx");
  };

  return (
    <div>
      <h2>Consolidated Budget</h2>
      <button onClick={exportToExcel} className="export-button">
        Export to Excel
      </button>

      {/* Capital Budget */}
      <div>
        <h3>Capital Budget</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              {budget.capital_budget.accounts.some(acc => 'adjusted_total' in acc) && (
                <>
                  <th>Adjusted Total</th>
                  <th>Adjusted Quantity</th>
                  <th>Adjusted Price</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {budget.capital_budget.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                <td>{account.quantity}</td>
                <td>{formatAmount(account.unit_price)}</td>
                {'adjusted_total' in account && (
                  <>
                    <td>{formatAmount(account.adjusted_total)}</td>
                    <td>{account.adjusted_quantity || '-'}</td>
                    <td>{account.adjusted_price ? formatAmount(account.adjusted_price) : '-'}</td>
                  </>
                )}
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.capital_budget.accounts, 'original_total'))}
              </td>
              <td style={{ fontWeight: 'bold' }}>-</td>
              <td style={{ fontWeight: 'bold' }}>-</td>
              {budget.capital_budget.accounts.some(acc => 'adjusted_total' in acc) && (
                <>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatAmount(calculateTotal(budget.capital_budget.accounts, 'adjusted_total'))}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>-</td>
                  <td style={{ fontWeight: 'bold' }}>-</td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Receipts */}
      <div>
        <h3>Receipts</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              {budget.receipts.accounts.some(acc => 'adjusted_total' in acc) && (
                <th>Adjusted Total</th>
              )}
            </tr>
          </thead>
          <tbody>
            {budget.receipts.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                {'adjusted_total' in account && (
                  <td>{formatAmount(account.adjusted_total)}</td>
                )}
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.receipts.accounts, 'original_total'))}
              </td>
              {budget.receipts.accounts.some(acc => 'adjusted_total' in acc) && (
                <td style={{ fontWeight: 'bold' }}>
                  {formatAmount(calculateTotal(budget.receipts.accounts, 'adjusted_total'))}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payments */}
      <div>
        <h3>Payments</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Original Total</th>
              {budget.payments.accounts.some(acc => 'adjusted_total' in acc) && (
                <th>Adjusted Total</th>
              )}
            </tr>
          </thead>
          <tbody>
            {budget.payments.accounts.map((account, index) => (
              <tr key={index}>
                <td>{account.parent_account}</td>
                <td>{formatAmount(account.original_total)}</td>
                {'adjusted_total' in account && (
                  <td>{formatAmount(account.adjusted_total)}</td>
                )}
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>
                {formatAmount(calculateTotal(budget.payments.accounts, 'original_total'))}
              </td>
              {budget.payments.accounts.some(acc => 'adjusted_total' in acc) && (
                <td style={{ fontWeight: 'bold' }}>
                  {formatAmount(calculateTotal(budget.payments.accounts, 'adjusted_total'))}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Surplus/Deficit */}
      <div>
        <h3 style={{ textAlign: 'right', fontWeight: 'bold' }}>Surplus/Deficit for the year</h3>
        <p style={{
          color: budget.surplus_deficit.original_total >= 0 ? 'green' : 'red',
          textAlign: 'right',
          fontWeight: 'bold'
        }}>
          Original: {formatAmount(budget.surplus_deficit.original_total)}
          {budget.surplus_deficit.original_total >= 0 ? ' (Surplus)' : ' (Deficit)'}
        </p>
        {'adjusted_total' in budget.surplus_deficit && (
          <p style={{
            color: budget.surplus_deficit.adjusted_total >= 0 ? 'green' : 'red',
            textAlign: 'right',
            fontWeight: 'bold'
          }}>
            Adjusted: {formatAmount(budget.surplus_deficit.adjusted_total)}
            {budget.surplus_deficit.adjusted_total >= 0 ? ' (Surplus)' : ' (Deficit)'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedBudget;
