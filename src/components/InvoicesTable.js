import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Import the external CSS file

const InvoiceTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [coa, setCoa] = useState([]);
  const [subAccountData, setSubAccountData] = useState([]); // Changed to an array
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
  const [filteredAccounts, setFilteredAccounts] = useState({
    debited: [],
    credited: [],
  });

  // Fetching invoices and COA
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

  // Helper function to get unique account names from the chart of accounts
  const getUniqueAccounts = () => {
    const accountNames = coa.map(account => account.account_name);
    return [...new Set(accountNames)];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });

    // Handle autocomplete filtering for debited and credited accounts
    if (name === "account_debited") {
      const filtered = coa.filter(account => 
        account.account_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAccounts((prev) => ({ ...prev, debited: filtered }));
    }

    if (name === "account_credited") {
      const filtered = coa.filter(account => 
        account.account_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAccounts((prev) => ({ ...prev, credited: filtered }));
    }
  };

  const handleSubAccountChange = (index, field, value) => {
    const updatedSubAccounts = [...subAccountData];
    
    // Update subaccount field (either name or amount)
    updatedSubAccounts[index] = {
      ...updatedSubAccounts[index],
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    };
  
    // Validate subaccount name (case-insensitive, trim spaces)
    if (field === "name") {
      const trimmedValue = value.trim().toLowerCase();
      const isValidSubAccount = coa.some(account => account.account_name.trim().toLowerCase() === trimmedValue);
      
      if (!isValidSubAccount) {
        setError(`Subaccount "${value}" is not valid.`);
      } else {
        setError(""); // Clear error if subaccount is valid
      }
    }
  
    setSubAccountData(updatedSubAccounts);
  
    // Ensure that the total amounts match
    const totalSubAccounts = updatedSubAccounts.reduce(
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
    setSubAccountData([
      ...subAccountData,
      { name: "", amount: 0 },
    ]);
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = subAccountData.filter((_, i) => i !== index);
    setSubAccountData(updatedSubAccounts);

    const totalMain = parseFloat(formData.amount) || 0;
    const totalSubAccounts = updatedSubAccounts.reduce(
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
      // Check if all subaccount names are valid when submitting the form
      for (let subAccount of subAccountData) {
        const isValidAccount = coa.some(account => account.account_name === subAccount.name);
        if (!isValidAccount) {
          setError(`Subaccount "${subAccount.name}" is not valid.`);
          return;
        }
      }

      const totalSubAccounts = subAccountData.reduce(
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
        sub_accounts: subAccountData, // Send the subaccount data in the correct structure
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
      setSubAccountData([]); // Reset subaccount data
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
          {/* Debited Account Autocomplete */}
          <input
            type="text"
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            placeholder="Account Debited"
            className="form-input"
          />
          <div className="autocomplete-suggestions">
            {filteredAccounts.debited.map((account, index) => (
              <div
                key={index}
                className="autocomplete-suggestion"
                onClick={() => setFormData({ ...formData, account_debited: account.account_name })}
              >
                {account.account_name}
              </div>
            ))}
          </div>

          {/* Credited Account Autocomplete */}
          <input
            type="text"
            name="account_credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            placeholder="Account Credited"
            className="form-input"
          />
          <div className="autocomplete-suggestions">
            {filteredAccounts.credited.map((account, index) => (
              <div
                key={index}
                className="autocomplete-suggestion"
                onClick={() => setFormData({ ...formData, account_credited: account.account_name })}
              >
                {account.account_name}
              </div>
            ))}
          </div>
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

        <div>
          <h3>Subaccounts</h3>
          {subAccountData.map((subAccount, index) => (
            <div key={index} className="form-row">
              {/* Autocomplete Subaccount Name */}
              <input
                type="text"
                value={subAccount.name}
                onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                placeholder={`Subaccount ${index + 1} Name`}
                className="form-input"
              />
              <div className="autocomplete-dropdown">
                {coa
                  .filter(account => account.account_name.toLowerCase().includes(subAccount.name.toLowerCase()))
                  .map((account, idx) => (
                    <div
                      key={idx}
                      className="autocomplete-item"
                      onClick={() => handleSubAccountChange(index, 'name', account.account_name)}
                    >
                      {account.account_name}
                    </div>
                  ))}
              </div>

              <input
                type="number"
                value={subAccount.amount}
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
                {invoice.sub_accounts && invoice.sub_accounts.map((subAccount, index) => (
                  <div key={index} className="subaccount-row">
                    <div>Name: {subAccount.name}</div>
                    <div>Amount: {subAccount.amount}</div>
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
