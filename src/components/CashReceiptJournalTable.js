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
  const [isEditing, setIsEditing] = useState(false); // Track if editing
  const [editingData, setEditingData] = useState(null); 
  // Define receiptToEdit state here

  const [subaccountsForInvoice, setSubaccountsForInvoice] = useState([]);
  const uniqueAccountTypes = [...new Set(coa.map((account) => account.account_type))];

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("http://127.0.0.1:5000/cash-receipt-journals", {
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
      const response = await fetch("http://127.0.0.1:5000/chart-of-accounts", {
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
        `http://127.0.0.1:5000/${parentAccountId}`,
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
  
    // Ensure parent_account is filled
    if (!formData.parent_account) {
      setError("Parent Account is required.");
      return;
    }
  
    // Ensure cash and bank values are numeric before sending them
    let cash = parseFloat(formData.cash) || 0; // Default to 0 if not a valid number
    let bank = parseFloat(formData.bank) || 0; // Default to 0 if not a valid number
  
    // Log the cash and bank values to check if they are correct
    console.log("Cash value:", cash, "Bank value:", bank);
  
    // Check if cash or bank are NaN
    if (isNaN(cash) || isNaN(bank)) {
      setError("Cash and Bank values must be numeric.");
      return;
    }
  
    // Get the token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }
  
    // Prepare the payload with proper cash and bank values
    const payload = {
      receipt_date: formData.receipt_date,
      receipt_no: formData.receipt_no,
      ref_no: formData.ref_no,
      from_whom_received: formData.from_whom_received,
      description: formData.description,
      account_class: formData.account_class,
      account_type: formData.account_type,
      receipt_type: formData.receipt_type,
      account_debited: formData.account_debited,
      account_credited: formData.account_credited,
      cash: cash, // Ensure cash is sent
      bank: bank, // Ensure bank is sent
      total: formData.total,
      parent_account: formData.parent_account,
      cashbook: formData.cashbook,
      sub_accounts: Array.isArray(subAccountData) ? subAccountData.reduce((acc, sub) => {
        if (sub.name && sub.amount) {
          acc[sub.name] = parseFloat(sub.amount);
        }
        return acc;
      }, {}) : {},
    };
   

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));
  
    // Check for missing account information
    if (!payload.account_debited && !payload.account_credited) {
      setError("Either Account Debited or Account Credited must be selected.");
      return;
    }
  
    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/cash-receipt-journals/${editingData.id}`  // Editing URL with ID
        : "http://127.0.0.1:5000/cash-receipt-journals";  // Creating new entry URL
  
      const method = isEditing ? "PUT" : "POST";  // Use PUT for editing, POST for creating
  
      const response = await fetch(url, {
        method: method,
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
  
      fetchJournals();  // Reload the journals list
      setFormData({});  // Reset form data
      setError("");  // Reset error state
  
      // Reset editing state if editing
      if (isEditing) {
        setIsEditing(false); // Exit edit mode
        setEditingData(null); // Clear editing data
      }
  
    } catch (err) {
      setError(err.message);  // Handle any errors
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

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingData(item); // Populate the form with the data of the item you're editing
    setFormData({
      ...item,
      cash: item.cash || 0,
      bank: item.bank || 0,
    });
  };
  
  

  useEffect(() => {
    if (isEditing && editingData) {
      setFormData({
        receipt_date: editingData.receipt_date,
        receipt_no: editingData.receipt_no,
        ref_no: editingData.ref_no,
        from_whom_received: editingData.from_whom_received,
        description: editingData.description,
        account_class: editingData.account_class,
        account_type: editingData.account_type,
        receipt_type: editingData.receipt_type,
        account_debited: editingData.account_debited,
        account_credited: editingData.account_credited,
        cash: editingData.cash,
        bank: editingData.bank,
        total: editingData.total,
        parent_account: editingData.parent_account,
        cashbook: editingData.cashbook,
      });
      // Set subAccountData if necessary
      setSubAccountData(editingData.sub_accounts || []);
    }
  }, [isEditing, editingData]);
  

  const handleDelete = async (journalId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const response = await fetch(`http://127.0.0.1:5000/cash-receipt-journals/${journalId}`, {
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
// };
 
return (
  <div className="container">
    <h1 className="header">Cash Receipt Journal</h1>
    {error && <p className="error">{error}</p>}

    <form className="form" onSubmit={handleSubmit}>
      {/* Basic Form Fields */}
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
            name="from_whom_received"
            value={formData.from_whom_received}
            onChange={handleInputChange}
            placeholder="From Whom Received"
            required
            className="form-input"
            
          />
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
        <label htmlFor="cashbook">Cashbook</label>
        <input
          type="text"
          id="cashbook"
          name="cashbook"
          value={formData.cashbook}
          onChange={handleInputChange}
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
          onChange={handleInputChange}
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
        <select
          name="account_class"
          value={formData.account_class}
          onChange={handleInputChange}
          required
          className="form-input"
        >
          <option value="">Select Account Class</option>
          {coa
            .map((account) => account.account_name)
            .filter((value, index, self) => self.indexOf(value) === index)
            .map((accountName, index) => (
              <option key={index} value={accountName}>
                {accountName}
              </option>
            ))}
        </select>

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
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            required
            className="form-input"
          />
        </div>
      <input
        type="text"
        name="receipt_type"
        value={formData.receipt_type}
        onChange={handleInputChange}
        placeholder="Receipt Type"
        className="form-input"
        required
      />

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

      {subAccountData && Array.isArray(subAccountData) && subAccountData.length > 0 ? (
  subAccountData.map((subAccount, index) => (
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
  ))
) : (
  <p>No subaccounts available</p>
)}

      <button type="button" onClick={handleAddSubAccount} className="add-subaccount-btn">
        Add Subaccount
      </button>

      <button type="submit" className="form-submit-btn">
  {isEditing ? "Update" : "Submit"}
</button>
    </form>

    {/* Table for Viewing Journals */}
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
          <th>General Ledger</th>
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
              <button onClick={() => handleDelete(journal.id)}>Delete</button>
              <button onClick={() => handleEdit(journal)}>Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
     

    </div>
  );
};

export default CashReceiptJournalTable;