import React, { useState, useEffect } from 'react';

const InvoicesTable = () => {
    const [coa, setCoa] = useState([]);  // Store Chart of Accounts
    const [invoices, setInvoices] = useState([]);  // Store invoices
    const [formData, setFormData] = useState({
        invoice_number: '',
        date_issued: '',
        account_type: '',
        amount: '',
        account_class: '',
        account_debited: '',
        account_credited: ''
    });

    const [selectedAccount, setSelectedAccount] = useState('');  // Selected account for invoice
    const [sessionExpired, setSessionExpired] = useState(false); // Track session expiry
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch Chart of Accounts and Invoices on mount
    useEffect(() => {
        const token = localStorage.getItem('token');  // Retrieve the JWT token

        if (!token) {
            setSessionExpired(true);
            return;
        }

        // Fetch Chart of Accounts from the backend
        fetch('http://localhost:5000/chart-of-accounts', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setCoa(data);  // Set Chart of Accounts data
            })
            .catch((error) => console.error('Error fetching Chart of Accounts:', error));

        // Fetch invoices associated with the user
        fetch('http://localhost:5000/invoices', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setInvoices(data);  // Set invoices data
            })
            .catch((error) => {
                if (error.response && error.response.status === 401) {
                    setSessionExpired(true); // Handle session expiry
                }
                console.error('Error fetching invoices:', error);
            });
    }, []);

    // Handle form field changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle account selection
    const handleAccountChange = (event) => {
        setSelectedAccount(event.target.value);
    };

    // Handle form submission to create a new invoice
    const handleSubmit = (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');

        fetch('http://localhost:5000/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...formData,
                coa_id: selectedAccount,  // Use the selected account id
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Invoice created successfully:', data);
                setInvoices([...invoices, data]);  // Update state with new invoice
                setFormData({
                    invoice_number: '',
                    date_issued: '',
                    account_type: '',
                    amount: '',
                    account_class: '',
                    account_debited: '',
                    account_credited: '',
                });
            })
            .catch((error) => {
                setErrorMessage('Error submitting invoice.');
                console.error('Error submitting invoice:', error);
            });
    };

    const styles = {
        container: {
            maxWidth: '1000px',
            margin: '20px auto',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
        },
        th: {
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '12px',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: 'bold',
        },
        td: {
            padding: '12px',
            borderBottom: '1px solid #ddd',
            textAlign: 'left',
            fontSize: '14px',
        },
        button: {
            padding: '12px 18px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '10px',
            transition: 'background-color 0.3s ease',
        },
        buttonHover: {
            backgroundColor: '#45a049',
        },
        form: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
        },
        input: {
            padding: '10px',
            fontSize: '14px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
        },
        select: {
            padding: '10px',
            fontSize: '14px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            boxSizing: 'border-box',
        },
        message: {
            color: '#d9534f',
            fontSize: '16px',
            marginTop: '20px',
        },
        heading: {
            textAlign: 'center',
            color: '#333',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
        },
        formTitle: {
            color: '#333',
            fontSize: '20px',
            marginBottom: '20px',
        },
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Invoices Table</h2>

            {sessionExpired && <p style={styles.message}>Your session has expired. Please log in again.</p>}

            {/* Display Invoices */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Invoice Number</th>
                        <th style={styles.th}>Date Issued</th>
                        <th style={styles.th}>Account Type</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Account Class</th>
                        <th style={styles.th}>Account Debited</th>
                        <th style={styles.th}>Account Credited</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td style={styles.td}>{invoice.invoice_number}</td>
                                <td style={styles.td}>{invoice.date_issued}</td>
                                <td style={styles.td}>{invoice.account_type}</td>
                                <td style={styles.td}>{invoice.amount}</td>
                                <td style={styles.td}>{invoice.account_class}</td>
                                <td style={styles.td}>{invoice.account_debited}</td>
                                <td style={styles.td}>{invoice.account_credited}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={styles.td}>No invoices available</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <h3 style={styles.formTitle}>Create New Invoice</h3>

            {/* Invoice Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <div>
                    <label htmlFor="invoice_number">Invoice Number:</label>
                    <input
                        type="text"
                        id="invoice_number"
                        name="invoice_number"
                        value={formData.invoice_number}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="date_issued">Date Issued:</label>
                    <input
                        type="date"
                        id="date_issued"
                        name="date_issued"
                        value={formData.date_issued}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="account_type">Account Type:</label>
                    <input
                        type="text"
                        id="account_type"
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="account_class">Account Class:</label>
                    <input
                        type="text"
                        id="account_class"
                        name="account_class"
                        value={formData.account_class}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="account_debited">Account Debited:</label>
                    <input
                        type="text"
                        id="account_debited"
                        name="account_debited"
                        value={formData.account_debited}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="account_credited">Account Credited:</label>
                    <input
                        type="text"
                        id="account_credited"
                        name="account_credited"
                        value={formData.account_credited}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label htmlFor="account-select">Select Account:</label>
                    <select
                        id="account-select"
                        value={selectedAccount}
                        onChange={handleAccountChange}
                        style={styles.select}
                    >
                        {coa.length > 0 ? (
                            coa.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name}
                                </option>
                            ))
                        ) : (
                            <option>No accounts available</option>
                        )}
                    </select>
                </div>

                <button type="submit" style={styles.button}>Submit Invoice</button>
            </form>

            {errorMessage && <p style={styles.message}>{errorMessage}</p>}
        </div>
    );
};

export default InvoicesTable;
