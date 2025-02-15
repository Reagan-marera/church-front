import React, { useState, useEffect } from 'react';
import './CashTransactions.css'; // Import the CSS file

const CashTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [groupedAccounts, setGroupedAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search term

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/transactions');
                if (!response.ok) {
                    throw new Error('Error fetching transactions');
                }
                const data = await response.json();
                setTransactions(data.transactions); // Access the `transactions` array

                // Group transactions by account code and calculate totals
                const grouped = groupTransactionsByAccount(data.transactions);
                setGroupedAccounts(grouped);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []); // Empty array means this effect runs only once, when the component mounts

    // Helper function to group transactions by account code
    const groupTransactionsByAccount = (transactions) => {
        const accounts = {};

        transactions.forEach((transaction) => {
            const { account_debited, account_credited, total, amount_debited, amount_credited } = transaction;

            // Initialize account if it doesn't exist
            if (!accounts[account_debited]) {
                accounts[account_debited] = { debits: 0, credits: 0, closingBalance: 0 };
            }
            if (!accounts[account_credited]) {
                accounts[account_credited] = { debits: 0, credits: 0, closingBalance: 0 };
            }

            // Update debits and credits
            if (transaction.transaction_type === 'Cash Receipt') {
                accounts[account_debited].debits += total; // Debit the debited account
                accounts[account_credited].credits += total; // Credit the credited account
            } else if (transaction.transaction_type === 'Cash Disbursement') {
                accounts[account_debited].debits += total; // Debit the debited account
                accounts[account_credited].credits += total; // Credit the credited account
            } else if (transaction.transaction_type === 'Transaction') {
                accounts[account_debited].debits += amount_debited; // Debit the debited account
                accounts[account_credited].credits += amount_credited; // Credit the credited account
            }
        });

        // Calculate closing balance for each account
        const groupedAccounts = Object.keys(accounts).map((accountCode) => {
            const { debits, credits } = accounts[accountCode];
            const closingBalance = credits - debits;
            return {
                accountCode,
                totalDebits: debits,
                totalCredits: credits,
                closingBalance,
            };
        });

        return groupedAccounts;
    };

    // Filter transactions and grouped accounts based on search term
    const filteredTransactions = transactions.filter(
        (transaction) =>
            transaction.account_debited.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.account_credited.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredGroupedAccounts = groupedAccounts.filter((account) =>
        account.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="cash-transactions-container">
            <h2>Transactions</h2>

            {/* Search Input */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by account name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Transaction Type</th>
                        <th>Date</th>
                        <th>Receipt/Cheque No</th>
                        <th>Description</th>
                        <th>Account Debited</th>
                        <th>Account Credited</th>
                        <th>DR</th>
                        <th>CR</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.map((transaction, index) => (
                        <tr key={index}>
                            <td>{transaction.transaction_type}</td>
                            <td>{transaction.date}</td>
                            <td>
                                {transaction.transaction_type === 'Cash Receipt'
                                    ? transaction.receipt_no
                                    : transaction.cheque_no || "N/A"}
                            </td>
                            <td>{transaction.description}</td>
                            <td>{transaction.account_debited}</td>
                            <td>{transaction.account_credited}</td>
                            <td>
                                {transaction.transaction_type === 'Cash Receipt'
                                    ? transaction.total
                                    : transaction.amount_debited || "0.00"}
                            </td> {/* DR */}
                            <td>
                                {transaction.transaction_type === 'Cash Disbursement'
                                    ? transaction.total
                                    : transaction.amount_credited || "0.00"}
                            </td> {/* CR */}
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Grouped Account Balances</h2>
            <table>
                <thead>
                    <tr>
                        <th>Account Code</th>
                        <th>Total Debits (DR)</th>
                        <th>Total Credits (CR)</th>
                        <th>Closing Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredGroupedAccounts.map((account, index) => (
                        <tr key={index}>
                            <td>{account.accountCode}</td>
                            <td>{account.totalDebits}</td>
                            <td>{account.totalCredits}</td>
                            <td>{account.closingBalance}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CashTransactions;