import React, { useState, useEffect } from "react";
import "./CashReceiptJournalTable.css";

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    receipt_date: "",
    receipt_no: "",
    ref_no: "",
    from_whom_received: "",
    description: "",
    receipt_type: "",
    account_debited: "",
    account_credited: "",
    cash: 0,
    bank: 0,
    total: 0,
    cashbook: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchJournals();
    fetchCOA();
    fetchCustomers();
    fetchInvoices();
  }, []);

  const refreshData = () => {
    fetchJournals();
    fetchCOA();
    fetchCustomers();
    fetchInvoices();
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("http://127.0.0.1:5000/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    }
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
      const data = await response.json();
      setCustomers(
        data.flatMap((customer) =>
          customer.sub_account_details?.map((subAccount) => ({
            ...subAccount,
            parentName: customer.name,
          }))
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }; 
  
  
  const handleCustomerChange = (e) => {
    const selectedCustomerName = e.target.value;
    setCustomerName(selectedCustomerName);
  
    // Debugging: Log the selected customer and all invoices
    console.log("Selected Customer:", selectedCustomerName);
    console.log("All Invoices:", invoices);
  
    // Filter invoices for the selected customer
    const customerInvoices = invoices.filter(
      (invoice) => invoice.name === selectedCustomerName
    );
  
    // Debugging: Log the filtered invoices
    console.log("Customer Invoices:", customerInvoices);
  
    // Calculate total invoice amount
    const totalAmount = customerInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount),
      0
    );
    setInvoiceAmount(totalAmount);
  
    // Filter receipts for the selected customer
    const customerReceipts = journals.filter(
      (journal) => journal.from_whom_received === selectedCustomerName
    );
  
    // Calculate total receipt amount
    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0
    );
  
    // Calculate balance
    const customerBalance = totalAmount - totalReceipts;
    setBalance(customerBalance);
  
    // Debugging: Log the calculated values
    console.log("Invoice Amount:", totalAmount);
    console.log("Total Receipts:", totalReceipts);
    console.log("Balance:", customerBalance);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === "cash" || name === "bank") {
      newFormData.total =
        parseFloat(newFormData.cash || 0) + parseFloat(newFormData.bank || 0);
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      receipt_type: formData.receipt_type,
      account_debited: formData.account_debited,
      account_credited: formData.account_credited,
      cash: cash,
      bank: bank,
      total: formData.total,
      cashbook: formData.cashbook,
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

      refreshData();
      setFormData({});
      setError("");
      setShowForm(false);
      if (isEditing) {
        setIsEditing(false);
        setEditingData(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/cash-receipt-journals/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openFormPopup = () => {
    setShowForm(true);
  };

  const closeFormPopup = () => {
    setShowForm(false);
    setFormData({});
    setError("");
  };
  
  const getDebitAccounts = () => {
    console.log("COA Data:", coa); // Debugging: Inspect the COA data
    console.log("Receipt Type:", formData.receipt_type); // Debugging: Inspect the selected receipt type

    if (formData.receipt_type === "Invoiced") {
        // Filter for accounts with a specific parent account (e.g., "1000")
        const currentAssetsAccount = coa.find(
            (account) => account.parent_account === "1000"
        );
        return currentAssetsAccount?.sub_account_details || [];
    } else if (formData.receipt_type === "Cash") {
        // Handle Cash receipts: Filter for "100-current assets" or similar
        const cashAccount = coa.find(
            (account) => account.account_name === "100-Current Assets"
        );
        return cashAccount?.sub_account_details || [];
    } else {
        // Default behavior for other receipt types
        return coa.filter((account) => account.parent_account === "1000");
    }
};
const getCreditAccounts = () => {
  console.log("COA Data:", coa); // Debugging: Inspect the COA data
  console.log("Receipt Type:", formData.receipt_type); // Debugging: Inspect the selected receipt type

  // Helper function to extract the numeric part of the parent_account
  const getParentAccountNumber = (parentAccount) => {
      const match = parentAccount?.match(/^\d+/); // Extract the numeric part at the start
      return match ? parseInt(match[0], 10) : null; // Convert to number
  };

  if (formData.receipt_type === "Invoiced") {
      // Only include the sub-account "1150-Trade Debtors Control Account" under "1100-Trade Debtors Control account"
      const invoicedAccount = coa.find(
          (account) => account.parent_account === "1100-Trade Debtors Control account"
      );
      return invoicedAccount?.sub_account_details?.filter(
          (subAccount) => subAccount.name === "1150-Trade Debtors  Control Account"
      ) || [];
  } else {
      // Return all sub-accounts, excluding those with account_type "50-Expenses" and parent_account above 5000
      return coa.flatMap((account) =>
          account.sub_account_details?.filter((subAccount) => {
              const parentAccountNumber = getParentAccountNumber(subAccount.parent_account);
              return (
                  subAccount.account_type !== "50-Expenses" && 
                  (parentAccountNumber === null || parentAccountNumber <= 5000)
              );
          }) || []
      );
  }
};



  return (
    <div>
      <h1>Cash Receipt Journal</h1>
      {error && <p className="error">{error}</p>}
      <button onClick={openFormPopup}>Add New Receipt</button>

      {showForm && (
        <div className="form-popup">
          <div className="form-container">
            <h2>{isEditing ? "Edit Receipt" : "Add New Receipt"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Receipt Date:
                <input
                  type="date"
                  name="receipt_date"
                  value={formData.receipt_date}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                Receipt No:
                <input
                  type="text"
                  name="receipt_no"
                  value={formData.receipt_no}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                Reference No:
                <input
                  type="text"
                  name="ref_no"
                  value={formData.ref_no}
                  onChange={handleInputChange}
                />
              </label>

              <select
  name="from_whom_received"
  value={formData.from_whom_received}
  onChange={(e) => {
    handleInputChange(e);
    handleCustomerChange(e);
  }}
  required
>
  <option value="">Select Customer</option>
  {customers.map((customer) => (
    <option key={customer.id} value={customer.name}>
      {customer.name}
    </option>
  ))}
</select>

  {/* Invoice Amount Field */}
  <label>
  Invoice Amount:
  <input
    type="number"
    name="invoice_amount"
    value={invoiceAmount}
    readOnly
  />
</label>

<label>
  Balance:
  <input
    type="number"
    name="balance"
    value={balance}
    readOnly
  />
</label>
  {/* Rest of the form fields */}
  <label>
                Description:
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </label>

              <label>
                Receipt Type:
                <select
                  name="receipt_type"
                  value={formData.receipt_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Receipt Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Invoiced">Invoiced</option>
                </select>
              </label>

              <label>
                Account Debited:
                <select
                  name="account_debited"
                  value={formData.account_debited}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Account Debited</option>
                  {getDebitAccounts().map((subAccount) => (
                    <option key={subAccount.id} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Account Credited:
                <select
                  name="account_credited"
                  value={formData.account_credited}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Account Credited</option>
                  {getCreditAccounts().map((subAccount) => (
                    <option key={subAccount.id} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Cash:
                <input
                  type="number"
                  name="cash"
                  value={formData.cash}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </label>
              <label>
                Bank:
                <input
                  type="number"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </label>
              <label>
                Total:
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  readOnly
                />
              </label>

              <label>
                Cashbook:
                <input
                  type="text"
                  name="cashbook"
                  value={formData.cashbook}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <button type="submit">
                {isEditing ? "Update" : "Submit"}
              </button>

              <button type="button" onClick={closeFormPopup}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

<div>
          <p>Invoice Amount: {invoiceAmount}</p>
          <p>Balance: {balance}</p>
        </div>

      <table>
        <thead>
          <tr>
            <th>Receipt Date</th>
            <th>Receipt No</th>
            <th>Reference No</th>
            <th>From Whom Received</th>
            <th>Description</th>
            <th>Receipt Type</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Cash</th>
            <th>Bank</th>
            <th>Total</th>
            <th>Cashbook</th>
          </tr>
        </thead>
        <tbody>
          {journals.map((journal) => (
            <tr key={journal.id}>
              <td>{journal.receipt_date}</td>
              <td>{journal.receipt_no}</td>
              <td>{journal.ref_no}</td>
              <td>{journal.from_whom_received}</td>
              <td>{journal.description}</td>
              <td>{journal.receipt_type}</td>
              <td>{journal.account_debited}</td>
              <td>{journal.account_credited}</td>
              <td>{journal.cash}</td>
              <td>{journal.bank}</td>
              <td>{journal.total}</td>
              <td>{journal.cashbook}</td>
              <td>
                <button onClick={() => openFormPopup(journal)}>Edit</button>
                <button onClick={() => handleDelete(journal.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashReceiptJournalTable;