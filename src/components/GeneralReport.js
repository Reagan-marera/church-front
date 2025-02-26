import React, { useState } from 'react';
import AccountsTransactions from './AccountsTransactions';
import IncomeStatement from './IncomeStatement';
import Trial from './Trial';
import './trialbalance.css'; // Import the CSS file for styling

const FinancialOverview = () => {
  const [activeTab, setActiveTab] = useState('AccountsTransactions'); // Default tab

  const renderComponent = () => {
    switch (activeTab) {
      case 'AccountsTransactions':
        return <AccountsTransactions />;
      case 'IncomeStatement':
        return <IncomeStatement />;
      case 'Trial':
        return <Trial />;
      default:
        return <AccountsTransactions />;
    }
  };

  // Print function
  const printOut = () => {
    window.print();  // Trigger the browser's print dialog
  };

  return (
    <div className="financial-overview">
      <h1>Financial Overview</h1>

      {/* Tabs for Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab('AccountsTransactions')}>Notes</button>
        <button onClick={() => setActiveTab('IncomeStatement')}>Trial Balance</button>
        <button onClick={() => setActiveTab('Trial')}>Income Statement</button>
      </div>

      {/* Component content based on active tab */}
      <div className="tab-content">
        {renderComponent()}
      </div>

      {/* Print button */}
      <div className="print-button">
        <button onClick={printOut}>Print</button>
      </div>
    </div>
  );
};

export default FinancialOverview;
