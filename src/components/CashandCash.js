import React, { useState, useEffect } from 'react';
import './CashTransactions.css'; // Import the CSS file

const CashTransactions = () => {
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
                console.log('Fetched Data:', data); // Check the structure of the data

                // Safeguard to ensure that the filtered_grouped_accounts exists
                if (data && data.filtered_grouped_accounts) {
                    setFilteredGroupedAccounts(data.filtered_grouped_accounts);
                } else {
                    throw new Error('No valid data found in the response');
                }

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
                            <td>{(Number(account.total_debits) || 0).toFixed(2)}</td> {/* Safely handle possible NaN values */}
                            <td>{(Number(account.total_credits) || 0).toFixed(2)}</td> {/* Safely handle possible NaN values */}
                            <td>{(Number(account.closing_balance) || 0).toFixed(2)}</td> {/* Safely handle possible NaN values */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CashTransactions;
