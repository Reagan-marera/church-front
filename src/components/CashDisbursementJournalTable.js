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
  const [coa, setCoa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subAccountsForDisbursement, setSubAccountsForDisbursement] = useState(null);
  useEffect(() => {
    const fetchCOA = async () => {
      const token = localStorage.getItem('token');
      try {
        if (!token) throw new Error('Unauthorized: Missing token.');
        const response = await fetch('http://127.0.0.1:5000/chart-of-accounts', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoaAccounts(data);
          setCoa(data);
        }
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCOA();
  }, []);

  useEffect(() => {
    const fetchDisbursements = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://127.0.0.1:5000/cash-disbursement-journals', {
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
 if (loading) {
    return (
      <div className="loader">
        <div></div><div></div><div></div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      if (name === 'cash' || name === 'bank') {
        const newTotal = calculateTotal(updatedData.cash, updatedData.bank);
        updatedData.total = newTotal;
      }

      return updatedData;
    });
  };

  const calculateTotal = (cash, bank, subAccounts = []) => {
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

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${id}`, {
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
    
    // Calculate the subtotal from subaccount data
    const subTotal = subAccountData.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
    
    // Validate that total matches sub-accounts
    if (formData.total !== subTotal) {
      setErrorMessage('Total amount does not match the sum of sub-accounts.');
      return;
    }
  
    // Format subaccounts as key-value pairs
    const formattedSubAccounts = subAccountData.reduce((acc, { name, amount }) => {
      if (name && amount) acc[name] = parseFloat(amount);
      return acc;
    }, {});
  
    // Format the disbursement date
    const formattedDate = new Date(formData.disbursement_date).toISOString().split('T')[0];
    
    // Prepare the payload with the updated sub-accounts and formatted date
    const payload = {
      ...formData,
      disbursement_date: formattedDate,
      sub_accounts: formattedSubAccounts,
    };
    
    console.log("Payload being sent:", JSON.stringify(payload, null, 2));
  
    try {
      let response;
      if (formData.id) {
        // If editing, use PUT request to update existing entry
        response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // If creating a new entry, use POST request
        response = await fetch('http://127.0.0.1:5000/cash-disbursement-journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
  
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error('Error details from server:', errorDetails);
        throw new Error(errorDetails.message || 'Failed to submit data');
      }
  
      const result = await response.json();
  
      // If editing, update the disbursement list with the updated data
      if (formData.id) {
        setDisbursements(disbursements.map((disbursement) =>
          disbursement.id === result.id ? result : disbursement
        ));
      } else {
        // If creating a new entry, add the result to the disbursement list
        setDisbursements([...disbursements, result]);
      }
  
      // Provide feedback to the user
      alert(formData.id ? 'Disbursement updated successfully!' : 'Disbursement added successfully!');
      setErrorMessage(""); // Clear any previous error messages
  
      // Reset the form and sub-account data
      setFormData({}); // Reset form data to clear the fields
      setSubAccountData([]); // Clear subaccount data
      
    } catch (error) {
      setErrorMessage(error.message); // Display error message
    }
};

  
  
  
  // Fetch the latest disbursements after submit
  const fetchDisbursements = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:5000/cash-disbursement-journals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch disbursements');
      }
  
      const data = await response.json();
      setDisbursements(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };
  

  const fetchSubAccountsForDisbursement = (disbursementId) => {
    const selectedDisbursement = disbursements.find((disbursement) => disbursement.id === disbursementId);
    if (selectedDisbursement && selectedDisbursement.sub_accounts) {
      setSubAccountData(Object.entries(selectedDisbursement.sub_accounts).map(([name, amount]) => ({ name, amount })));
    }
  };
  const handleEdit = (disbursement) => {
    setFormData({
      id: disbursement.id,  // Set the disbursement ID for edit mode
      disbursement_date: disbursement.disbursement_date,
      cheque_no: disbursement.cheque_no,
      p_voucher_no: disbursement.p_voucher_no,
      to_whom_paid: disbursement.to_whom_paid,
      description: disbursement.description,
      account_class: disbursement.account_class,
      account_type: disbursement.account_type,
      payment_type: disbursement.payment_type,
      cashbook: disbursement.cashbook,
      account_credited: disbursement.account_credited,
      account_debited: disbursement.account_debited,
      parent_account: disbursement.parent_account,
      cash: disbursement.cash,
      bank: disbursement.bank,
      total: disbursement.total,
    });

    const formattedSubAccounts = Object.entries(disbursement.sub_accounts || {}).map(([name, amount]) => ({ name, amount }));
    setSubAccountData(formattedSubAccounts);
  };
    
  const accountNames = coa.map(account => account.account_name);
  const uniqueAccountNames = accountNames.filter((value, index, self) => self.indexOf(value) === index);
  const accountTypes = coa.map(account => account.account_type);
  const uniqueAccountTypes = accountTypes.filter((value, index, self) => self.indexOf(value) === index);

  return (
    <div className="disbursement-form-container">
      <h2 className="form-header">Cash Disbursement Form</h2>
      <form onSubmit={handleSubmit} className="form">
        {/* Disbursement Date */}
        <div className="form-row">
          <label htmlFor="disbursement_date">Disbursement Date</label>
          <input
            type="date"
            id="disbursement_date"
            name="disbursement_date"
            value={formData.disbursement_date}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Cheque No */}
        <div className="form-row">
          <label htmlFor="cheque_no">Cheque No</label>
          <input
            type="text"
            id="cheque_no"
            name="cheque_no"
            value={formData.cheque_no}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Payment Voucher No */}
        <div className="form-row">
          <label htmlFor="p_voucher_no">Payment Voucher No</label>
          <input
            type="text"
            id="p_voucher_no"
            name="p_voucher_no"
            value={formData.p_voucher_no}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* To Whom Paid */}
        <div className="form-row">
          <label htmlFor="to_whom_paid">To Whom Paid</label>
          <input
            type="text"
            id="to_whom_paid"
            name="to_whom_paid"
            value={formData.to_whom_paid}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Description */}
        <div className="form-row">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
{/* Payment Type */}
<div className="form-row">
  <label htmlFor="payment_type">Payment Type</label>
  <input
    type="text"
    id="payment_type"
    name="payment_type"
    value={formData.payment_type}
    onChange={handleChange}
    required
    className="form-input"
  />
</div>

{/* Cashbook */}
<div className="form-row">
  <label htmlFor="cashbook">Cashbook</label>
  <input
    type="text"
    id="cashbook"
    name="cashbook"
    value={formData.cashbook}
    onChange={handleChange}
    required
    className="form-input"
  />
</div>

        {/* Account Class Dropdown */}
        <div className="form-row">
          <select
            name="account_class"
            value={formData.account_class}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Account Class</option>
            {uniqueAccountNames.length > 0 ? (
              uniqueAccountNames.map((accountName, index) => (
                <option key={index} value={accountName}>
                  {accountName}
                </option>
              ))
            ) : (
              <option>No Account Classes Available</option>
            )}
          </select>
        </div>

        {/* Parent Account Dropdown */}
        <div className="form-row">
          <select
            name="parent_account"
            value={formData.parent_account}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select General Ledger</option>
            {coa.map((account, index) => (
              <option key={index} value={account.parent_account}>
                {account.parent_account}
              </option>
            ))}
          </select>
        </div>

        {/* Account Type Dropdown */}
        <div className="form-row">
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Account Type</option>
            {uniqueAccountTypes.length > 0 ? (
              uniqueAccountTypes.map((accountType, index) => (
                <option key={index} value={accountType}>
                  {accountType}
                </option>
              ))
            ) : (
              <option>No Account Types Available</option>
            )}
          </select>
        </div>

        {/* Account Debited and Credited */}
        <div className="form-row">
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Select Account Debited</option>
            {coa.map((account) =>
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            )}
          </select>

          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Select Account Credited</option>
            {coa.map((account) =>
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            )}
          </select>
        </div>

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
                {coa.map((account) =>
                  account.sub_account_details?.map((sub, subIndex) => (
                    <option key={subIndex} value={sub.name}>
                      {sub.name}
                    </option>
                  ))
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

        {/* Cash and Bank Amounts */}
        <div className="form-row">
          <label htmlFor="cash">Cash Amount</label>
          <input
            type="number"
            id="cash"
            name="cash"
            value={formData.cash}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-row">
          <label htmlFor="bank">Bank Amount</label>
          <input
            type="number"
            id="bank"
            name="bank"
            value={formData.bank}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Total Amount */}
        <div className="form-row">
          <label>Total</label>
          <input
            type="text"
            value={formData.total}
            readOnly
            className="form-input"
          />
        </div>

        {/* Submit Button */}
        <div className="form-row">
          <button type="submit" className="submit-button">Submit</button>
        </div>

        {/* Display error messages */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </form>

      {/* Disbursements Table */}
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
            <th>General Ledger</th>
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
              <td>{disbursement.payment_type || 'N/A'}</td>  {/* For payment_type */}
<td>{disbursement.cashbook || 'N/A'}</td>  {/* For cashbook */}

              <td>{disbursement.cash}</td>
              <td>{disbursement.bank}</td>
              <td>{disbursement.total}</td>
              <td>
                <button
                  onClick={() => fetchSubAccountsForDisbursement(disbursement.id)} // View subaccounts button
                  className="view-subaccounts-button"
                >
                  View Sub-Accounts
                </button>
                <button
                  onClick={() => handleDelete(disbursement.id)} // Delete button
                  className="delete-button"
                >
                  Delete
                </button>
                
  <button
    onClick={() => handleEdit(disbursement)} // Edit button
    className="edit-button"
  >
    Edit
  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

  {/* Subaccounts Modal */}
{subAccountsForDisbursement && (
  <div className="subaccounts-modal">
    <h3>Subaccounts for disbursement</h3>
    <table>
      <thead>
        <tr>
          <th>Subaccount</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {/* Render subaccounts */}
        {subAccountsForDisbursement.length > 0 ? (
          subAccountsForDisbursement.map(({ name, amount }) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{amount}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="2">No subaccounts available</td>
          </tr>
        )}
      </tbody>
    </table>
    <button onClick={() => setSubAccountsForDisbursement(null)}>Close</button>
  </div>
)}

    </div>
  );
};

export default DisbursementForm;
