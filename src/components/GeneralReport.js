import React, { useState } from 'react';
import AccountsTransactions from './Notes';
import IncomeStatement from './Balance';
import Trial from './Income';
import './trialbalance.css'; // Import the CSS file for styling
import TrialBalance from './TrialBalance'; // Ensure this is used or adjust accordingly
import CashFlowStatement from './CashFlowStatement'; // Import the Cash Flow Statement component
import EstimateTable from './EstimateTable'; // Import your Estimate component
const FinancialOverview = () => {
  const [activeTab, setActiveTab] = useState('TrialBalance'); // Default tab

  const renderComponent = () => {
    switch (activeTab) {
      case 'TrialBalance': // Fixed this to match the correct component name
        return <TrialBalance />;
      case 'AccountsTransactions':
        return <AccountsTransactions />;
      case 'IncomeStatement':
        return <IncomeStatement />;
      case 'Trial': // This is correctly linked to the Trial component
        return <Trial />;
      case 'CashFlowStatement': // Add the case for CashFlowStatement
        return <CashFlowStatement />;
      case 'Estimate': // Add case for the new "Estimate" tab
        return <EstimateTable />;
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
        <button onClick={() => setActiveTab('TrialBalance')}>Trial Balance</button>
        <button onClick={() => setActiveTab('Trial')}>Income Statement</button>
        <button onClick={() => setActiveTab('IncomeStatement')}>Balance Sheet</button>
        <button onClick={() => setActiveTab('AccountsTransactions')}>Notes</button>
        <button onClick={() => setActiveTab('CashFlowStatement')}>Cash Flow</button>
        <button onClick={() => setActiveTab('Estimate')}>Estimates</button> {/* Added Estimate tab */}
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
