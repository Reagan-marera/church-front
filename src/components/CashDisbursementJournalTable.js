import React, { useState, useEffect } from 'react';

function DisbursementForm() {
  // State for the main form fields
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
    total: 0.0,  // Add total field here
  });

  // State for dynamic sub-accounts
  const [subAccounts, setSubAccounts] = useState([{ name: '', amount: 0 }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [coaAccounts, setCoaAccounts] = useState([]); // Chart of Accounts data
  const [disbursements, setDisbursements] = useState([]); // Disbursement data

  // Fetch Chart of Accounts (COA) data for dropdowns
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

  // Fetch disbursement entries (GET)
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
          setDisbursements(data);  // Populate disbursement entries
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchDisbursements();
  }, []);

  // Handle changes in the main form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value }, () => {
      if (name === 'cash' || name === 'bank') {
        calculateTotal(formData.cash, formData.bank);
      }
    });
  };

  // Handle dynamic sub-account changes
  const handleSubAccountChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSubAccounts = [...subAccounts];
    updatedSubAccounts[index][name] = name === 'amount' ? parseFloat(value) : value;
    setSubAccounts(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  // Add a new empty sub-account
  const addSubAccount = () => {
    setSubAccounts([...subAccounts, { name: '', amount: 0 }]);
  };

  // Remove a sub-account by index
  const removeSubAccount = (index) => {
    const updatedSubAccounts = subAccounts.filter((_, i) => i !== index);
    setSubAccounts(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  // Calculate total amount for cash, bank, and sub-accounts
  const calculateTotal = (cash = formData.cash, bank = formData.bank, subAccounts = subAccounts) => {
    const subTotal = subAccounts.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const totalAmount = parseFloat(cash) + parseFloat(bank) + subTotal;
    setFormData(prevData => ({
      ...prevData,
      total: isNaN(totalAmount) ? 0.0 : totalAmount, // Ensuring it's a number
    }));
  };
  
 // Handle form submission (POST)
const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  // Format sub-accounts
  const formattedSubAccounts = {};
  subAccounts.forEach((sub) => {
    if (sub.name && sub.amount) {
      formattedSubAccounts[sub.name] = sub.amount;
    }
  });

  // Format disbursement_date to ISO format (YYYY-MM-DD)
  const formattedDate = new Date(formData.disbursement_date).toISOString().split('T')[0]; // Only date part (YYYY-MM-DD)

  // Prepare payload with the formatted date
  const payload = {
    ...formData,
    disbursement_date: formattedDate, // Use the formatted date here
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
    setDisbursements([...disbursements, result]); // Add the new disbursement to the table
  } catch (error) {
    setErrorMessage(error.message);
  }
};

  // Handle deletion of disbursement (DELETE)
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

      setDisbursements((prevData) => prevData.filter((item) => item.id !== id)); // Remove from table
      alert('Disbursement deleted successfully!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Cash Disbursement Form</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <form onSubmit={handleSubmit}>
        {/* Parent Account Dropdown */}
        <div>
          <label>Parent Account:</label>
          <select
            name="parent_account"
            value={formData.parent_account}
            onChange={handleChange}
            required
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
        <div>
          <label>Account Credited:</label>
          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleChange}
            required
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
        <div>
          <label>Account Debited:</label>
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleChange}
            required
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
  // Check if the key is not one of the excluded fields
  if (key !== 'parent_account' && key !== 'account_credited' && key !== 'account_debited') {
    // Special handling for disbursement_date
    if (key === 'disbursement_date') {
      return (
        <div key={key}>
          <label>Disbursement Date</label>
          <input
            type="date"
            name="disbursement_date"
            value={value}
            onChange={handleChange}
            required
          />
        </div>
      );
    }

    // Handle other fields dynamically
    return (
      <div key={key}>
        <label>{key.replace(/_/g, ' ')}</label>
        <input
          type={key === 'cash' || key === 'bank' || key === 'total' ? 'number' : 'text'}
          name={key}
          value={value}
          onChange={handleChange}
          required
        />
      </div>
    );
  }
})}

{/* Sub-Accounts Section */}
<h3>Sub-Accounts</h3>
{subAccounts.map((sub, index) => (
  <div key={index}>
    <input
      type="text"
      name="name"
      placeholder="Sub-Account Name"
      value={sub.name}
      onChange={(e) => handleSubAccountChange(index, e)}
      required
    />
    <input
      type="number"
      name="amount"
      placeholder="Amount"
      value={sub.amount}
      onChange={(e) => handleSubAccountChange(index, e)}
      required
    />
    <button type="button" onClick={() => removeSubAccount(index)}>
      Remove
    </button>
  </div>
))}
<button type="button" onClick={addSubAccount}>
  Add Sub-Account
</button>

{/* Total Amount */}
<div>
  <strong>Total Amount:</strong> {formData.total ? formData.total.toFixed(2) : '0.00'}
</div>

{/* Submit Button */}
<div>
  <button type="submit">Submit</button>
</div>


      </form>

      {/* Disbursement Data Table */}
      <h3>Disbursement Entries</h3>
      <table border="1" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
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
                <button onClick={() => handleDelete(disbursement.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DisbursementForm;
