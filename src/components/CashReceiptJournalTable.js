import React, { useState, useEffect } from "react";
import "./CashReceiptJournalTable.css"; // Import the external CSS file

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccountData, setSubAccountData] = useState({});
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
    bank: "",
    cash: "",
    total: 0,
    parent_account: "",
  });
  const [viewingSubAccounts, setViewingSubAccounts] = useState(null);

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }
      const response = await fetch("http://localhost:5000/cash-receipt-journals", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
      const response = await fetch("http://localhost:5000/chart-of-accounts", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(await response.text());
      setCoa(await response.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "cash" || name === "bank") {
        updated.total = (parseFloat(updated.cash) || 0) + (parseFloat(updated.bank) || 0);
      }
      return updated;
    });
  };

  const handleSubAccountChange = (index, field, value) => {
    const updatedSubAccounts = { ...subAccountData };
    updatedSubAccounts[`account_${index + 1}`] = {
      ...updatedSubAccounts[`account_${index + 1}`],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
    setSubAccountData(updatedSubAccounts);

    const totalSubAccounts = Object.values(updatedSubAccounts).reduce(
      (sum, acc) => sum + (acc.amount || 0),
      0
    );
    const totalMain = (parseFloat(formData.cash) || 0) + (parseFloat(formData.bank) || 0);

    if (totalMain !== totalSubAccounts) {
      setError("Subaccount totals must match the combined total of cash and bank.");
    } else {
      setError("");
    }
  };

  const handleAddSubAccount = () => {
    const nextIndex = Object.keys(subAccountData).length + 1;
    setSubAccountData({
      ...subAccountData,
      [`account_${nextIndex}`]: { name: "", amount: 0 },
    });
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = { ...subAccountData };
    delete updatedSubAccounts[`account_${index + 1}`];
    setSubAccountData(updatedSubAccounts);

    const totalMain = (parseFloat(formData.cash) || 0) + (parseFloat(formData.bank) || 0);
    const totalSubAccounts = Object.values(updatedSubAccounts).reduce(
      (sum, acc) => sum + (acc.amount || 0),
      0
    );

    if (totalMain !== totalSubAccounts) {
      setError("Subaccount totals must match the combined total of cash and bank.");
    } else {
      setError("");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalMain = (parseFloat(formData.cash) || 0) + (parseFloat(formData.bank) || 0);
      const totalSubAccounts = Object.values(subAccountData).reduce(
        (sum, acc) => sum + (acc.amount || 0),
        0
      );

      if (totalMain !== totalSubAccounts) {
        setError("Subaccount totals must match the combined total of cash and bank.");
        return;
      }

      const payload = {
        ...formData,
        sub_accounts: subAccountData,
      };

      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }

      const response = await fetch("http://localhost:5000/cash-receipt-journals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

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
        bank: "",
        cash: "",
        total: 0,
        parent_account: "",
      });
      setSubAccountData({});
      fetchJournals();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSubAccountsView = (id) => {
    setViewingSubAccounts(viewingSubAccounts === id ? null : id);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }
      const response = await fetch(`http://localhost:5000/cash-receipt-journals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

      <form className="form" onSubmit={handleFormSubmit}>
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
            required
            className="form-input"
          >
            <option value="">Select Account Debited</option>
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
            required
            className="form-input"
          >
            <option value="">Select Account Credited</option>
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
                onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                placeholder={`Subaccount ${index + 1} Name`}
                className="form-input"
              />
              <input
                type="number"
                value={subAccountData[key].amount}
                onChange={(e) => handleSubAccountChange(index, 'amount', e.target.value)}
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
