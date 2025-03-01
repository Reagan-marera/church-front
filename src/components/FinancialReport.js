import React from 'react';
import './trialbalance.css'; // Import the CSS file for styling
import ExpenseTransactions from './ExpenseTransactions'; // Import the Expense Transactions component
import AssetTransactions from './AssetTransactions'; // Import the Asset Transactions component
import LiabilityTransactions from './LiabilityTransactions'; // Import the Liability Transactions component
import NetAssets from './NetAssets'; // Import the Net Assets component
import RevenueTransactions from './RevenueTransactions'; // Import the Revenue Transactions component
import CashTransactions from './CashandCash'; // Import the Cash and Cash Transactions component

const FinancialStatements = () => {
  // Function to trigger the print functionality
  const handlePrint = () => {
    window.print();  // This will open the browser's print dialog
  };

  return (
    <div className="financial-statements">
      <h1>General Ledger Report</h1>

      {/* Print Button */}
      <button onClick={handlePrint} className="btn btn-primary">
        Print
      </button>

      <div className="statement-section">
        <h2>Expense Transactions</h2>
        <ExpenseTransactions />
      </div>

      <div className="statement-section">
        <h2>Cash and Cash</h2>
        <CashTransactions />
      </div>

      <div className="statement-section">
        <h2>Asset Transactions</h2>
        <AssetTransactions />
      </div>

      <div className="statement-section">
        <h2>Liability Transactions</h2>
        <LiabilityTransactions />
      </div>

      <div className="statement-section">
        <h2>Net Assets</h2>
        <NetAssets />
      </div>

      <div className="statement-section">
        <h2>Revenue Transactions</h2>
        <RevenueTransactions />
      </div>
    </div>
  );
};

export default FinancialStatements;
