import React, { createContext, useContext, useState } from 'react';

// Create a context for balances
const BalanceContext = createContext();

// Create a provider component to manage balance state
export const BalanceProvider = ({ children }) => {
  // State to hold opening and closing balances
  const [balances, setBalances] = useState({
    openingBalance: 0,
    cashClosing: 0, // Renamed "closingBalance" to "cashClosing" for clarity
  });

  // Function to update balances
  const updateBalances = (openingBalance, cashClosing) => {
    setBalances({ openingBalance, cashClosing });
  };

  return (
    <BalanceContext.Provider value={{ balances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

// Custom hook to use the balance context
export const useBalance = () => useContext(BalanceContext);