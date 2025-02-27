import React, { useState, useEffect } from 'react';
import './CashTransactions.css'; // Import the CSS file

const CashTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredGroupedAccounts, setFilteredGroupedAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                // Retrieve the JWT token from local storage or wherever it's stored
                const token = localStorage.getItem('token');

                const response = await fetch('http://127.0.0.1:5000/api/transactions', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Error fetching transactions');
                }

                const data = await response.json();
                setTransactions(data.transactions); // Access the `transactions` array
                setFilteredGroupedAccounts(data.filtered_grouped_accounts); // Access the `filtered_grouped_accounts` array
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []); // Empty array means this effect runs only once, when the component mounts

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="cash-transactions-container">
            <h2>Cash and Cash Transactions</h2>
            <table>
                <thead>
                    <tr>
                        <th>Account Code</th>
                        <th>Total Debits</th>
                        <th>Total Credits</th>
                        <th>Closing Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredGroupedAccounts.map((account, index) => (
                        <tr key={index}>
                            <td>{account.account_code}</td>
                            <td>{account.total_debits.toFixed(2)}</td>
                            <td>{account.total_credits.toFixed(2)}</td>
                            <td>{account.closing_balance.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CashTransactions;
