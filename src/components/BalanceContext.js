import React, { createContext, useContext, useState } from 'react';

// Create a context for balances
const BalanceContext = createContext();

// Create a provider component to manage balance state
export const BalanceProvider = ({ children }) => {
  const [balances, setBalances] = useState({ openingBalance: 0, closingBalance: 0 });

  // Function to update balances
  const updateBalances = (openingBalance, closingBalance) => {
    setBalances({ openingBalance, closingBalance });
  };

  return (
    <BalanceContext.Provider value={{ balances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

// Custom hook to use the balance context
export const useBalance = () => useContext(BalanceContext);
