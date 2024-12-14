import React, { useEffect, useState } from 'react';

const InvoiceIssuedTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [coa, setCoa] = useState([]); // Chart of accounts
  const [formData, setFormData] = useState({
    invoice_number: '',
    date_issued: '',
    customer_name: '',
    account_type: '',
    amount: '',
    coa_id: '', // Account ID
  });

  // For editing an invoice
  const [editMode, setEditMode] = useState(null); // Track edit mode (null = no edit)

  useEffect(() => {
    // Fetch invoices
    fetch('http://localhost:5000/invoices', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInvoices(data); // Set invoices only if it's an array
        } else {
          console.error('Invoices data is not an array:', data);
          setInvoices([]); // Default to an empty array if not an array
        }
      })
      .catch(error => console.error('Invoices fetch error:', error));

    // Fetch Chart of Accounts (COA)
    fetch('http://localhost:5000/chart-of-accounts', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCoa(data); // Set the data only if it's an array
        } else {
          console.error('Chart of Accounts is not an array:', data);
          setCoa([]); // Default to an empty array if data is not an array
        }
      })
      .catch(error => console.error('COA fetch error:', error));
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (editMode) {
      // If in edit mode, perform update (PUT request)
      fetch(`http://localhost:5000/invoices/${editMode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(formData),
      })
        .then(response => response.json())
        .then(data => {
          setInvoices(prevInvoices => prevInvoices.map(invoice =>
            invoice.id === editMode ? { ...invoice, ...formData } : invoice
          ));
          setEditMode(null); // Exit edit mode
          setFormData({
            invoice_number: '',
            date_issued: '',
            customer_name: '',
            account_type: '',
            amount: '',
            coa_id: '',
          });
        })
        .catch(error => console.error('Update error:', error));
    } else {
      // If not in edit mode, perform create (POST request)
      fetch('http://localhost:5000/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(formData),
      })
        .then(response => response.json())
        .then(data => {
          setInvoices(prevInvoices => [...prevInvoices, data]);
          setFormData({
            invoice_number: '',
            date_issued: '',
            customer_name: '',
            account_type: '',
            amount: '',
            coa_id: '',
          });
        })
        .catch(error => console.error('Form submit error:', error));
    }
  };

  // Handle Delete Invoice
  const handleDeleteInvoice = (id) => {
    fetch(`http://localhost:5000/invoices/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        setInvoices(invoices.filter(invoice => invoice.id !== id));
      })
      .catch(error => console.error('Delete error:', error));
  };

  // Handle Edit Invoice (set to edit mode)
  const handleEditInvoice = (invoice) => {
    setEditMode(invoice.id);
    setFormData({
      invoice_number: invoice.invoice_number,
      date_issued: invoice.date_issued,
      customer_name: invoice.customer_name,
      account_type: invoice.account_type,
      amount: invoice.amount,
      coa_id: invoice.coa_id,
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Invoices Issued</h2>

      {/* Invoice Form */}
      <form onSubmit={handleFormSubmit} style={styles.form}>
        <input
          type="text"
          name="invoice_number"
          placeholder="Invoice Number"
          value={formData.invoice_number}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <input
          type="date"
          name="date_issued"
          value={formData.date_issued}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <input
          type="text"
          name="customer_name"
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <select
          name="coa_id"
          value={formData.coa_id}
          onChange={handleInputChange}
          style={styles.input}
          required
        >
          <option value="">Select Account Type</option>
          {Array.isArray(coa) && coa.map(account => (
            <option key={account.id} value={account.id}>
              {account.account_name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>{editMode ? 'Update Invoice' : 'Add Invoice'}</button>
      </form>

      {/* Invoice Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>ID</th>
            <th style={styles.tableHeader}>Invoice Number</th>
            <th style={styles.tableHeader}>Date Issued</th>
            <th style={styles.tableHeader}>Customer Name</th>
            <th style={styles.tableHeader}>Account Type</th>
            <th style={styles.tableHeader}>Amount</th>
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(invoices) && invoices.map(invoice => (
            <tr key={invoice.id} style={styles.tableRow}>
              <td style={styles.tableCell}>{invoice.id}</td>
              <td style={styles.tableCell}>{invoice.invoice_number}</td>
              <td style={styles.tableCell}>{invoice.date_issued}</td>
              <td style={styles.tableCell}>{invoice.customer_name}</td>
              <td style={styles.tableCell}>
                {invoice.coa_id ? coa.find(c => c.id === invoice.coa_id)?.account_name : 'N/A'}
              </td>
              <td style={styles.tableCell}>{invoice.amount}</td>
              <td style={styles.tableCell}>
                <button onClick={() => handleEditInvoice(invoice)}>Edit</button>
                <button onClick={() => handleDeleteInvoice(invoice.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styles
const styles = {
  container: {
    margin: '0 auto',
    padding: '20px',
    maxWidth: '1200px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '2rem',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#f8f8f8',
    color: '#333',
    padding: '12px 15px',
    border: '1px solid #ddd',
    textAlign: 'left',
    fontSize: '1rem',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  input: {
    padding: '10px',
    margin: '5px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default InvoiceIssuedTable;
