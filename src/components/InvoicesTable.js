import React, { useState, useEffect } from 'react';

const InvoicesTable = () => {
    const [coa, setCoa] = useState([]); // Chart of accounts
    const [invoices, setInvoices] = useState([]); // Store invoices
    const [formData, setFormData] = useState({
        invoice_number: '',
        date_issued: '',
        account_type: '', // Set as an empty string initially
        amount: '',
        account_class: '',
        account_debited: '',
        account_credited: '',
        invoice_type: '',
        parent_account: '', // Add parent account to form data
        grn_number: '', // Add grn_number to form data
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
                console.log('Chart of Accounts Data:', data); // Log data to check its structure
                if (Array.isArray(data)) {
                    setCoa(data); // Set Chart of Accounts data if it is an array
                } else {
                    console.error('Chart of Accounts is not an array:', data);
                }
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

    const handleParentAccountChange = (event) => {
        setFormData({
            ...formData,
            parent_account: event.target.value, // Update the form data with selected parent account
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');

        // Prepare the payload to be sent
        const invoiceData = {
            invoice_number: formData.invoice_number,
            date_issued: formData.date_issued,
            account_type: formData.account_type,
            amount: parseFloat(formData.amount),
            account_class: formData.account_class, // Assuming this field exists in formData
            account_debited: formData.account_debited, // Assuming this field exists in formData
            account_credited: formData.account_credited, // Assuming this field exists in formData
            invoice_type: formData.invoice_type, // Include invoice_type here
            coa_id: selectedAccount, // Selected account (coa_id)
            parent_account: formData.parent_account, // Parent account ID
            grn_number: formData.grn_number, // GRN number
        };

        // Send the request to the backend
        fetch('http://localhost:5000/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(invoiceData), // Send the structured invoice data
        })
            .then((response) => response.json())
            .then(() => {
                fetchInvoices(); // Reload the invoices
                setFormData({
                    invoice_number: '',
                    date_issued: '',
                    account_type: '',
                    amount: '',
                    account_class: '',
                    account_debited: '',
                    account_credited: '',
                    invoice_type: '',
                    parent_account: '',
                    grn_number: '',
                }); // Clear the form
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

    // Extract unique parent_account values for dropdown
    const uniqueParentAccounts = Array.from(new Set(coa.map(account => account.parent_account)));

    // Extract unique account types for the dropdown
    const uniqueAccountTypes = Array.from(new Set(coa.map(account => account.account_type)));

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
            <th style={styles.th}>Parent Account</th>
            <th style={styles.th}>GRN Number</th>
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
                    <td style={styles.td}>{invoice.parent_account}</td>
                    <td style={styles.td}>{invoice.grn_number}</td>
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
                <td colSpan="12" style={styles.td}>No invoices available</td>
            </tr>
        )}
    </tbody>
</table>

            {/* Add Invoice Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <h3 style={styles.formTitle}>Add New Invoice</h3>
                <label style={styles.formLabel}>Invoice Number</label>
                <input
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <label style={styles.formLabel}>Date Issued</label>
                <input
                    type="date"
                    name="date_issued"
                    value={formData.date_issued}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                {/* Account Type Dropdown */}
                <label style={styles.formLabel}>Account Type</label>
                <select
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleAccountTypeChange}
                    style={styles.select}
                    required
                >
                    <option value="">Select Account Type</option>
                    {uniqueAccountTypes.map((accountType, index) => (
                        <option key={index} value={accountType}>
                            {accountType}
                        </option>
                    ))}
                </select>

                {/* Other form fields */}
                <label style={styles.formLabel}>Amount</label>
                <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <label style={styles.formLabel}>Account Class</label>
                <input
                    type="text"
                    name="account_class"
                    value={formData.account_class}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <label style={styles.formLabel}>Account Debited</label>
                <input
                    type="text"
                    name="account_debited"
                    value={formData.account_debited}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <label style={styles.formLabel}>Account Credited</label>
                <input
                    type="text"
                    name="account_credited"
                    value={formData.account_credited}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <label style={styles.formLabel}>Invoice Type</label>
                <input
                    type="text"
                    name="invoice_type"
                    value={formData.invoice_type}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                {/* Parent Account Dropdown */}
                <label style={styles.formLabel}>Parent Account</label>
                <select
                    name="parent_account"
                    value={formData.parent_account}
                    onChange={handleParentAccountChange}
                    style={styles.select}
                    required
                >
                    <option value="">Select Parent Account</option>
                    {uniqueParentAccounts.map((account, index) => (
                        <option key={index} value={account}>
                            {account}
                        </option>
                    ))}
                </select>

                <label style={styles.formLabel}>GRN Number</label>
                <input
                    type="text"
                    name="grn_number"
                    value={formData.grn_number}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                />

                <button type="submit" style={styles.button}>Submit</button>
            </form>
        </div>
    );
};

export default InvoicesTable;
