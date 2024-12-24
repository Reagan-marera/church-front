import React, { useState, useEffect } from 'react';
import './DisbursementForm.css';

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

  const [subAccountData, setSubAccountData] = useState([{ name: '', amount: 0 }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [subAccountsForDisbursement, setSubAccountsForDisbursement] = useState([]);

  useEffect(() => {
    const fetchCOA = async () => {
      const token = localStorage.getItem('token');
      try {
        if (!token) throw new Error('Unauthorized: Missing token.');
        const response = await fetch('htps://finance.boogiecoin.com/chart-of-accounts', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) setCoaAccounts(data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchCOA();
  }, []);

  useEffect(() => {
    const fetchDisbursements = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('htps://finance.boogiecoin.com/cash-disbursement-journals', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setDisbursements(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchDisbursements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };
      
      // Recalculate total whenever cash or bank changes
      if (name === 'cash' || name === 'bank') {
        const newTotal = calculateTotal(updatedData.cash, updatedData.bank);
        updatedData.total = newTotal;  // Update the total in the form data
      }
  
      return updatedData;
    });
  };
  
  const calculateTotal = (cash, bank, subAccounts = []) => {
    // Calculate the total amount
    const subAccountTotal = subAccounts.reduce((sum, subAccount) => sum + parseFloat(subAccount.amount || 0), 0);
    return parseFloat(cash || 0) + parseFloat(bank || 0) + subAccountTotal;
  };
  
  const handleSubAccountChange = (index, name, value) => {
    const updatedSubAccounts = [...subAccountData];
    updatedSubAccounts[index] = { ...updatedSubAccounts[index], [name]: value };
    setSubAccountData(updatedSubAccounts);
  };

  const handleAddSubAccount = () => {
    setSubAccountData([...subAccountData, { name: '', amount: 0 }]);
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = subAccountData.filter((_, i) => i !== index);
    setSubAccountData(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  const fetchSubAccountsForDisbursement = (disbursementId) => {
    const selectedDisbursement = disbursements.find((disbursement) => disbursement.id === disbursementId);
    if (selectedDisbursement && selectedDisbursement.sub_accounts) {
      setSubAccountData(Object.entries(selectedDisbursement.sub_accounts).map(([name, amount]) => ({ name, amount })));
    }
  };
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`htps://finance.boogiecoin.com/cash-disbursement-journals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error('Failed to delete the disbursement');
      setDisbursements(disbursements.filter((item) => item.id !== id));
      alert('Disbursement deleted successfully!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
  
    const subTotal = subAccountData.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
    if (formData.total !== subTotal) {
      setErrorMessage('Total amount does not match the sum of sub-accounts.');
      return;
    }
  
    const formattedSubAccounts = subAccountData.reduce((acc, { name, amount }) => {
      if (name && amount) acc[name] = parseFloat(amount);
      return acc;
    }, {});
  
    const formattedDate = new Date(formData.disbursement_date).toISOString().split('T')[0];
  
    const payload = {
      ...formData,
      disbursement_date: formattedDate,
      sub_accounts: formattedSubAccounts,
    };
    
    console.log("Payload being sent:", JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch('htps://finance.boogiecoin.com/cash-disbursement-journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error('Error details from server:', errorDetails);
        throw new Error(errorDetails.message || 'Failed to submit data');
      }
    
      const result = await response.json();
      alert('Disbursement added successfully!');
      setDisbursements([...disbursements, result]);
    } catch (error) {
      setErrorMessage(error.message);
    }
    
    // Log the payload to the console
    console.log("Payload being sent:", JSON.stringify(payload, null, 2));
  
    try {
      const response = await fetch('htps://finance.boogiecoin.com/cash-disbursement-journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      // Check if the response is OK, otherwise throw an error
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error('Error details from server:', errorDetails);
        throw new Error(errorDetails.message || 'Failed to submit data');
      }
  
      const result = await response.json();
      alert('Disbursement added successfully!');
      setDisbursements([...disbursements, result]);
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
      account.sub_account_details?.map(subAccount => (
        <option key={subAccount.id} value={subAccount.name}>
          {subAccount.name}
        </option>
      ))
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
      account.sub_account_details?.map(subAccount => (
        <option key={subAccount.id} value={subAccount.name}>
          {subAccount.name}
        </option>
      ))
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
  {/* Subaccounts Form */}
  <div>
  <h3>Subaccounts</h3>
  {subAccountData.map((subAccount, index) => (
    <div key={index} className="form-row">
      <select
        value={subAccount.name}
        onChange={(e) => handleSubAccountChange(index, "name", e.target.value)}
        className="form-input"
      >
        <option value="">Select Subaccount</option>
        {/* Render the subaccounts based on coaAccounts */}
        {coaAccounts.length > 0 ? (
          coaAccounts.map(account =>
            account.sub_account_details?.map(subAccount => (
              <option key={subAccount.id} value={subAccount.name}>
                {subAccount.name}
              </option>
            ))
          )
        ) : (
          <option disabled>Loading accounts...</option>
        )}
      </select>

      <input
        type="number"
        value={subAccount.amount}
        onChange={(e) => handleSubAccountChange(index, "amount", e.target.value)}
        placeholder={`Amount for Subaccount ${index + 1}`}
        className="form-input"
      />
      <button
        type="button"
        onClick={() => handleRemoveSubAccount(index)}
        className="remove-subaccount-btn"
      >
        Remove
      </button>
    </div>
  ))}
  <button
    type="button"
    onClick={handleAddSubAccount}
    className="add-subaccount-btn"
  >
    Add Subaccount
  </button>
</div>

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

      {subAccountsForDisbursement && (
        <div className="subaccounts-modal">
          <h3>Subaccounts for Invoice</h3>
          <table>
            <thead>
              <tr>
                <th>Subaccount</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(subAccountsForDisbursement).map(([name, amount]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{amount}</td> {/* Directly displaying amount */}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setSubAccountsForDisbursement(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default DisbursementForm;
