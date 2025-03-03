import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faPlus,
  faEdit,
  faTrash,
  faCalendar,
  faFileAlt,
  faUser,
  faDollarSign,
  faWallet,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
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
    accounts_credited: {},
    total: 0,
    cashbook: "",
    selectedInvoice: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#e2e8f0" : "white",
      color: state.isSelected ? "#4a5568" : "black",
      padding: "10px",
      fontWeight:
        state.inputValue && state.label.toLowerCase().includes(state.inputValue.toLowerCase())
          ? "bold"
          : "normal",
    }),
    control: (provided) => ({
      ...provided,
      border: "1px solid #cbd5e0",
      borderRadius: "4px",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#a0aec0",
      },
    }),
  };

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

  const handleCustomerChange = (selectedOption) => {
    const selectedCustomerName = selectedOption.value;
    setCustomerName(selectedCustomerName);

    const customerInvoices = invoices.filter(
      (invoice) => invoice.name === selectedCustomerName
    );

    const totalAmount = customerInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount),
      0
    );
    setInvoiceAmount(totalAmount);

    const customerReceipts = journals.filter(
      (journal) => journal.from_whom_received === selectedCustomerName
    );

    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0
    );

    const customerBalance = totalAmount - totalReceipts;
    setBalance(customerBalance);

    setFormData((prev) => ({
      ...prev,
      from_whom_received: selectedCustomerName,
    }));
  };

  const handleInvoiceChange = (selectedOption) => {
    const selectedInvoice = invoices.find(
      (invoice) => invoice.invoice_number === selectedOption.value
    );

    const accountsCredited = {};
    selectedInvoice.account_credited.forEach((account) => {
      accountsCredited[account.name] = 0; // Initialize amounts to 0
    });

    setFormData((prev) => ({
      ...prev,
      selectedInvoice: selectedInvoice,
      accounts_credited: accountsCredited,
      total: selectedInvoice.amount,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("account_")) {
      const accountName = name.replace("account_", "");
      const accountsCredited = { ...formData.accounts_credited };
      accountsCredited[accountName] = parseFloat(value) || 0;

      const totalAllocated = Object.values(accountsCredited).reduce(
        (sum, amount) => sum + amount,
        0
      );

      setFormData((prev) => ({
        ...prev,
        accounts_credited: accountsCredited,
        total: totalAllocated,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAllocated = Object.values(formData.accounts_credited).reduce(
      (sum, amount) => sum + amount,
      0
    );

    if (totalAllocated !== parseFloat(formData.total)) {
      setError("The total allocated amount must match the invoice amount.");
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
      accounts_credited: formData.accounts_credited,
      total: formData.total,
      cashbook: formData.cashbook,
    };

    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/cash-receipt-journals/${editingData.id}`
        : "http://127.0.0.1:5000/cash-receipt-journals";
      const method = isEditing ? "PUT" : "POST";

      setLoading(true);
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
    } finally {
      setLoading(false);
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
      const response = await fetch(`http://127.0.0.1:5000/cash-receipt-journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openFormPopup = (journal = null) => {
    if (journal) {
      setIsEditing(true);
      setEditingData(journal);

      const accountsCredited = {};
      journal.accounts_credited.forEach((account) => {
        accountsCredited[account.name] = parseFloat(account.amount) || 0;
      });

      setFormData({
        receipt_date: journal.receipt_date,
        receipt_no: journal.receipt_no,
        ref_no: journal.ref_no,
        from_whom_received: journal.from_whom_received,
        description: journal.description,
        receipt_type: journal.receipt_type,
        accounts_credited: accountsCredited,
        total: journal.total,
        cashbook: journal.cashbook,
        selectedInvoice: null,
      });
    } else {
      setIsEditing(false);
      setEditingData(null);
      setFormData({
        receipt_date: "",
        receipt_no: "",
        ref_no: "",
        from_whom_received: "",
        description: "",
        receipt_type: "",
        accounts_credited: {},
        total: 0,
        cashbook: "",
        selectedInvoice: null,
      });
    }
    setShowForm(true);
  };

  const closeFormPopup = () => {
    setShowForm(false);
    setFormData({});
    setError("");
    setIsEditing(false);
    setEditingData(null);
  };

  const printReceipt = (journal) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Cash Receipt Journal - Print</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 0;
              line-height: 1.6;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h1 {
              text-align: center;
              font-size: 24px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .accounts-list {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
            }
            .accounts-list p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <h1>Cash Receipt Journal</h1>
            <table>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Receipt Date</td>
                <td>${journal.receipt_date || "N/A"}</td>
              </tr>
              <tr>
                <td>Receipt No</td>
                <td>${journal.receipt_no || "N/A"}</td>
              </tr>
              <tr>
                <td>Reference No</td>
                <td>${journal.ref_no || "N/A"}</td>
              </tr>
              <tr>
                <td>From Whom Received</td>
                <td>${journal.from_whom_received || "N/A"}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>${journal.description || "N/A"}</td>
              </tr>
              <tr>
                <td>Receipt Type</td>
                <td>${journal.receipt_type || "N/A"}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>${journal.total || "N/A"}</td>
              </tr>
              <tr>
                <td>Cashbook</td>
                <td>${journal.cashbook || "N/A"}</td>
              </tr>
            </table>
  
            <div class="accounts-list">
              <h3>Accounts Credited:</h3>
              ${journal.accounts_credited
                ? Object.entries(journal.accounts_credited)
                    .map(([account, amount]) => `<p>${account}: ${amount}</p>`)
                    .join("")
                : "<p>No accounts credited.</p>"}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const customerOptions = customers.map((customer) => ({
    value: customer.name,
    label: customer.name,
  }));

  const invoiceOptions = invoices
    .filter((invoice) => invoice.name === customerName)
    .map((invoice) => ({
      value: invoice.invoice_number,
      label: `Invoice ${invoice.invoice_number} - ${invoice.amount}`,
    }));

  return (
    <div>
      <h1>Cash Receipt Journal</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={() => openFormPopup()}>Add New Receipt</button>

      {showForm && (
        <div className="modal-popup">
          <div className="modal-content">
            <button className="close-button" onClick={closeFormPopup}>
              ×
            </button>
            <h2>{isEditing ? "Edit Receipt" : "Add New Receipt"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Receipt Date:
                <input
                  type="date"
                  name="receipt_date"
                  value={formData.receipt_date}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Receipt No:
                <input
                  type="text"
                  name="receipt_no"
                  value={formData.receipt_no}
                  onChange={handleInputChange}
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
              <label>
                From Whom Received:
                <Select
                  value={customerOptions.find(
                    (option) => option.value === formData.from_whom_received
                  )}
                  onChange={handleCustomerChange}
                  options={customerOptions}
                  placeholder="Select Customer"
                  isSearchable
                  styles={customStyles}
                />
              </label>
              <label>
                Invoice Amount:
                <input
                  type="number"
                  value={invoiceAmount}
                  readOnly
                />
              </label>
              <label>
                Balance:
                <input
                  type="number"
                  value={balance}
                  readOnly
                />
              </label>
              <label>
                Select Invoice:
                <Select
                  value={invoiceOptions.find(
                    (option) => option.value === formData.selectedInvoice?.invoice_number
                  )}
                  onChange={handleInvoiceChange}
                  options={invoiceOptions}
                  placeholder="Select Invoice"
                  isSearchable
                  styles={customStyles}
                />
              </label>
              <label>
                Description:
                <input
                  type="text"
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
                >
                  <option value="">Select Receipt Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Invoiced">Invoiced</option>
                </select>
              </label>

              {/* Display accounts credited in the invoice */}
              {formData.selectedInvoice &&
                Object.keys(formData.accounts_credited).map((accountName) => (
                  <label key={accountName}>
                    {accountName}:
                    <input
                      type="number"
                      name={`account_${accountName}`}
                      value={formData.accounts_credited[accountName]}
                      onChange={handleInputChange}
                    />
                  </label>
                ))}

              <label>
                Total:
                <input
                  type="number"
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
                />
              </label>
              <button type="submit">
                {loading
                  ? "Submitting..."
                  : isEditing
                  ? "Update Receipt"
                  : "Submit Receipt"}
              </button>
              <button type="button" onClick={closeFormPopup}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Receipt Date</th>
            <th>Receipt No</th>
            <th>Reference No</th>
            <th>From Whom Received</th>
            <th>Description</th>
            <th>Receipt Type</th>
            <th>Total</th>
            <th>Cashbook</th>
            <th>Actions</th>
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
              <td>{journal.total}</td>
              <td>{journal.cashbook}</td>
              <td>
                <button onClick={() => openFormPopup(journal)}>Edit</button>
                <button onClick={() => handleDelete(journal.id)}>Delete</button>
                <button onClick={() => printReceipt(journal)}>Print</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashReceiptJournalTable;