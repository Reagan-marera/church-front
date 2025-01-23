import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Import the external CSS file

const InvoiceTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [successMessage, setSuccessMessage] = useState(""); // Add successMessage state
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
  const uniqueAccountTypes = [...new Set(coa.map((account) => account.account_type))];

  const [viewingSubAccounts, setViewingSubAccounts] = useState(null);
  const [filteredAccounts, setFilteredAccounts] = useState({
    debited: [],
    credited: [],
  });

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }
  
      const response = await fetch("http://127.0.0.1:5000/invoices", {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
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
      const response = await fetch("http://127.0.0.1:5000/chart-of-accounts", {
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
    const newSubAccountIndex = Object.keys(subAccountData).length + 1;
    setSubAccountData((prev) => ({
      ...prev,
      [`account_${newSubAccountIndex}`]: { name: "", amount: 0 },
    }));
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
  
    // Ensure subAccountData is an object, if it's not an array
    if (typeof subAccountData !== "object") {
      setError("Subaccount data is invalid.");
      return;
    }
  
    // Construct the payload to send to the server
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount), // Ensure amount is a number
      sub_accounts: subAccountData, // Send the subaccounts as they are (as an object)
      account_credited: formData.account_credited || undefined, // Use undefined instead of null
    };
  
    try {
      const token = localStorage.getItem("token");
  
      let response;
  
      if (formData.id) {
        // If there's an id, we're updating an existing invoice, so use PUT
        response = await fetch(`http://127.0.0.1:5000/invoices/${formData.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Otherwise, we're creating a new invoice, so use POST
        response = await fetch("http://127.0.0.1:5000/invoices", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
  
      if (!response.ok) throw new Error(await response.text());
  
      // Set success message on successful submission
      setSuccessMessage("Invoice submitted successfully!");
  
      // Reset form data after successful submission
      setFormData({
        invoice_number: "",
        date_issued: "",
        account_type: "",
        invoice_type: "",
        amount: 0,
        account_class: "",
        account_debited: "",
        account_credited: "",
        grn_number: "",
      });
      setSubAccountData({}); // Clear subaccount data (as an object)
      fetchInvoices(); // Fetch updated invoices list
  
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000); // Reset success message after 3 seconds (optional)
  
    } catch (err) {
      setError(err.message);
    }
  };
  

  const toggleSubAccountsView = (id) => {
    const invoiceToEdit = invoices.find(invoice => invoice.id === id);
  
    // Pre-fill the form with the invoice details if you're editing
    if (invoiceToEdit) {
      setFormData({
        id: invoiceToEdit.id, // Add the ID here
        invoice_number: invoiceToEdit.invoice_number,
        date_issued: invoiceToEdit.date_issued,
        account_type: invoiceToEdit.account_type,
        amount: invoiceToEdit.amount,
        account_class: invoiceToEdit.account_class,
        account_debited: invoiceToEdit.account_debited,
        account_credited: invoiceToEdit.account_credited,
        grn_number: invoiceToEdit.grn_number,
        parent_account: invoiceToEdit.parent_account,
      });
      setSubAccountData(invoiceToEdit.sub_accounts || {}); // Make sure subaccounts are also set
    }
  
    setViewingSubAccounts(viewingSubAccounts === id ? null : id);
  };
  
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }
      const response = await fetch(`http://127.0.0.1:5000/invoices/${id}`, {
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
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="description" 
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
        <input
  type="text"  
  name="invoice_type"
  value={formData.invoice_type}
  onChange={handleInputChange}
  required
  className="form-input"
  placeholder="Enter invoice type"  
/>

        </div>
    {/* Account Type Dropdown */}
    <div className="form-row">
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleInputChange}
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
        <div className="form-row">
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
  <select
    name="account_class"
    value={formData.account_class}
    onChange={handleInputChange}
    required
    className="form-input"
  >
    <option value="">Select Account class</option>
    {coa
      .map((account) => account.account_name) // Map to an array of account names
      .filter((value, index, self) => self.indexOf(value) === index) // Filter unique account names
      .map((accountName, index) => (
        <option key={index} value={accountName}>
          {accountName}
        </option>
      ))}
  </select>
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
          <option value="">Select General Ledger</option>
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
  
        <div className="form-row">
    <button type="submit" className="form-button">
      {formData.id ? "Update Invoice" : "Submit Invoice"}
    </button>
  </div>
  {successMessage && <div className="success-message">{successMessage}</div>}
      </form>
  
      {/* Subaccounts Form */}
      <div>
        <h3>Subaccounts</h3>
        {Object.keys(subAccountData).map((key, index) => (
          <div key={key} className="form-row">
            <select
              name={`subaccount_${index + 1}`}
              value={subAccountData[key].name}
              onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
              className="form-input"
            >
              <option value="">Select Subaccount</option>
              {coa.map((account) => (
                account.sub_account_details && account.sub_account_details.length > 0 ? (
                  account.sub_account_details.map((subAccount, subIndex) => (
                    <option key={`${account.id}-${subIndex}`} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))
                ) : null
              ))}
            </select>
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
  
      {/* Invoice Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Date Issued</th>
            <th>Account Type</th>
            <th>Invoice Type</th>
            <th>Account Class</th>
            <th>GRN Number</th>
            <th>Description</th>
            <th>Invoice No</th>
            <th>General Ledger</th>
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
              <td>{invoice.invoice_type}</td>
              <td>{invoice.account_class}</td>
              <td>{invoice.grn_number}</td>
              <td>{invoice.description}</td>
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
                 <button type="submit">
        {formData.id ? "Update Invoice" : "Submit Invoice"}
      </button>
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