import React, { useState, useEffect } from "react";
import "./CashReceiptJournalTable.css";

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [viewingSubAccounts, setViewingSubAccounts] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    receipt_date: "",
    receipt_no: "",
    ref_no: "",
    from_whom_received: "",
    description: "",
    account_class: "",  // added
    account_type: "",   // added
    receipt_type: "",   // added
    account_debited: "",
    account_credited: "",
    cash: 0,
    bank: 0,
    total: 0, // Automatically computed total
    parent_account: "",
    cashbook: "",
  });
  const [subAccountData, setSubAccountData] = useState([]);

  // State for storing subaccounts of the selected journal
  const [subaccountsForInvoice, setSubaccountsForInvoice] = useState([]);

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("https://finance.boogiecoin.com/cash-receipt-journals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setJournals(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCOA = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("https://finance.boogiecoin.com/chart-of-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setCoa(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSubAccounts = async (parentAccountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch(
        `htps://finance.boogiecoin.com/${parentAccountId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setSubAccounts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === "cash" || name === "bank") {
      // Recalculate total whenever cash or bank changes
      newFormData.total = parseFloat(newFormData.cash || 0) + parseFloat(newFormData.bank || 0);
    }

    setFormData(newFormData);

    if (name === "parent_account") {
      fetchSubAccounts(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.parent_account) {
      setError("Parent Account is required.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }

    const payload = {
      ...formData,
      sub_accounts: subAccountData.reduce((acc, sub) => {
        if (sub.name && sub.amount) {
          acc[sub.name] = parseFloat(sub.amount);
        }
        return acc;
      }, {}),
    };

    if (!payload.account_debited && !payload.account_credited) {
      setError("Either Account Debited or Account Credited must be selected.");
      return;
    }

    try {
      const response = await fetch("https://finance.boogiecoin.com/cash-receipt-journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Error:", errorText);
        throw new Error(errorText);
      }

      fetchJournals(); 
      setFormData({
        receipt_date: "",
        receipt_no: "",
        ref_no: "",
        from_whom_received: "",
        description: "",
        account_class: "",
        account_type: "",
        receipt_type: "",
        account_debited: "",
        account_credited: "",
        cash: 0,
        bank: 0,
        total: 0,
        parent_account: "",
        cashbook: "",
      });
      setSubAccountData([]);
      setError(""); 

    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSubAccount = () => {
    setSubAccountData([...subAccountData, { name: "", amount: 0 }]);
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = subAccountData.filter((_, idx) => idx !== index);
    setSubAccountData(updatedSubAccounts);
  };

  const handleSubAccountChange = (index, field, value) => {
    const updatedSubAccounts = subAccountData.map((sub, idx) =>
      idx === index ? { ...sub, [field]: value } : sub
    );
    setSubAccountData(updatedSubAccounts);
  };

  const toggleSubAccountsView = (journalId) => {
    if (viewingSubAccounts === journalId) {
      setViewingSubAccounts(null);
    } else {
      setViewingSubAccounts(journalId);
      const journal = journals.find((j) => j.id === journalId);
      setSubaccountsForInvoice(journal?.sub_accounts || []);
    }
  };

  const handleDelete = async (journalId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const response = await fetch(`https://finance.boogiecoin.com/cash-receipt-journals/${journalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(await response.text());

      fetchJournals();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchJournals();
    fetchCOA();
  }, []);

  return (
    <div className="container">
      <h1 className="header">Cash Receipt Journal</h1>
      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="date"
            name="receipt_date"
            value={formData.receipt_date}
            onChange={handleInputChange}
            required
            className="form-input"
          />
          <input
            type="text"
            name="receipt_no"
            value={formData.receipt_no}
            onChange={handleInputChange}
            placeholder="Receipt No"
            required
            className="form-input"
          />
        </div>
        <div>
          <i><label>CASHBOOK</label></i>
          <input
            type="text"
            name="cashbook"
            value={formData.cashbook}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            required
            className="form-input"
          />
        </div>

        {/* Other form inputs */}
        <div className="form-row">
          <input
            type="text"
            name="ref_no"
            value={formData.ref_no}
            onChange={handleInputChange}
            placeholder="Reference No"
            required
            className="form-input"
          />
          <input
            type="text"
            name="from_whom_received"
            value={formData.from_whom_received}
            onChange={handleInputChange}
            placeholder="From Whom Received"
            required
            className="form-input"
            
          />
        </div>

        {/* Account Debited and Credited */}
        <div className="form-row">
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Debited</option>
            {coa.map((account) => (
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            ))}
          </select>

          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Credited</option>
            {coa.map((account) => (
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            ))}
          </select>
          <select
            name="parent_account"
            value={formData.parent_account}
            onChange={handleInputChange}
            required
            className="form-input"
          >
            <option value="">Select Parent Account</option>
            {coa.map((account, index) => (
              <option key={index} value={account.parent_account}>
                {account.parent_account}
              </option>
            ))}
          </select>
        </div>

     
<div className="form-row">
  <input
    type="text"
    name="account_class"
    value={formData.account_class}
    onChange={handleInputChange}
    placeholder="Account Class "
    className="form-input"
    required
  />
  <input
    type="text"
    name="account_type"
    value={formData.account_type}
    onChange={handleInputChange}
    placeholder="Account Type "
    className="form-input"
    required
  />
  <input
    type="text"
    name="receipt_type"
    value={formData.receipt_type}
    onChange={handleInputChange}
    placeholder="Receipt Type "
    className="form-input"
    required
  />
</div>

{/* Cash, Bank, and Total */}
<div className="form-row">
  <input
    type="number"
    name="cash"
    value={formData.cash}
    onChange={handleInputChange}
    placeholder="Cash"
    className="form-input"
  />
  <input
    type="number"
    name="bank"
    value={formData.bank}
    onChange={handleInputChange}
    placeholder="Bank"
    className="form-input"
  />
  <input
    type="number"
    name="total"
    value={formData.total}
    readOnly
    placeholder="Total"
    className="form-input"
  />
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
                {coa.map((account) => (
                  account.sub_account_details?.map((sub, subIndex) => (
                    <option key={subIndex} value={sub.name}>
                      {sub.name}
                    </option>
                  ))
                ))}
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

        <button type="submit" className="form-submit-btn">
          Submit
        </button>
      </form>

      {/* Journal Table */}
      <table className="journal-table">
        <thead>
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
            <th>Cashbook</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Cash</th>
            <th>Bank</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {journals.map((journal) => (
            <tr key={journal.id}>
              <td>{journal.receipt_no}</td>
              <td>{journal.ref_no}</td>
              <td>{journal.receipt_date}</td>
              <td>{journal.from_whom_received}</td>
              <td>{journal.description}</td>
              <td>{journal.account_class}</td>
              <td>{journal.account_type}</td>
              <td>{journal.parent_account}</td>
              <td>{journal.receipt_type}</td>
              <td>{journal.cashbook}</td>
              <td>{journal.account_debited}</td>
              <td>{journal.account_credited}</td>
              <td>{journal.cash}</td>
              <td>{journal.bank}</td>
              <td>{journal.total}</td>
              <td>
                <button onClick={() => toggleSubAccountsView(journal.id)}>
                  {viewingSubAccounts === journal.id ? 'Hide Subaccounts' : 'View Subaccounts'}
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(journal.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

     
 {subaccountsForInvoice && (
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
        {Object.entries(subaccountsForInvoice).map(([name, amount]) => (
          <tr key={name}>
            <td>{name}</td>
            <td>{amount}</td>  {/* Directly displaying amount */}
          </tr>
        ))}
      </tbody>
    </table>
    <button onClick={() => setSubaccountsForInvoice(null)}>Close</button>
  </div>
      )}
    </div>
  );
};

export default CashReceiptJournalTable;