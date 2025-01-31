import React, { useState, useEffect } from "react";
import "./CashReceiptJournalTable.css";

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
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
  const [subAccountData, setSubAccountData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);

  // Fetch journals, COA, and customers on initial load
  useEffect(() => {
    fetchJournals();
    fetchCOA();
    fetchCustomers();
  }, []);

  // Refresh function to fetch data without full page reload
  const refreshData = () => {
    fetchJournals();
    fetchCOA();
    fetchCustomers();
  };

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

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("http://127.0.0.1:5000/customer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      setCustomers(await response.json());
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
      newFormData.total = parseFloat(newFormData.cash || 0) + parseFloat(newFormData.bank || 0);
    }

    // Reset account_credited when receipt_type changes
    if (name === "receipt_type") {
      newFormData.account_credited = ""; // Clear the previous selection
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

    let cash = parseFloat(formData.cash) || 0;
    let bank = parseFloat(formData.bank) || 0;

    if (isNaN(cash) || isNaN(bank)) {
      setError("Cash and Bank values must be numeric.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }

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
      cash: cash,
      bank: bank,
      total: formData.total,
      parent_account: formData.parent_account,
      cashbook: formData.cashbook,
      sub_accounts: subAccountData.reduce((acc, sub) => {
        if (sub.name && sub.amount) {
          acc[sub.name] = parseFloat(sub.amount);
        }
        return acc;
      }, {}),
    };

    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/cash-receipt-journals/${editingData.id}`
        : "http://127.0.0.1:5000/cash-receipt-journals";

      const method = isEditing ? "PUT" : "POST";

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
        throw new Error(errorText);
      }

      // Refresh data after submitting the form
      refreshData();
      setFormData({});
      setError("");

      if (isEditing) {
        setIsEditing(false);
        setEditingData(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

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

        {/* Receipt Type */}
        <div className="form-row">
          <select
            name="receipt_type"
            value={formData.receipt_type}
            onChange={handleInputChange}
            required
            className="form-input"
          >
            <option value="">Select Receipt Type</option>
            <option value="cashreceipt">Cash Receipt</option>
            <option value="invoicedreceipt">Invoiced Receipt</option>
          </select>
        </div>

        {/* Account Debited and Account Credited */}
        <div className="form-row">
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Debited</option>
            {coa.map((account) =>
              account.sub_account_details?.map((subAccount) => (
                <option key={subAccount.id} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            )}
          </select>

          {/* Conditionally populate Account Credited */}
          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="">Select Account Credited</option>
            {formData.receipt_type === "cashreceipt"
              ? coa.map((account) =>
                  account.sub_account_details?.map((subAccount) => (
                    <option key={subAccount.id} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))
                )
              : customers.map((customer) =>
                  customer.sub_account_details?.map((subAccount) => (
                    <option key={subAccount.id} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))
                )}
          </select>
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

        {/* Submit Button */}
        <button type="submit" className="form-submit">
          {isEditing ? "Update" : "Submit"}
        </button>
      </form>

      {/* Refresh Button */}
      <button onClick={refreshData} className="form-refresh">
        Refresh Data
      </button>
    </div>
  );
};

export default CashReceiptJournalTable;
