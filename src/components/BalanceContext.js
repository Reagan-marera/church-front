import React, { createContext, useContext, useState } from 'react';

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const [balances, setBalances] = useState({
    openingBalance: 0,
    closingBalance: 0,
    unpresentedDeposits: 0,
    unpresentedPayments: 0,
    unReceiptedDirectBankings: 0,
    paymentsInBankNotInCashBook: 0,
  });

  const updateBalances = (opening, closing, reconciliationItems = {}) => {
    setBalances(prev => ({
      ...prev,
      openingBalance: opening,
      closingBalance: closing,
      ...reconciliationItems,
    }));
  };

  return (
    <BalanceContext.Provider value={{ balances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};