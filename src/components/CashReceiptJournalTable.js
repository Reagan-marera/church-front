import React, { useState, useEffect } from 'react';

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    receipt_date: '',
    receipt_no: '',
    ref_no: '',
    from_whom_received: '',
    description: '',
    account_class: '',
    account_type: '',
    receipt_type: '',
    account_debited: '',
    account_credited: '',
    bank: '',
    cash: '',
    total: '',
    parent_account: '', // Added parent_account field
  });
  
  const [coa, setCoa] = useState([]);  // List for account types from the Chart of Accounts (COA)

  // Function to fetch journal data
  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/cash-receipt-journals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || 'Error fetching journals');
      }

      const data = await response.json();
      setJournals(data); // Update state with fetched journals
    } catch (error) {
      console.error('Error fetching journals:', error);
      setError(error.message || 'Error fetching journals');
    }
  };

  // Fetch the Chart of Accounts (COA)
  const fetchCOA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || 'Error fetching COA');
      }

      const data = await response.json();
      setCoa(data);  // Set the COA data in state
    } catch (error) {
      console.error('Error fetching COA:', error);
      setError(error.message || 'Error fetching COA');
    }
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newFormData = { ...prevData, [name]: value };

      // Automatically calculate the total when either cash or bank is updated
      if (name === 'cash' || name === 'bank') {
        const cashValue = parseFloat(newFormData.cash) || 0;
        const bankValue = parseFloat(newFormData.bank) || 0;
        newFormData.total = cashValue + bankValue;
      }

      return newFormData;
    });
  };

  // Handle form submission to add a new journal entry
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/cash-receipt-journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || 'Error adding journal entry');
      }

      // Reset the form and re-fetch journals
      setFormData({
        receipt_date: '',
        receipt_no: '',
        ref_no: '',  // Reset ref_no field in the form
        from_whom_received: '',
        description: '',
        account_class: '',
        account_type: '',
        receipt_type: '',
        account_debited: '',
        account_credited: '',
        bank: '',
        cash: '',
        total: '',
        parent_account: '',
      });

      fetchJournals(); // Re-fetch updated journals
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setError(error.message || 'Error adding journal entry');
    }
  };

  // Function to handle the deletion of a journal entry
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }

      const response = await fetch(`http://localhost:5000/cash-receipt-journals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || 'Error deleting journal entry');
      }

      fetchJournals(); // Re-fetch journals after deletion
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      setError(error.message || 'Error deleting journal entry');
    }
  };

  useEffect(() => {
    fetchJournals(); // Fetch journals on component mount
    fetchCOA(); // Fetch the Chart of Accounts (COA) on component mount
  }, []);
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    header: {
      textAlign: 'center',
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '20px',
    },
    errorMessage: {
      color: '#dc3545',
      textAlign: 'center',
      marginBottom: '20px',
    },
    form: {
      marginBottom: '30px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
    },
    formRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      width: '100%',
    },
    formInput: {
      padding: '10px',
      fontSize: '1rem',
      width: '100%',
      maxWidth: '250px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      outline: 'none',
    },
    btnSubmit: {
      padding: '12px 20px',
      fontSize: '1rem',
      backgroundColor: '#28a745',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      alignSelf: 'flex-start',
    },
    btnSubmitHover: {
      backgroundColor: '#218838',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      fontSize: '0.9rem',
      textAlign: 'left',
    },
    tableHeader: {
      backgroundColor: '#007bff',
      color: '#fff',
    },
    tableCell: {
      padding: '12px 15px',
      border: '1px solid #ddd',
    },
    tableRowHover: {
      backgroundColor: '#f9f9f9',
      transition: 'background-color 0.3s ease',
    },
    tableRowHoverActive: {
      backgroundColor: '#eaeaea',
    },
    btnDelete: {
      backgroundColor: '#dc3545',
      color: '#fff',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
  };
  

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Cash Receipt Journal</h1>

      {error && <p style={styles.errorMessage}>{error}</p>} {/* Display error if there's one */}

      {/* Form for adding a new journal entry */}
      <form style={styles.form} onSubmit={handleFormSubmit}>
        <div style={styles.formRow}>
          <input
            type="date"
            name="receipt_date"
            value={formData.receipt_date}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
          
          <select
            name="parent_account"
            value={formData.parent_account}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          >
            <option value="">Select Parent Account</option>
            {coa.length > 0 && coa.map((account, index) => (
              <option key={index} value={account.parent_account}>
                {account.parent_account}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <input
            type="text"
            name="receipt_no"
            placeholder="Receipt No"
            value={formData.receipt_no}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
          
          <input
            type="text"
            name="ref_no"
            placeholder="Reference No"
            value={formData.ref_no}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
        </div>

        <div style={styles.formRow}>
          <input
            type="text"
            name="from_whom_received"
            placeholder="From Whom Received"
            value={formData.from_whom_received}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
        </div>

        <div style={styles.formRow}>
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            style={styles.formInput}
          />
        </div>

        <div style={styles.formRow}>
          <input
            type="text"
            name="account_class"
            placeholder="Account Class"
            value={formData.account_class}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
          
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          >
            <option value="">Select Account Type</option>
            {coa.length > 0 && coa.map((account, index) => (
              <option key={index} value={account.account_type}>
                {account.account_type}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <select
            name="receipt_type"
            value={formData.receipt_type}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          >
            <option value="">Select Receipt Type</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div style={styles.formRow}>
          <input
            type="text"
            name="account_debited"
            placeholder="Account Debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
          
          <input
            type="text"
            name="account_credited"
            placeholder="Account Credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            required
            style={styles.formInput}
          />
        </div>

        <div style={styles.formRow}>
          <input
            type="number"
            name="cash"
            placeholder="Cash"
            value={formData.cash}
            onChange={handleInputChange}
            style={styles.formInput}
          />
          
          <input
            type="number"
            name="bank"
            placeholder="Bank"
            value={formData.bank}
            onChange={handleInputChange}
            style={styles.formInput}
          />
        </div>

        <button type="submit" style={styles.btnSubmit}>
          Add Journal Entry
        </button>
      </form>
      <thead style={styles.tableHeader}>
  <tr>
    <th style={styles.tableCell}>Receipt No</th>
    <th style={styles.tableCell}>Reference No</th>
    <th style={styles.tableCell}>Receipt Date</th>
    <th style={styles.tableCell}>From Whom</th>
    <th style={styles.tableCell}>Description</th>
    <th style={styles.tableCell}>Account Class</th>
    <th style={styles.tableCell}>Account Type</th>
    <th style={styles.tableCell}>Parent Account</th> {/* Added Parent Account */}
    <th style={styles.tableCell}>Receipt Type</th>
    <th style={styles.tableCell}>Account Debited</th>
    <th style={styles.tableCell}>Account Credited</th>
    <th style={styles.tableCell}>Cash</th>
    <th style={styles.tableCell}>Bank</th>
    <th style={styles.tableCell}>Total</th>
    <th style={styles.tableCell}>Actions</th>
  </tr>
</thead>
<tbody>
  {journals.map((journal, index) => (
    <tr key={index} style={styles.tableRowHover}>
      <td style={styles.tableCell}>{journal.receipt_no}</td>
      <td style={styles.tableCell}>{journal.ref_no}</td>
      <td style={styles.tableCell}>{journal.receipt_date}</td>
      <td style={styles.tableCell}>{journal.from_whom_received}</td>
      <td style={styles.tableCell}>{journal.description}</td>
      <td style={styles.tableCell}>{journal.account_class}</td>
      <td style={styles.tableCell}>{journal.account_type}</td>
      <td style={styles.tableCell}>{journal.parent_account}</td> {/* Added Parent Account */}
      <td style={styles.tableCell}>{journal.receipt_type}</td>
      <td style={styles.tableCell}>{journal.account_debited}</td>
      <td style={styles.tableCell}>{journal.account_credited}</td>
      
      <td style={styles.tableCell}>{journal.cash}</td>
      <td style={styles.tableCell}>{journal.bank}</td>
      <td style={styles.tableCell}>{journal.total}</td>
      <td style={styles.tableCell}>
        <button
          style={styles.btnDelete}
          onClick={() => handleDelete(journal.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

    </div>
  );
};

export default CashReceiptJournalTable;