import React, { useState, useEffect } from 'react';

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
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
    parent_account: '',
  });
  const [subAccountData, setSubAccountData] = useState({});

  // Fetch journals
  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }
      const response = await fetch('http://localhost:5000/cash-receipt-journals', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(await response.text());
      setJournals(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch COA
  const fetchCOA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(await response.text());
      setCoa(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle input change for the main form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'cash' || name === 'bank') {
        updated.total = (parseFloat(updated.cash) || 0) + (parseFloat(updated.bank) || 0);
      }
      return updated;
    });

    // Update subaccounts when parent_account changes
    if (name === 'parent_account') {
      const selectedParent = coa.find((account) => account.parent_account === value);
      setSubAccounts(selectedParent ? selectedParent.sub_accounts || [] : []);
      setSubAccountData({});
    }
  };

// Handle sub-account changes for name and amount
const handleSubAccountChange = (index, field, value) => {
    setSubAccountData((prev) => {
      const updated = { ...prev };
      if (!updated[`account_${index + 1}`]) {
        updated[`account_${index + 1}`] = { name: '', amount: 0 };
      }
      updated[`account_${index + 1}`][field] = field === 'amount' ? parseFloat(value) || 0 : value;
      return updated;
    });
  };
  const handleRemoveSubAccount = (index) => {
    setSubAccountData((prev) => {
      const updated = { ...prev };
      delete updated[`account_${index + 1}`];
      return updated;
    });
  }; 

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sub_accounts: subAccountData,
      };
  
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }
  
      const response = await fetch('http://localhost:5000/cash-receipt-journals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
  
      // Reset state on successful submission
      setFormData({
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
        parent_account: '',
      });
      setSubAccounts([]);
      setSubAccountData({});
      fetchJournals();
    } catch (err) {
      setError(err.message);
    }
  };

 
// Add a new sub-account row
const handleAddSubAccount = () => {
    setSubAccountData((prev) => {
      const newIndex = Object.keys(prev).length + 1;
      return { ...prev, [`account_${newIndex}`]: { name: '', amount: 0 } };
    });
  };
  
  
  // Handle journal entry deletion
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated');
        return;
      }
      const response = await fetch(`http://localhost:5000/cash-receipt-journals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      fetchJournals();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch journals and COA when the component is mounted
  useEffect(() => {
    fetchJournals();
    fetchCOA();
  }, []);

  const styles = {
    container: { padding: '20px' },
    header: { textAlign: 'center' },
    form: { marginBottom: '20px' },
    formRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    formInput: { flex: 1, marginRight: '10px', padding: '5px' },
    btnSubmit: { padding: '10px 15px', backgroundColor: '#007BFF', color: '#FFF', border: 'none' },
    btnDelete: { backgroundColor: '#FF4D4D', color: '#FFF', border: 'none', cursor: 'pointer' },
    tableHeader: { backgroundColor: '#F8F9FA', fontWeight: 'bold' },
    tableCell: { padding: '10px', border: '1px solid #DDD' },
    tableRowHover: { cursor: 'pointer', backgroundColor: '#F9F9F9' },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Cash Receipt Journal</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form style={styles.form} onSubmit={handleFormSubmit}>
        {/* Row 1 */}
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
            {coa.map((account, index) => (
              <option key={index} value={account.parent_account}>
                {account.parent_account}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2 */}
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

        {/* Row 3 */}
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

        {/* Row 4 */}
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

        {/* Row 5 */}
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
            {coa.map((account, index) => (
              <option key={index} value={account.account_type}>
                {account.account_type}
              </option>
            ))}
          </select>
        </div>

        {/* Row 6 */}
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

        {/* Row 7 */}
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

        {/* Row 8 */}
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

        {/* Sub-Accounts */}
        <div>
          <h3>Sub-Accounts</h3>
          {Object.keys(subAccountData).map((key, index) => (
            <div key={index} style={styles.formRow}>
              <input
                type="text"
                placeholder="Sub-Account Name"
                value={subAccountData[key]?.name || ''}
                onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                style={styles.formInput}
              />
              <input
                type="number"
                placeholder="Amount"
                value={subAccountData[key]?.amount || ''}
                onChange={(e) => handleSubAccountChange(index, 'amount', e.target.value)}
                style={styles.formInput}
              />
              <button
                type="button"
                onClick={() => handleRemoveSubAccount(index)}
                style={styles.btnDelete}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddSubAccount}
            style={{ ...styles.btnSubmit, marginTop: '10px' }}
          >
            Add Sub-Account
          </button>
        </div>

        <button type="submit" style={styles.btnSubmit}>
          Add Journal Entry
        </button>
      </form>

      {/* Journal Table */}
      <table>
        <thead style={styles.tableHeader}>
          <tr>
            <th>Receipt No</th>
            <th>Reference No</th>
            <th>Receipt Date</th>
            <th>From Whom</th>
            <th>Description</th>
            <th>Account Class</th>
            <th>Account Type</th>
            <th>Parent Account</th>
            <th>Receipt Type</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Cash</th>
            <th>Bank</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {journals.map((journal, index) => (
            <tr key={index} style={styles.tableRowHover}>
              <td>{journal.receipt_no}</td>
              <td>{journal.ref_no}</td>
              <td>{journal.receipt_date}</td>
              <td>{journal.from_whom_received}</td>
              <td>{journal.description}</td>
              <td>{journal.account_class}</td>
              <td>{journal.account_type}</td>
              <td>{journal.parent_account}</td>
              <td>{journal.receipt_type}</td>
              <td>{journal.account_debited}</td>
              <td>{journal.account_credited}</td>
              <td>{journal.cash}</td>
              <td>{journal.bank}</td>
              <td>{journal.total}</td>
              <td>
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
      </table>
    </div>
  );
};

export default CashReceiptJournalTable;
