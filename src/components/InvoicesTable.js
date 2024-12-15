import React, { useState, useEffect } from 'react';

const InvoicesTable = () => {
    const [coa, setCoa] = useState([]); // Chart of accounts
    const [invoices, setInvoices] = useState([]); // Store invoices
    const [formData, setFormData] = useState({
        invoice_number: '',
        date_issued: '',
        account_type: '',  // Account type field for dropdown
        amount: '',
        account_class: '',
        account_debited: '',
        account_credited: '',
        invoice_type: '', // Invoice type field (text input)
    });

    const [selectedAccount, setSelectedAccount] = useState(''); // Selected account for invoice
    const [sessionExpired, setSessionExpired] = useState(false); // Track session expiry
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch Chart of Accounts and Invoices on mount
    useEffect(() => {
        const token = localStorage.getItem('token'); // Retrieve the JWT token

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
                setCoa(data); // Set Chart of Accounts data
            })
            .catch((error) => console.error('Error fetching Chart of Accounts:', error));
    }, []);

    useEffect(() => {
        if (Array.isArray(coa) && coa.length > 0) {
            fetchInvoices();
        }
    }, [coa]);

    // Fetch invoices with additional account name
    const fetchInvoices = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/invoices', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // Map invoices to include account name from coa
                const enrichedInvoices = data.map((invoice) => {
                    const account = coa.find((a) => a.account_type === invoice.account_type);
                    return {
                        ...invoice,
                        account_name: account ? account.account_name : 'Account Not Found',
                    };
                });
                setInvoices(enrichedInvoices); // Set enriched invoices
            })
            .catch((error) => console.error('Error fetching invoices:', error));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAccountTypeChange = (event) => {
        const selectedAccountType = event.target.value;
        setFormData({
            ...formData,
            account_type: selectedAccountType,  // Update the form data with the selected account type
        });

        // Reset the dependent fields when account type changes
        setSelectedAccount('');
    };

    const handleAccountChange = (event) => {
        setSelectedAccount(event.target.value);
        const selectedCoa = coa.find(account => account.id === event.target.value);
        if (selectedCoa) {
            setFormData({
                ...formData,
                account_type: selectedCoa.account_type, // Set the account_type when the account is selected
            });
        }
    };

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
                coa_id: selectedAccount, // Send the coa_id (selected account)
            }),
        })
            .then((response) => response.json())
            .then(() => {
                fetchInvoices();
                setFormData({
                    invoice_number: '',
                    date_issued: '',
                    account_type: '',
                    amount: '',
                    account_class: '',
                    account_debited: '',
                    account_credited: '',
                    invoice_type: '', // Clear the invoice type field
                });
            })
            .catch((error) => {
                setErrorMessage('Error submitting invoice.');
                console.error('Error submitting invoice:', error);
            });
    };

    const handleDelete = (invoiceId) => {
        const token = localStorage.getItem('token');

        fetch(`http://localhost:5000/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    fetchInvoices();
                } else {
                    setErrorMessage('Error deleting invoice.');
                }
            })
            .catch((error) => {
                setErrorMessage('Error deleting invoice.');
                console.error('Error deleting invoice:', error);
            });
    };

    // Styling
    const styles = {
        container: { padding: '40px', fontFamily: '"Roboto", Arial, sans-serif', backgroundColor: '#f8f9fa' },
        heading: { textAlign: 'center', marginBottom: '30px', color: '#333' },
        table: { width: '100%', borderCollapse: 'collapse', marginBottom: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
        th: { padding: '12px 20px', textAlign: 'left', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', borderBottom: '2px solid #ddd' },
        td: { padding: '12px 20px', borderBottom: '1px solid #ddd', fontSize: '14px' },
        button: { backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '4px', textAlign: 'center', fontSize: '14px', margin: '5px' },
        form: { marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px', margin: 'auto', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
        input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%' },
        select: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%' },
        formTitle: { marginTop: '20px', fontSize: '24px', fontWeight: '600', textAlign: 'center', color: '#4CAF50' },
        message: { color: 'red', textAlign: 'center' },
        formLabel: { fontSize: '16px', fontWeight: 'bold' },
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
                        <th style={styles.th}>Invoice Type</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Account Class</th>
                        <th style={styles.th}>Account Debited</th>
                        <th style={styles.th}>Account Credited</th>
                        <th style={styles.th}>Account Name</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td style={styles.td}>{invoice.invoice_number}</td>
                                <td style={styles.td}>{invoice.date_issued}</td>
                                <td style={styles.td}>{invoice.account_type}</td>
                                <td style={styles.td}>{invoice.invoice_type}</td>
                                <td style={styles.td}>{invoice.amount}</td>
                                <td style={styles.td}>{invoice.account_class}</td>
                                <td style={styles.td}>{invoice.account_debited}</td>
                                <td style={styles.td}>{invoice.account_credited}</td>
                                <td style={styles.td}>{invoice.account_name}</td>
                                <td style={styles.td}>
                                    <button
                                        style={styles.button}
                                        onClick={() => handleDelete(invoice.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" style={styles.td}>No invoices available</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <h3 style={styles.formTitle}>Create New Invoice</h3>

            {/* Invoice Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.formLabel}>
                    Invoice Number:
                    <input
                        type="text"
                        name="invoice_number"
                        value={formData.invoice_number}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Date Issued:
                    <input
                        type="date"
                        name="date_issued"
                        value={formData.date_issued}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Account Type:
                    <select
                        value={formData.account_type}
                        onChange={handleAccountTypeChange}
                        required
                        style={styles.select}
                    >
                        <option value="">--Select Account Type--</option>
                        {Array.isArray(coa) && coa.map((account) => (
                            <option key={account.id} value={account.account_type}>
                                {account.account_type}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={styles.formLabel}>
                    Account Name:
                    <select
                        value={selectedAccount}
                        onChange={handleAccountChange}
                        required
                        style={styles.select}
                    >
                        <option value="">--Select Account--</option>
                        {coa.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.account_name}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={styles.formLabel}>
                    Invoice Type:
                    <input
                        type="text"
                        name="invoice_type"
                        value={formData.invoice_type}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Amount:
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Account Class:
                    <input
                        type="text"
                        name="account_class"
                        value={formData.account_class}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Account Debited:
                    <input
                        type="text"
                        name="account_debited"
                        value={formData.account_debited}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <label style={styles.formLabel}>
                    Account Credited:
                    <input
                        type="text"
                        name="account_credited"
                        value={formData.account_credited}
                        onChange={handleInputChange}
                        required
                        style={styles.input}
                    />
                </label>
                <button type="submit" style={styles.button}>Submit Invoice</button>
            </form>

            {errorMessage && <p style={styles.message}>{errorMessage}</p>}
        </div>
    );
};

export default InvoicesTable;
