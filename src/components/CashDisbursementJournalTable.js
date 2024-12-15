import React, { useState, useEffect } from 'react';

const CashDisbursementJournalTable = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [newDisbursement, setNewDisbursement] = useState({
    disbursement_date: '',
    cheque_no: '',
    p_voucher_no: '',
    to_whom_paid: '',
    description: '',
    account_class: '',
    account_type: '',
    account_credited: '',
    account_debited: '',
    parent_account: '',
    payment_type: '',
    cashbook: '',
    cash: 0,
    bank: 0,
    total: 0,  // Use total to display final amount
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [coaAccounts, setCoaAccounts] = useState([]);  // For storing Chart of Accounts

  // Fetch disbursements from the backend using the fetch API
  const fetchDisbursements = async () => {
    try {
      const token = localStorage.getItem("token");  // Assuming JWT token is saved in localStorage
      if (!token) {
        setErrorMessage('JWT token is missing. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disbursements');
      }

      const data = await response.json();
      console.log('Disbursements:', data);
      setDisbursements(data);  // Set the disbursements to state
    } catch (err) {
      console.error('Error fetching disbursements:', err);
      setErrorMessage('Error fetching disbursements. Please try again later.');
    }
  };

  // Fetch Chart of Accounts (COA) for dropdown options
  const fetchCoaAccounts = async () => {
    try {
      const token = localStorage.getItem("token");  // Assuming JWT token is saved in localStorage
      if (!token) {
        setErrorMessage('JWT token is missing. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Chart of Accounts');
      }

      const data = await response.json();
      console.log('COA Accounts:', data);
      setCoaAccounts(data);  // Set the COA accounts to state
    } catch (err) {
      console.error('Error fetching COA accounts:', err);
      setErrorMessage('Error fetching COA accounts. Please try again later.');
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setNewDisbursement((prevData) => {
      const newFormData = { ...prevData, [name]: value };
  
      // Calculate the total if cash or bank is updated
      if (name === 'cash' || name === 'bank') {
        const cashValue = parseFloat(newFormData.cash || 0);
        const bankValue = parseFloat(newFormData.bank || 0);
        newFormData.total = cashValue + bankValue;
      }
  
      return newFormData;
    });
  };
  
  // Handle form submit to add a new disbursement
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDisbursement)
      });

      if (!response.ok) {
        throw new Error('Failed to add new disbursement');
      }

      const addedDisbursement = await response.json();
      console.log('New disbursement added:', addedDisbursement);
      setDisbursements(prevState => [...prevState, addedDisbursement]);  // Add the new disbursement to the table
      setNewDisbursement({
        disbursement_date: '',
        cheque_no: '',
        p_voucher_no: '',
        to_whom_paid: '',
        description: '',
        account_class: '',
        account_type: '',
        account_credited: '',
        account_debited: '',
        parent_account: '',
        payment_type: '',
        cashbook: '',
        cash: 0,
        bank: 0,
        total: 0,  // Reset total
      });
      setErrorMessage('');  // Clear any previous error messages
    } catch (err) {
      console.error('Error adding disbursement:', err);
      setErrorMessage('Error adding disbursement. Please try again later.');
    }
  };

  useEffect(() => {
    fetchDisbursements();
    fetchCoaAccounts();  // Fetch COA Accounts when the component is mounted
  }, []);

  // Handle delete request
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/cash-disbursement-journals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete disbursement');
      }

      // Remove the disbursement from the state after successful deletion
      setDisbursements(prevState => prevState.filter(disbursement => disbursement.id !== id));
    } catch (err) {
      console.error('Error deleting disbursement:', err);
      setErrorMessage('Error deleting disbursement. Please try again later.');
    }
  };
  return (
    <div style={styles.container}>
      <h1>Cash Disbursement Journal</h1>

      {/* Error message */}
      {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}

      {/* Form to add a new disbursement */}
      <form onSubmit={handleFormSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Disbursement Date</label>
          <input
            type="date"
            name="disbursement_date"
            value={newDisbursement.disbursement_date}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Cheque No</label>
          <input
            type="text"
            name="cheque_no"
            value={newDisbursement.cheque_no}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Payment Voucher No</label>
          <input
            type="text"
            name="p_voucher_no"
            value={newDisbursement.p_voucher_no}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>To Whom Paid</label>
          <input
            type="text"
            name="to_whom_paid"
            value={newDisbursement.to_whom_paid}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={newDisbursement.description}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Account Class</label>
          <input
            type="text"
            name="account_class"
            value={newDisbursement.account_class}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Account Type</label>
          <input
            type="text"
            name="account_type"
            value={newDisbursement.account_type}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Account Credited</label>
          <select
            name="account_credited"
            value={newDisbursement.account_credited}
            onChange={handleInputChange}
            required
            style={styles.select}
          >
            <option value="">Select Account</option>
            {coaAccounts.map(account => (
              <option key={account.id} value={account.account_name}>{account.account_name}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label>Account Debited</label>
          <select
            name="account_debited"
            value={newDisbursement.account_debited}
            onChange={handleInputChange}
            required
            style={styles.select}
          >
            <option value="">Select Account</option>
            {coaAccounts.map(account => (
              <option key={account.id} value={account.account_name}>{account.account_name}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
  <label>Parent Account</label>
  <select
    name="parent_account"
    value={newDisbursement.parent_account} // Use newDisbursement here
    onChange={handleInputChange}
    required
    style={styles.select}
  >
    <option value="">Select Parent Account</option>
    {coaAccounts.length > 0 && coaAccounts.map((account, index) => (
      <option key={index} value={account.parent_account}>
        {account.parent_account}
      </option>
    ))}
  </select>
</div>


        <div style={styles.formGroup}>
          <label>Payment Type</label>
          <input
            type="text"
            name="payment_type"
            value={newDisbursement.payment_type}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Cashbook</label>
          <input
            type="text"
            name="cashbook"
            value={newDisbursement.cashbook}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Cash</label>
          <input
            type="number"
            name="cash"
            value={newDisbursement.cash}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Bank</label>
          <input
            type="number"
            name="bank"
            value={newDisbursement.bank}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.submitButton}>Add Disbursement</button>
      </form>

      {/* Table displaying all disbursements */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Cheque No</th>
            <th>Payment Voucher No</th>
            <th>Paid To</th>
            <th>Description</th>
            <th>Account Class</th>
            <th>Account Type</th>
            <th>Account Credited</th>
            <th>Account Debited</th>
            <th>Parent Account</th>
            <th>Payment Type</th>
            <th>Cashbook</th>
            <th>Cash</th>
            <th>Bank</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {disbursements.map((disbursement) => (
            <tr key={disbursement.id}>
              <td>{disbursement.disbursement_date}</td>
              <td>{disbursement.cheque_no}</td>
              <td>{disbursement.p_voucher_no}</td>
              <td>{disbursement.to_whom_paid}</td>
              <td>{disbursement.description}</td>
              <td>{disbursement.account_class}</td>
              <td>{disbursement.account_type}</td>
              <td>{disbursement.account_credited}</td>
              <td>{disbursement.account_debited}</td>
              <td>{disbursement.parent_account}</td>
              <td>{disbursement.payment_type}</td>
              <td>{disbursement.cashbook}</td>
              <td>{disbursement.cash}</td>
              <td>{disbursement.bank}</td>
              <td>{disbursement.total}</td>
              <td>
                <button onClick={() => handleDelete(disbursement.id)} style={styles.deleteButton}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f7fb',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  form: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    backgroundColor: '#fafafa',
    color: '#555',
    transition: 'border 0.3s ease, background-color 0.3s ease',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    backgroundColor: '#fafafa',
    color: '#555',
    transition: 'border 0.3s ease, background-color 0.3s ease',
  },
  submitButton: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#00A859',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  errorMessage: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: '12px',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  tableHeader: {
    backgroundColor: '#00A859',
    color: '#fff',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
  },
  tableRow: {
    backgroundColor: '#fff',
    transition: 'background-color 0.3s ease',
  },
  tableRowHover: {
    backgroundColor: '#f4f4f4',
  },
  tableCell: {
    padding: '10px 12px',
    fontSize: '12px',
    color: '#333',
    borderBottom: '1px solid #ddd',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#E74C3C',
    color: '#fff',
    fontSize: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  deleteButtonHover: {
    backgroundColor: '#c0392b',
  },
};


export default CashDisbursementJournalTable;
