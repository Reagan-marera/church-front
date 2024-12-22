import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Import the external CSS file

const InvoiceTable = () => {
  const [invoices, setInvoices] = useState([]);
  const [coa, setCoa] = useState([]);  // Store Chart of Accounts
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    invoice_number: "",
    date_issued: "",
    account_type: "",
    amount: 0,
    account_class: "",
    account_debited: "",
    account_credited: "",
    grn_number: "", // Added grn_number here
    parent_account: "",
  });
  const [subAccountData, setSubAccountData] = useState([]);
  const [subaccountsForInvoice, setSubaccountsForInvoice] = useState(null); // New state for subaccounts

  // Fetch COA (Chart of Accounts)
  useEffect(() => {
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
        setInvoices(await response.json()); // This will update the state and render the invoices
      } catch (err) {
        setError(err.message);
      }
    };
  
    fetchInvoices();  // Call fetchInvoices when the component mounts
  }, []);  // Empty dependency array ensures this runs only once on mount
  
  // Fetch invoices
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

  const handleDelete = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated");
        return;
      }

      const response = await fetch(`http://localhost:5000/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(await response.text());

      // After successful deletion, refresh the invoice list
      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSubAccount = () => {
    setSubAccountData([...subAccountData, { name: "", amount: 0 }]);
  };

  const handleSubAccountChange = (index, field, value) => {
    const updatedSubAccounts = subAccountData.map((sub, i) =>
      i === index ? { ...sub, [field]: value } : sub
    );
    setSubAccountData(updatedSubAccounts);
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = subAccountData.filter((_, i) => i !== index);
    setSubAccountData(updatedSubAccounts);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validate that the subaccounts exist and their total matches the invoice amount
    const totalSubAccountAmount = subAccountData.reduce(
      (acc, subAccount) => acc + parseFloat(subAccount.amount || 0),
      0
    );

    if (totalSubAccountAmount !== parseFloat(formData.amount)) {
      setError("The total of subaccounts must match the invoice amount.");
      return;
    }

    // Construct the payload to send
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount), // Ensure amount is a number
      sub_accounts: subAccountData.reduce((acc, subAccount) => {
        // Construct sub_accounts as an object
        if (subAccount.name && subAccount.amount) {
          acc[subAccount.name] = parseFloat(subAccount.amount || 0);
        }
        return acc;
      }, {}),
      account_credited: formData.account_credited || undefined, // Use undefined instead of null
    };

    // Send the payload as a JSON string
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await response.text());

    // Reset form fields after successful submission
    setFormData({
      invoice_number: "",
      date_issued: "",
      account_type: "",
      amount: 0,
      account_class: "",
      account_debited: "",
      account_credited: "",
      grn_number: "", // Reset grn_number
      parent_account: "",
    });
    setSubAccountData([]);
    fetchInvoices(); // Refresh invoices list
  };

  const handleViewSubaccounts = (invoiceId) => {
    const invoice = invoices.find((invoice) => invoice.id === invoiceId);
    if (invoice) {
      setSubaccountsForInvoice(invoice.sub_accounts); // Display subaccounts for the selected invoice
    }
  };

  return (
    <div className="container">
      <h1 className="header">Invoice Table</h1>

      {error && <p className="error">{error}</p>}

      <form className="form" onSubmit={handleFormSubmit}>
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
          {/* Dropdown for Account Debited */}
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Debited</option>
            {coa.map((account, index) => (
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            ))}
          </select>

          {/* Dropdown for Account Credited */}
          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Credited</option>
            {coa.map((account, index) => (
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            ))}
          </select>

          {/* Dropdown for Parent Account */}
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
            name="grn_number" // Added grn_number input
            value={formData.grn_number}
            onChange={handleInputChange}
            placeholder="GRN Number"
            required
            className="form-input"
          />
        </div>

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
            <th>Subaccounts</th> {/* New column for View Subaccounts button */}
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
                <button
                  onClick={() => handleDelete(invoice.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
              <td>
                <button
                  onClick={() => handleViewSubaccounts(invoice.id)}
                  className="view-subaccounts-btn"
                >
                  View Subaccounts
                </button>
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

export default InvoiceTable;