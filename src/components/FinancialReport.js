import React, { useState } from 'react';
import './trialbalance.css'; // Import the CSS file for styling
import ExpenseTransactions from './ExpenseTransactions'; // Import the Expense Transactions component
import AssetTransactions from './AssetTransactions'; // Import the Asset Transactions component
import LiabilityTransactions from './LiabilityTransactions'; // Import the Liability Transactions component
import NetAssets from './NetAssets'; // Import the Net Assets component
import RevenueTransactions from './RevenueTransactions'; // Import the Revenue Transactions component

const FinancialStatements = () => {
  // State for start and end dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Function to trigger the print functionality
  const handlePrint = () => {
    window.print(); // This will open the browser's print dialog
  };

  return (
    <div className="financial-statements">
      <h1>General Ledger Report</h1>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <label htmlFor="startDate">Start Date:</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label htmlFor="endDate">End Date:</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Print Button */}
      <button onClick={handlePrint} className="btn btn-primary">
        Print
      </button>

      {/* Render Child Components with Date Props */}
      <div className="statement-section">
        <h2>Expense Transactions</h2>
        <ExpenseTransactions startDate={startDate} endDate={endDate} />
      </div>

    
      <div className="statement-section">
        <h2>Asset Transactions</h2>
        <AssetTransactions startDate={startDate} endDate={endDate} />
      </div>

      <div className="statement-section">
        <h2>Liability Transactions</h2>
        <LiabilityTransactions startDate={startDate} endDate={endDate} />
      </div>

      <div className="statement-section">
        <h2>Net Assets</h2>
        <NetAssets startDate={startDate} endDate={endDate} />
      </div>

      <div className="statement-section">
        <h2>Revenue Transactions</h2>
        <RevenueTransactions startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
};

export default FinancialStatements;
