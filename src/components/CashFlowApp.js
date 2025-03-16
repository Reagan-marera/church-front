import React, { useEffect, useState } from 'react';
import CashTransactions from './CashandCash';
import CashFlowStatement from './CashFlowStatement';
import { BalanceProvider } from './BalanceContext';

const CashFlowApp = () => {
  return (
    <BalanceProvider>
      <CashTransactions />
      <CashFlowStatement />
    </BalanceProvider>
  );
};

export default CashFlowApp;
