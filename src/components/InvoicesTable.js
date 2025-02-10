import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Ensure this file exists for styling

const InvoiceIssued = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDebited, setAccountDebited] = useState("");
  const [accountCredited, setAccountCredited] = useState("");
  const [customerName, setCustomerName] = useState("");

  // State to manage the invoices, form visibility, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  // State for customer and chart of accounts data
  const [customers, setCustomers] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  // Fetch invoices and other data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchChartOfAccounts();
  }, []);

  // Function to fetch invoices from the API
  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/invoices", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Error fetching invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch customer data for the "Customer Name" select
  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/customer", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        setError("Error fetching customers");
      }
    } catch (error) {
      setError("Error fetching customers");
    }
  };

  // Function to fetch chart of accounts for the "Account Debited" and "Account Credited" select
  const fetchChartOfAccounts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/chart-of-accounts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChartOfAccounts(data);

        // Find the "1150-Trade Debtors Control Account" from the fetched chart of accounts
        const tradeDebtorsAccount = data.find(
          (account) =>
            account.sub_account_details &&
            account.sub_account_details.some(
              (subAccount) => subAccount.name === "1150-Trade Debtors  Control Account"
            )
        );

        if (tradeDebtorsAccount) {
          const subAccount = tradeDebtorsAccount.sub_account_details.find(
            (subAccount) => subAccount.name === "1150-Trade Debtors  Control Account"
          );
          setAccountDebited(subAccount.name);
        } else {
          setError("1150-Trade Debtors Control Account not found in COA");
        }
      } else {
        setError("Error fetching chart of accounts");
      }
    } catch (error) {
      setError("Error fetching chart of accounts");
    }
  };

  // Function to handle form submission (POST or PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    // Ensure date is in the correct format (YYYY-MM-DD)
    const isValidDate = (date) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    };

    if (!isValidDate(dateIssued)) {
      setError("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    const payload = {
      invoice_number: invoiceNumber,
      date_issued: dateIssued,
      description,
      amount: parseFloat(amount),
      account_debited: accountDebited,
      account_credited: accountCredited,
      name: customerName,
    };

    try {
      const url = isEditing
        ? `http://127.0.0.1:5000/invoices/${editingInvoiceId}`
        : "http://127.0.0.1:5000/invoices";
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

      fetchInvoices();
      resetForm();
      setError("");
      setShowForm(false);
      if (isEditing) {
        setIsEditing(false);
        setEditingInvoiceId(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Function to handle updating an invoice
  const handleUpdate = (invoice) => {
    setInvoiceNumber(invoice.invoice_number);
    setDateIssued(invoice.date_issued);
    setDescription(invoice.description);
    setAmount(invoice.amount);
    setAccountCredited(invoice.account_credited);
    setCustomerName(invoice.name);
    setIsEditing(true);
    setEditingInvoiceId(invoice.id);
    setShowForm(true);
  };

  // Function to handle deleting an invoice
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/invoices/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error deleting invoice");
      }
    } catch (error) {
      setError("Error deleting invoice");
    }
  };

  // Function to reset the form fields
  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAmount("");
    setAccountCredited("");
    setCustomerName("");
  };

  // Function to get all sub-account names for the "Account Credited" dropdown
  const getSubAccountNames = () => {
    const revenueSubAccounts = chartOfAccounts
      .filter((account) => account.account_type === "40-Revenue")
      .flatMap((account) => account.sub_account_details || []);

    return revenueSubAccounts.map((subAccount) => subAccount.name);
  };

  // Handle change of selected customer and update related sub-accounts for "Account Debited"
  const handleCustomerChange = (e) => {
    const selectedCustomerName = e.target.value;
    setCustomerName(selectedCustomerName);
  };

  return (
    <div className="invoice-issued">
      <h1>Invoice Issued</h1>

      {/* Toggle to show/hide the form */}
      < button className ="invoice-issued button" onClick={() => setShowForm(true)}>Add New Invoice</button>

      {/* Modal for the form */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowForm(false)}>
              &times;
            </span>
            <form onSubmit={handleSubmit} className="invoice-form">
              <div>
                <label>Invoice Number:</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Date Issued:</label>
                <input
                  type="date"
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Description:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label>Amount:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Customer Name Selection */}
              <div>
                <label>Customer Name:</label>
                <select
                  value={customerName}
                  onChange={handleCustomerChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.flatMap((customer) =>
                    customer.sub_account_details.map((subAccount) => (
                      <option key={subAccount.id} value={subAccount.name}>
                        {subAccount.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Account Debited Selection */}
              <div>
                <label>Account Debited:</label>
                <input
                  type="text"
                  value={accountDebited}
                  disabled
                />
              </div>

              {/* Account Credited Selection */}
              <div>
                <label>Account Credited:</label>
                <select
                  value={accountCredited}
                  onChange={(e) => setAccountCredited(e.target.value)}
                  required
                >
                  <option value="">Select Credited Account</option>
                  {getSubAccountNames().map((subAccountName) => (
                    <option key={subAccountName} value={subAccountName}>
                      {subAccountName}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : isEditing ? "Update Invoice" : "Submit Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Display any error messages */}
      {error && <div className="error">{error}</div>}

      <h2>Invoices List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="compact-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date Issued</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Account Debited</th>
              <th>Account Credited</th>
              <th>Customer Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.date_issued}</td>
                  <td>{invoice.description}</td>
                  <td>{invoice.amount}</td>
                  <td>{invoice.account_debited}</td>
                  <td>{invoice.account_credited}</td>
                  <td>{invoice.name}</td>
                  <td>
                    <button onClick={() => handleUpdate(invoice)}>Update</button>
                    <button onClick={() => handleDelete(invoice.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceIssued;