import React, { useState } from 'react';
import AccountsTransactions from './AccountsTransactions';
import IncomeStatement from './IncomeStatement';
import './trialbalance.css'; // Import the CSS file for styling

const FinancialOverview = () => {
  const [activeTab, setActiveTab] = useState('AccountsTransactions'); // Default tab

  const renderComponent = () => {
    switch (activeTab) {
      case 'AccountsTransactions':
        return <AccountsTransactions />;
      case 'IncomeStatement':
        return <IncomeStatement />;
      default:
        return <AccountsTransactions />;
    }
  };

  return (
    <div className="financial-overview">
      <h1>Financial Overview</h1>

      {/* Tabs for Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab('AccountsTransactions')}>Notes</button>
        <button onClick={() => setActiveTab('IncomeStatement')}>Income Statement</button>
      </div>

      {/* Component content based on active tab */}
      <div className="tab-content">
        {renderComponent()}
      </div>
    </div>
  );
};

export default FinancialOverview;
