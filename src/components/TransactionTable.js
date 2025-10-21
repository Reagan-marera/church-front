// TransactionTable.js
import React from 'react';
import { exportToExcel } from '../utils/export';

const TransactionTable = ({ accounts, type, selectedParentAccount, calculateClosingBalance, formatDate }) => {
  // Filter accounts based on the type (Assets, Revenue, or Expenses)
  const filteredAccounts = accounts.filter(account => account.account_type === type);

  const handleExport = () => {
    exportToExcel(filteredAccounts, `transactions-${type}`);
  };

  return (
    <div className="transaction-table-container">
      <h4>{type} Transactions</h4>
      <button onClick={handleExport} style={{ marginBottom: '10px', padding: '8px 16px', borderRadius: '4px', border: '1px solid #4CAF50', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' }}>
        Export to Excel
      </button>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Cheque No</th>
            <th>Account Debited</th>
            <th>Account Class</th>
            <th>Account Credited</th>
            <th>Amount</th>
            <th>Date</th>
            <th>To Whom Paid</th>
            <th>Parent Account</th>
            <th>GRN No.</th>
            <th>Opening Balance</th>
            <th>Closing Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredAccounts.map((account, index) => {
            const receivedAssets = Number(account.total_amount) || 0;
            const openingBalance = Number(account.opening_balance) || 0;
            const closingBalance = calculateClosingBalance(openingBalance, receivedAssets, 0, 0, 0);

            return (
              <tr key={index}>
                <td>{account.cheque_no || "N/A"}</td>
                <td>{account.account_debited}</td>
                <td>{account.account_class}</td>
                <td>{account.account_credited}</td>
                <td>{account.total_amount}</td>
                <td>
                  {formatDate(
                    account.transaction_date ||
                    account.date_issued ||
                    account.receipt_date ||
                    account.disbursement_date ||
                    account.date
                  )}
                </td>
                <td>{account.to_whom_paid || "N/A"}</td>
                <td>{account.parent_account || "N/A"}</td>
                <td>{account.grn_number || "N/A"}</td>
                <td>{account.opening_balance || "N/A"}</td>
                <td>{closingBalance.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
