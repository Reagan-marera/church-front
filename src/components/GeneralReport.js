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
        return <TrialBalance />;
    }
  };

  const printOut = () => {
    window.print();
  };

  return (
    <div className="financial-overview">
      <h1>Financial Overview</h1>

      {/* Dropdown for navigation */}
      <div className="dropdown-container">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="TrialBalance">Trial Balance</option>
          <option value="Trial">Income Statement</option>
          <option value="IncomeStatement">Balance Sheet</option>
          <option value="AccountsTransactions">Notes</option>
          <option value="CashFlowStatement">Cash Flow</option>
          <option value="Estimate">Budget Estimates</option>
          <option value="DepartmentalBudget">Departmental Budget</option>
          <option value="ConsolidatedBudget">Consolidated Budget</option>
          <option value="BudgetVsActuals">Budget vs Actuals</option>
        </select>
      </div>

      {/* Render selected component */}
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
