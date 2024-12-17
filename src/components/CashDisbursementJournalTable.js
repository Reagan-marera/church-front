import React, { useState, useEffect } from 'react';
import './DisbursementForm.css'; // External CSS file for cleaner styles

function DisbursementForm() {
  const [formData, setFormData] = useState({
    disbursement_date: '',
    cheque_no: '',
    p_voucher_no: '',
    to_whom_paid: '',
    description: '',
    account_class: '',
    account_type: '',
    payment_type: '',
    cashbook: '',
    account_credited: '',
    account_debited: '',
    parent_account: '',
    cash: 0.0,
    bank: 0.0,
    total: 0.0,
  });

  const [subAccounts, setSubAccounts] = useState([{ name: '', amount: 0 }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [subAccountsForDisbursement, setSubAccountsForDisbursement] = useState([]); 

  useEffect(() => {
    const fetchCOA = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Unauthorized: Missing token.');
        }
        const response = await fetch('http://localhost:5000/chart-of-accounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoaAccounts(data);
        } else {
          setCoaAccounts([]);
        }
      } catch (error) {
        setErrorMessage(error.message);
        setCoaAccounts([]);
      }
    };
    fetchCOA();
  }, []);

  useEffect(() => {
    const fetchDisbursements = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setDisbursements(data);
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchDisbursements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value }, () => {
      if (name === 'cash' || name === 'bank') {
        calculateTotal(formData.cash, formData.bank);
      }
    });
  };

  const handleSubAccountChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSubAccounts = [...subAccounts];
    updatedSubAccounts[index][name] = name === 'amount' ? parseFloat(value) : value;
    setSubAccounts(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  const addSubAccount = () => {
    setSubAccounts([...subAccounts, { name: '', amount: 0 }]);
  };

  const removeSubAccount = (index) => {
    const updatedSubAccounts = subAccounts.filter((_, i) => i !== index);
    setSubAccounts(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  const calculateTotal = (cash = formData.cash, bank = formData.bank, subAccounts = subAccounts) => {
    const subTotal = subAccounts.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const totalAmount = parseFloat(cash) + parseFloat(bank) + subTotal;
    setFormData(prevData => ({
      ...prevData,
      total: isNaN(totalAmount) ? 0.0 : totalAmount,
    }));
  };

  const fetchSubAccountsForDisbursement = (disbursementId) => {
    const selectedDisbursement = disbursements.find(disbursement => disbursement.id === disbursementId);
    const subAccounts = selectedDisbursement ? selectedDisbursement.sub_accounts : [];
    setSubAccountsForDisbursement(Object.entries(subAccounts).map(([name, amount]) => ({ name, amount })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formattedSubAccounts = {};
    subAccounts.forEach((sub) => {
      if (sub.name && sub.amount) {
        formattedSubAccounts[sub.name] = sub.amount;
      }
    });

    const formattedDate = new Date(formData.disbursement_date).toISOString().split('T')[0];

    const payload = {
      ...formData,
      disbursement_date: formattedDate,
      sub_accounts: formattedSubAccounts,
    };

    try {
      const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit data');
      }
      alert('Disbursement added successfully!');
      setDisbursements([...disbursements, result]);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/cash-disbursement-journals/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete the disbursement');
      }

      setDisbursements((prevData) => prevData.filter((item) => item.id !== id));
      alert('Disbursement deleted successfully!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="disbursement-form-container">
      <h2 className="form-header">Cash Disbursement Form</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <form onSubmit={handleSubmit} className="form">
        {/* Parent Account Dropdown */}
        <div className="form-group">
          <label>Parent Account:</label>
          <select
            name="parent_account"
            value={formData.parent_account}
            onChange={handleChange}
            required
            className="form-control"
          >
            <option value="">Select Parent Account</option>
            {coaAccounts.filter(account => account.parent_account).map((account) => (
              <option key={account.id} value={account.parent_account}>
                {account.parent_account}
              </option>
            ))}
          </select>
        </div>

        {/* Account Credited Dropdown */}
        <div className="form-group">
          <label>Account Credited:</label>
          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleChange}
            required
            className="form-control"
          >
            <option value="">Select Account</option>
            {coaAccounts.map(account => (
              <option key={account.id} value={account.account_name}>
                {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Account Debited Dropdown */}
        <div className="form-group">
          <label>Account Debited:</label>
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleChange}
            required
            className="form-control"
          >
            <option value="">Select Account</option>
            {coaAccounts.map(account => (
              <option key={account.id} value={account.account_name}>
                {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(formData).map(([key, value]) => {
          if (key !== 'parent_account' && key !== 'account_credited' && key !== 'account_debited') {
            if (key === 'disbursement_date') {
              return (
                <div key={key} className="form-group">
                  <label>Disbursement Date</label>
                  <input
                    type="date"
                    name="disbursement_date"
                    value={value}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
              );
            }
            return (
              <div key={key} className="form-group">
                <label>{key.replace(/_/g, ' ')}</label>
                <input
                  type={key === 'cash' || key === 'bank' || key === 'total' ? 'number' : 'text'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            );
          }
        })}

        <h3 className="subaccounts-header">Sub-Accounts</h3>
        {subAccounts.map((sub, index) => (
          <div key={index} className="subaccount-item">
            <input
              type="text"
              name="name"
              placeholder="Sub-Account Name"
              value={sub.name}
              onChange={(e) => handleSubAccountChange(index, e)}
              required
              className="form-control"
            />
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={sub.amount}
              onChange={(e) => handleSubAccountChange(index, e)}
              required
              className="form-control"
            />
            <button type="button" onClick={() => removeSubAccount(index)} className="remove-button">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addSubAccount} className="add-button">
          Add Sub-Account
        </button>

        <div className="total-section">
          <strong>Total Amount:</strong> {formData.total ? formData.total.toFixed(2) : '0.00'}
        </div>

        <div className="submit-section">
          <button type="submit" className="submit-button">Submit</button>
        </div>
      </form>

      <h3 className="disbursement-table-header">Disbursement Entries</h3>
      <table className="disbursement-table">
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
            <th>Actions</th>
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
                <button onClick={() => fetchSubAccountsForDisbursement(disbursement.id)} className="view-subaccounts-button">
                  View Sub-Accounts
                </button>
                <button
                  onClick={() => handleDelete(disbursement.id)} // Delete button
                  className="delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display Sub-Accounts */}
      {subAccountsForDisbursement.length > 0 && (
        <div className="subaccounts-table-container">
          <h4>Sub-Accounts for Selected Disbursement</h4>
          <table className="subaccounts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {subAccountsForDisbursement.map((sub, index) => (
                <tr key={index}>
                  <td>{sub.name}</td>
                  <td>{sub.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DisbursementForm;
