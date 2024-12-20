import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Import the external CSS file

const InvoiceTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccountData, setSubAccountData] = useState({});
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    invoice_number: "",
    date_issued: "",
    account_type: "",
    amount: 0,
    account_class: "",
    account_debited: "",
    account_credited: "",
    grn_number: "",
    parent_account: "",
  });

  const [viewingSubAccounts, setViewingSubAccounts] = useState(null);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }
      const response = await fetch("http://localhost:5000/invoices", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(await response.text());
      setInvoices(await response.json());
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
    const totalMain = parseFloat(formData.amount) || 0;

    if (totalMain !== totalSubAccounts) {
      setError("Subaccount totals must match the combined total.");
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

    const totalMain = parseFloat(formData.amount) || 0;
    const totalSubAccounts = Object.values(updatedSubAccounts).reduce(
      (sum, acc) => sum + (acc.amount || 0),
      0
    );

    if (totalMain !== totalSubAccounts) {
      setError("Subaccount totals must match the combined total.");
    } else {
      setError("");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalSubAccounts = Object.values(subAccountData).reduce(
        (sum, acc) => sum + (acc.amount || 0),
        0
      );

      if (parseFloat(formData.amount) !== totalSubAccounts) {
        setError("Subaccount totals must match the combined total.");
        return;
      }

      const payload = {
        ...formData,
        account_credited: formData.account_credited || null,
        account_debited: formData.account_debited || null,
        sub_accounts: subAccountData,
      };
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }

      const response = await fetch("http://localhost:5000/invoices", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

      setFormData({
        invoice_number: "",
        date_issued: "",
        account_type: "",
        amount: 0,
        account_class: "",
        account_debited: "",
        account_credited: "",
        grn_number: "",
        parent_account: "",
      });
      setSubAccountData({});
      fetchInvoices();
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
      const response = await fetch(`http://localhost:5000/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      fetchInvoices();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCOA();
  }, []);

  return (
    <div className="container">
      <h1 className="header">Invoice Table</h1>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleFormSubmit}>
        {/* Form for invoice details */}
        <div className="form-row">
          <input
            type="text"
            name="invoice_number"
            value={formData.invoice_number}
            onChange={handleInputChange}
            placeholder="Invoice Number"
            required
            className="form-input"
          />
          <input
            type="date"
            name="date_issued"
            value={formData.date_issued}
            onChange={handleInputChange}
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
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Amount"
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
  <select
    name="account_debited"
    value={formData.account_debited}
    onChange={handleInputChange}
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
            type="text"
            name="grn_number"
            value={formData.grn_number}
            onChange={handleInputChange}
            placeholder="GRN Number (optional)"
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

      {/* Invoice Table */}
      <table className="invoice-table">
        <thead>
          <tr>
          <th>Date Issued</th>
          <th>Account Type</th>
          <th>Account Class</th>
          <th>GRN Number</th>
            <th>Invoice No</th>
            <th>Parent Account</th>
            <th>Account Credited</th>
            <th>Account Debited</th>
            <th>Amount</th>
            
           
           
            
            
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
                 <td>{invoice.date_issued}</td>
                 <td>{invoice.account_type}</td>
                 <td>{invoice.account_class}</td>
                 <td>{invoice.grn_number}</td>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.parent_account}</td>
              <td>{invoice.account_credited}</td>
              <td>{invoice.account_debited}</td>
              <td>{invoice.amount}</td>
             
             
              
              
              
             
              <td>
                <button onClick={() => toggleSubAccountsView(invoice.id)}>
                  {viewingSubAccounts === invoice.id ? 'Hide Subaccounts' : 'View Subaccounts'}
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(invoice.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display Subaccounts */}
      {viewingSubAccounts && (
        <div className="subaccount-container">
          <h4>Subaccounts</h4>
          {invoices
            .filter((invoice) => invoice.id === viewingSubAccounts)
            .map((invoice) => (
              <div key={invoice.id}>
                {invoice.sub_accounts && Object.keys(invoice.sub_accounts).map((key) => (
                  <div key={key} className="subaccount-row">
                    <div>Name: {invoice.sub_accounts[key].name}</div>
                    <div>Amount: {invoice.sub_accounts[key].amount}</div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;
