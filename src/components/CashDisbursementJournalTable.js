import React, { useEffect, useState } from 'react';

const CashDisbursementJournalTable = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [formData, setFormData] = useState({
    disbursement_date: '',
    cheque_no: '',
    to_whom_paid: '',
    payment_type: '',
    cashbook: '',
    description: '',
    account_class: '',
    account_type: '',
    account_credited: '',
    cash: '',
    total: '',
    vote_total: '',
  });
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const token = localStorage.getItem('token'); // Token retrieval

  useEffect(() => {
    if (!token) {
      console.error('No token found. Please log in.');
      return;
    }

    fetch('http://localhost:5000/cash-disbursement-journals', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.msg === 'Token has expired') {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';  // Redirect to login page
        } else {
          setDisbursements(data);
        }
      })
      .catch(error => setError(error.message));
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      console.error('No token found. Please log in.');
      return;
    }

    const method = editMode ? 'PUT' : 'POST';
    const url = editMode
      ? `http://localhost:5000/cash-disbursement-journals/${editId}`
      : 'http://localhost:5000/cash-disbursement-journals';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        if (editMode) {
          setDisbursements(prevDisbursements => prevDisbursements.map(disbursement => 
            disbursement.id === editId ? data : disbursement));
          setEditMode(false);
          setEditId(null);
        } else {
          setDisbursements(prevDisbursements => [...prevDisbursements, data]);
        }
        setFormData({
            disbursement_date: '',
            cheque_no: '',
            to_whom_paid: '',
            payment_type: '',
            cashbook: '',
            description: '',
            account_class: '',
            account_type: '',
            account_credited: '',
            cash: '',
            total: '',
            vote_total: '', // Reset vote_total
          });
        // Refresh the page after submission
        window.location.reload();
      })
      .catch(error => setError(error.message));
  };

  const handleEdit = (id) => {
    const disbursementToEdit = disbursements.find(d => d.id === id);
    setFormData({
      disbursement_date: disbursementToEdit.disbursement_date,
      cheque_no: disbursementToEdit.cheque_no,
      to_whom_paid: disbursementToEdit.to_whom_paid,
      payment_type: disbursementToEdit.payment_type,
      cashbook: disbursementToEdit.cashbook,
      description: disbursementToEdit.description,
      account_class: disbursementToEdit.account_class,
      account_type: disbursementToEdit.account_type,
      account_credited: disbursementToEdit.account_credited,
      cash: disbursementToEdit.cash,
      total: disbursementToEdit.total,
      vote_total: disbursementToEdit.vote_total,
    });
    setEditMode(true);
    setEditId(id);
  };

  const handleDelete = (id) => {
    if (!token) {
      console.error('No token found. Please log in.');
      return;
    }

    fetch(`http://localhost:5000/cash-disbursement-journals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(() => {
        setDisbursements(prevDisbursements => prevDisbursements.filter(d => d.id !== id));
      })
      .catch(error => setError(error.message));
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Cash Disbursement Journal</h2>

      {error && <div style={styles.error}>Error: {error}</div>} {/* Display error if any */}

      {/* Form to add or edit a disbursement */}
      <form style={styles.form} onSubmit={handleFormSubmit}>
        <input
          type="date"
          name="disbursement_date"
          placeholder="Disbursement Date"
          value={formData.disbursement_date}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="cheque_no"
          placeholder="Cheque No"
          value={formData.cheque_no}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="to_whom_paid"
          placeholder="To Whom Paid"
          value={formData.to_whom_paid}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="payment_type"
          placeholder="Payment Type"
          value={formData.payment_type}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="cashbook"
          placeholder="Cashbook"
          value={formData.cashbook}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="text"
          name="account_class"
          placeholder="Account Class"
          value={formData.account_class}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="text"
          name="account_type"
          placeholder="Account Type"
          value={formData.account_type}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="text"
          name="account_credited"
          placeholder="Account Credited"
          value={formData.account_credited}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="number"
          name="cash"
          placeholder="Cash"
          value={formData.cash}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="number"
          name="total"
          placeholder="Total"
          value={formData.total}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="number"
          name="vote_total"
          placeholder="Vote Total"
          value={formData.vote_total}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          {editMode ? 'Update Disbursement' : 'Add Disbursement'}
        </button>
      </form>

      {/* Table displaying disbursements */}
      <table style={styles.table}>
        <thead>
          <tr>
            {['ID', 'Disbursement Date', 'Cheque No', 'To Whom Paid', 'Payment Type', 'Cashbook', 'Description', 'Account Class', 'Account Type', 'Account Credited', 'Cash', 'Total', 'Vote Total', 'Actions'].map(header => (
              <th key={header} style={styles.tableHeader}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {disbursements.length > 0 ? (
            disbursements.map(disbursement => (
              <tr key={disbursement.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{disbursement.id}</td>
                <td style={styles.tableCell}>{disbursement.disbursement_date}</td>
                <td style={styles.tableCell}>{disbursement.cheque_no}</td>
                <td style={styles.tableCell}>{disbursement.to_whom_paid}</td>
                <td style={styles.tableCell}>{disbursement.payment_type}</td>
                <td style={styles.tableCell}>{disbursement.cashbook}</td>
                <td style={styles.tableCell}>{disbursement.description}</td>
                <td style={styles.tableCell}>{disbursement.account_class}</td>
                <td style={styles.tableCell}>{disbursement.account_type}</td>
                <td style={styles.tableCell}>{disbursement.account_credited}</td>
                <td style={styles.tableCell}>{disbursement.cash}</td>
                <td style={styles.tableCell}>{disbursement.total}</td>
                <td style={styles.tableCell}>{disbursement.vote_total}</td>
                <td style={styles.tableCell}>
                  <button onClick={() => handleEdit(disbursement.id)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(disbursement.id)} style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="14" style={styles.tableCell}>No disbursements found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
  heading: { fontSize: '24px', marginBottom: '20px' },
  form: { marginBottom: '20px' },
  input: { margin: '5px', padding: '8px', width: '200px' },
  button: { marginTop: '10px', padding: '10px 20px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { borderBottom: '2px solid black', padding: '8px' },
  tableRow: { borderBottom: '1px solid #ddd' },
  tableCell: { padding: '8px', textAlign: 'left' },
  editButton: { backgroundColor: '#4CAF50', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer' },
  deleteButton: { backgroundColor: '#f44336', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '10px' }
};

export default CashDisbursementJournalTable;
