import React, { useState, useEffect } from 'react';

const CashDisbursementJournalTable = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [subAccountData, setSubAccountData] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showSubAccounts, setShowSubAccounts] = useState({});
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
    total: 0,
    sub_accounts: {}, // Initialize subaccounts
  });

  // Fetch Cash Disbursements
  const fetchDisbursements = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication token is missing. Please log in.");
        return;
      }

      const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch disbursements');

      const data = await response.json();
      setDisbursements(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error fetching disbursements.');
    }
  };

  // Fetch Chart of Accounts
  const fetchCoaAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication token is missing. Please log in.");
        return;
      }

      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch COA accounts');

      const data = await response.json();
      setCoaAccounts(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error fetching COA accounts.');
    }
  };

  // Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewDisbursement((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'cash' || name === 'bank') {
        updated.total = parseFloat(updated.cash || 0) + parseFloat(updated.bank || 0);
      }

      if (name === 'parent_account') {
        const selectedParent = coaAccounts.find((account) => account.parent_account === value);
        setSubAccountData(selectedParent?.sub_accounts || {});
      }

      return updated;
    });
  };

  // Form Submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const setDisbursements = {
      ...newDisbursement,
      sub_accounts: subAccountData, // Add subaccounts to the form data
    };

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Authentication token is missing.");
      return;
    }

    try {
      const payload = {
        ...newDisbursement,
        sub_accounts: Object.values(subAccountData), // Include sub-accounts as an array
      };

      const response = await fetch('http://localhost:5000/cash-disbursement-journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to add new disbursement');

      const addedDisbursement = await response.json();
      setDisbursements((prev) => [...prev, addedDisbursement]);
      resetForm();
    } catch (err) {
      console.error(err);
      setErrorMessage("Error adding disbursement.");
    }
  };

  const resetForm = () => {
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
      total: 0,
      sub_accounts: {}, // Ensure this is reset as well
    });
    setSubAccountData({}); // Reset the sub-account data
  };

  // Delete Disbursement
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Authentication token is missing.");
        return;
      }

      const response = await fetch(`http://localhost:5000/cash-disbursement-journals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete disbursement');

      setDisbursements((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMessage('Error deleting disbursement.');
    }
  };

  // Fetch Data on Mount
  useEffect(() => {
    fetchDisbursements();
    fetchCoaAccounts();
  }, []);

  return (
    <div>
      <h1>Cash Disbursement Journal</h1>
      {errorMessage && <p>{errorMessage}</p>}

      {/* Form */}
      <form onSubmit={handleFormSubmit}>
        <div>
          <label>Disbursement Date</label>
          <input
            type="date"
            name="disbursement_date"
            value={newDisbursement.disbursement_date}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Cheque No</label>
          <input
            type="text"
            name="cheque_no"
            value={newDisbursement.cheque_no}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>PVoucher No</label>
          <input
            type="text"
            name="p_voucher_no"
            value={newDisbursement.p_voucher_no}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>To Whom Paid</label>
          <input
            type="text"
            name="to_whom_paid"
            value={newDisbursement.to_whom_paid}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={newDisbursement.description}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Payment Type</label>
          <input
            type="text"
            name="payment_type"
            value={newDisbursement.payment_type}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Cashbook</label>
          <input
            type="text"
            name="cashbook"
            value={newDisbursement.cashbook}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Cash</label>
          <input
            type="number"
            name="cash"
            value={newDisbursement.cash}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Bank</label>
          <input
            type="number"
            name="bank"
            value={newDisbursement.bank}
            onChange={handleInputChange}
          />
        </div>

        {/* Parent Account Dropdown */}
        <div>
          <label>Parent Account</label>
          <select
            name="parent_account"
            value={newDisbursement.parent_account}
            onChange={handleInputChange}
          >
            <option value="">Select Parent Account</option>
            {coaAccounts.map((account) => (
              <option key={account.id} value={account.parent_account}>
                {account.parent_account} - {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown for Account Credited */}
        <div>
          <label>Account Credited</label>
          <select
            name="account_credited"
            value={newDisbursement.account_credited}
            onChange={handleInputChange}
          >
            <option value="">Select Account Credited</option>
            {coaAccounts.map((account) => (
              <option key={account.id} value={account.account_credited}>
                {account.account_credited} - {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown for Account Debited */}
        <div>
          <label>Account Debited</label>
          <select
            name="account_debited"
            value={newDisbursement.account_debited}
            onChange={handleInputChange}
          >
            <option value="">Select Account Debited</option>
            {coaAccounts.map((account) => (
              <option key={account.id} value={account.account_debited}>
                {account.account_debited} - {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Accounts */}
        <div>
          {Object.keys(subAccountData).map((key, index) => (
            <div key={key}>
              <label>Sub Account {index + 1} Name</label>
              <input
                type="text"
                value={subAccountData[key]?.name || ''}
                onChange={(e) =>
                  setSubAccountData((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], name: e.target.value },
                  }))
                }
              />
              <label>Amount</label>
              <input
                type="number"
                value={subAccountData[key]?.amount || 0}
                onChange={(e) =>
                  setSubAccountData((prev) => ({
                    ...prev,
                    [key]: { ...prev[key], amount: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
              <button type="button" onClick={() => {
                const newSubAccountData = { ...subAccountData };
                delete newSubAccountData[key];
                setSubAccountData(newSubAccountData);
              }}>
                Remove Sub-Account
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextKey = Object.keys(subAccountData).length + 1;
              setSubAccountData({
                ...subAccountData,
                [`sub_account_${nextKey}`]: { name: '', amount: 0 },
              });
            }}
          >
            Add Sub-Account
          </button>
        </div>

        <div>
          <label>Total</label>
          <input type="number" value={newDisbursement.total} readOnly />
        </div>

        <div>
          <button type="submit">Submit Disbursement</button>
        </div>
      </form>

      {/* Table displaying all disbursements */}
      <table>
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
            <th>Subaccounts</th>
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
                <button onClick={() => handleDelete(disbursement.id)}>
                  Delete
                </button>
              </td>
              <td>
                {Object.keys(disbursement.sub_accounts).map((subKey) => (
                  <div key={subKey}>
                    {subKey}: {disbursement.sub_accounts[subKey]?.amount || 0}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashDisbursementJournalTable;
