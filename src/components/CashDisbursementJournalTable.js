import React, { useState, useEffect } from 'react';

const CashDisbursementJournalTable = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [newDisbursement, setNewDisbursement] = useState({
    disbursement_date: '',
    cheque_no: '',
    p_voucher_no: '',
    to_whom_paid: '',
    payment_type: '',
    cashbook: '',
    description: '',
    account_class: '',
    account_type: '',
    account_credited: '',
    account_debited: '',
    cash: 0,
    bank: '',
    vote_total: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch disbursements from the backend using the fetch API
  const fetchDisbursements = async () => {
    try {
      const token = localStorage.getItem('jwt_token');  // Assuming JWT token is saved in localStorage
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

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDisbursement(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submit to add a new disbursement
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
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
        payment_type: '',
        cashbook: '',
        description: '',
        account_class: '',
        account_type: '',
        account_credited: '',
        account_debited: '',
        cash: 0,
        bank: '',
        vote_total: 0,
      });  // Reset the form after submission
      setErrorMessage('');  // Clear any previous error messages
    } catch (err) {
      console.error('Error adding disbursement:', err);
      setErrorMessage('Error adding disbursement. Please try again later.');
    }
  };

  useEffect(() => {
    fetchDisbursements();
  }, []);

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
          <label>P Voucher No</label>
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
          <label>Payment Type</label>
          <input
            type="text"
            name="payment_type"
            value={newDisbursement.payment_type}
            onChange={handleInputChange}
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
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Description</label>
          <textarea
            name="description"
            value={newDisbursement.description}
            onChange={handleInputChange}
            style={styles.textarea}
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
          <input
            type="text"
            name="account_credited"
            value={newDisbursement.account_credited}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Account Debited</label>
          <input
            type="text"
            name="account_debited"
            value={newDisbursement.account_debited}
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
            type="text"
            name="bank"
            value={newDisbursement.bank}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Vote Total</label>
          <input
            type="number"
            name="vote_total"
            value={newDisbursement.vote_total}
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
            <th>ID</th>
            <th>Disbursement Date</th>
            <th>Cheque No</th>
            <th>P Voucher No</th>
            <th>To Whom Paid</th>
            <th>Payment Type</th>
            <th>Cashbook</th>
            <th>Description</th>
            <th>Account Class</th>
            <th>Account Type</th>
            <th>Account Credited</th>
            <th>Account Debited</th>
            <th>Cash</th>
            <th>Bank</th>
            <th>Vote Total</th>
          </tr>
        </thead>
        <tbody>
          {disbursements.map((disbursement) => (
            <tr key={disbursement.id}>
              <td>{disbursement.id}</td>
              <td>{disbursement.disbursement_date}</td>
              <td>{disbursement.cheque_no}</td>
              <td>{disbursement.p_voucher_no}</td>
              <td>{disbursement.to_whom_paid}</td>
              <td>{disbursement.payment_type}</td>
              <td>{disbursement.cashbook}</td>
              <td>{disbursement.description}</td>
              <td>{disbursement.account_class}</td>
              <td>{disbursement.account_type}</td>
              <td>{disbursement.account_credited}</td>
              <td>{disbursement.account_debited}</td>
              <td>{disbursement.cash}</td>
              <td>{disbursement.bank}</td>
              <td>{disbursement.vote_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    width: '100%',
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    minHeight: '100px',
    width: '100%',
  },
  submitButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    textAlign: 'left',
  },
  td: {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  errorMessage: {
    color: 'red',
    fontWeight: 'bold',
  },
};

export default CashDisbursementJournalTable;
