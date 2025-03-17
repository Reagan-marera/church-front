import React, { useState } from 'react';
import AccountsTransactions from './Notes';
import IncomeStatement from './Balance';
import Trial from './Income';
import TrialBalance from './TrialBalance';
import CashFlowStatement from './CashFlowStatement';
import EstimateTable from './EstimateTable';
import DepartmentalBudget from './DepartmentalBudget';
import ConsolidatedBudget from './ConsolidatedBudget';
import BudgetVsActuals from './BudgetVsActuals';
import './FinancialOverview.css'; // Import CSS for styling

const FinancialOverview = () => {
  const [activeTab, setActiveTab] = useState('TrialBalance'); // Default tab

  const renderComponent = () => {
    switch (activeTab) {
      case 'TrialBalance':
        return <TrialBalance />;
      case 'AccountsTransactions':
        return <AccountsTransactions />;
      case 'IncomeStatement':
        return <IncomeStatement />;
      case 'Trial':
        return <Trial />;
      case 'CashFlowStatement':
        return <CashFlowStatement />;
      case 'Estimate':
        return <EstimateTable />;
      case 'DepartmentalBudget':
        return <DepartmentalBudget />;
      case 'ConsolidatedBudget':
        return <ConsolidatedBudget />;
      case 'BudgetVsActuals':
        return <BudgetVsActuals />;
      default:
        return <TrialBalance />; // Default fallback
    }
  };

  // Print function
  const printOut = () => {
    window.print(); // Trigger the browser's print dialog
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
        <button onClick={() => setActiveTab('Estimate')}>Budget Estimates</button>
        <button onClick={() => setActiveTab('DepartmentalBudget')}>Departmental Budget</button>
        <button onClick={() => setActiveTab('ConsolidatedBudget')}>Consolidated Budget</button>
        <button onClick={() => setActiveTab('BudgetVsActuals')}>Budget vs Actuals</button>
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