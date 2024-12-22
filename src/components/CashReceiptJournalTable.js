import React, { useState, useEffect } from "react";
import "./CashReceiptJournalTable.css";

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);  // Store valid subaccounts for selected parent
  const [viewingSubAccounts, setViewingSubAccounts] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
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

  const [subAccountData, setSubAccountData] = useState({});

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("http://localhost:5000/cash-receipt-journals", {
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
      const response = await fetch("http://localhost:5000/chart-of-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setCoa(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSubAccountsView = (journalId) => {
    setViewingSubAccounts(viewingSubAccounts === journalId ? null : journalId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Automatically calculate total when cash or bank changes
    if (name === "cash" || name === "bank") {
      newFormData.total = parseFloat(newFormData.cash || 0) + parseFloat(newFormData.bank || 0);
    }

    setFormData(newFormData);

    // Load subaccounts dynamically when parent_account is selected
    if (name === "parent_account") {
      fetchSubAccounts(value);
    }
  };
  const handleDelete = async (journalId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
  
      const response = await fetch(`http://localhost:5000/cash-receipt-journals/${journalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error(await response.text());
  
      // Refresh the journals after deletion
      fetchJournals();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleAddSubAccount = () => {
    setSubAccountData({
      ...subAccountData,
      [`subaccount_${Object.keys(subAccountData).length + 1}`]: { name: "", amount: 0 },
    });
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = { ...subAccountData };
    delete updatedSubAccounts[index];
    setSubAccountData(updatedSubAccounts);
  };

  const handleSubAccountChange = (index, field, value) => {
    setSubAccountData({
      ...subAccountData,
      [index]: {
        ...subAccountData[index],
        [field]: value,
      },
    });
  };

  // Fetch valid subaccounts for selected parent account
  const fetchSubAccounts = async (parentAccountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch(
        `http://localhost:5000/sub-accounts/${parentAccountId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setSubAccounts(data);  // Store valid subaccounts
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate selected subaccounts against valid subaccounts for the parent account
    const invalidSubaccounts = Object.values(subAccountData).some(
      (sub) =>
        !subAccounts.find(
          (validSubaccount) => validSubaccount.name === sub.name
        )
    );

    if (invalidSubaccounts) {
      setError("One or more subaccounts are invalid for the selected parent account.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const payload = { ...formData, sub_accounts: subAccountData };

      const response = await fetch("http://localhost:5000/cash-receipt-journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
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

  useEffect(() => {
    fetchJournals();
    fetchCOA();
  }, []);

  return (
    <div className="container">
      <h1 className="header">Cash Receipt Journal</h1>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleSubmit}>
        {/* Form for receipt details */}
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
          <i> <label>CASHBOOK</label></i>
          <input
            type="text"
            name="cashbook"
            value={formData.cashbook}
            onChange={handleInputChange}
            required
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

        <div className="form-row">
          <input
            type="text"
            name="account_class"
            value={formData.account_class}
            onChange={handleInputChange}
            placeholder="Account Class"
            required
            className="form-input"
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="account_type"
            value={formData.account_type}
            onChange={handleInputChange}
            placeholder="Account Type"
            required
            className="form-input"
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="receipt_type"
            value={formData.receipt_type}
            onChange={handleInputChange}
            placeholder="Receipt Type"
            required
            className="form-input"
          />
        </div>

        <div className="form-row">
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            required={formData.account_credited ? false : true} // Only require one
            className="form-input"
          >
            <option value="">Select Account Debited (Optional)</option>
            {coa.map((account, index) => (
              <option key={index} value={account.account_name}>
                {account.account_name}
              </option>
            ))}
          </select>

          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            required={formData.account_debited ? false : true} // Only require one
            className="form-input"
          >
            <option value="">Select Account Credited (Optional)</option>
            {coa.map((account, index) => (
              <option key={index} value={account.account_name}>
                {account.account_name}
              </option>
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
            disabled
            placeholder="Total"
            className="form-input"
          />
        </div>

        {/* Subaccounts Form */}
        <div>
          <h3>Subaccounts</h3>
          {Object.keys(subAccountData).map((key, index) => (
            <div key={key} className="form-row">
              <input
                type="text"
                value={subAccountData[key].name}
                onChange={(e) => handleSubAccountChange(key, 'name', e.target.value)}
                placeholder={`Subaccount ${index + 1} Name`}
                className="form-input"
              />
              <input
                type="number"
                value={subAccountData[key].amount}
                onChange={(e) => handleSubAccountChange(key, 'amount', e.target.value)}
                placeholder={`Amount for Subaccount ${index + 1}`}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => handleRemoveSubAccount(key)}
                className="remove-subaccount-btn"
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" onClick={handleAddSubAccount} className="add-subaccount-btn">
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

      {/* Display Subaccounts */}
      {viewingSubAccounts && (
        <div className="subaccount-container">
          <h4>Subaccounts</h4>
          {journals
            .filter((journal) => journal.id === viewingSubAccounts)
            .map((journal) => (
              <div key={journal.id}>
                {journal.sub_accounts && Object.keys(journal.sub_accounts).map((key) => (
                  <div key={key} className="subaccount-row">
                    <div>Name: {journal.sub_accounts[key].name}</div>
                    <div>Amount: {journal.sub_accounts[key].amount}</div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CashReceiptJournalTable;
