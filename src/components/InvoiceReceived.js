import React, { useState, useEffect } from "react";
import "./InvoiceReceived.css";

const InvoiceReceived = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDebited, setAccountDebited] = useState("");
  const [accountCredited, setAccountCredited] = useState("");
  const [grnNumber, setGrnNumber] = useState("");

  // State for invoices, form visibility, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State for customer and chart of accounts data
  const [customers, setCustomers] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [payees, setPayees] = useState([]);  // Store payee data for account credited

  // Fetch invoices, customers, and accounts data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchChartOfAccounts();
    fetchPayees();  // Fetch payee data
  }, []);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/invoice-received", {
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

  // Fetch customer data for the "Account Debited" select
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

  // Fetch chart of accounts for the "Account Debited" select
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
      } else {
        setError("Error fetching chart of accounts");
      }
    } catch (error) {
      setError("Error fetching chart of accounts");
    }
  };

  // Fetch payees for the "Account Credited" select
  const fetchPayees = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/payee", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayees(data);
      } else {
        setError("Error fetching payees");
      }
    } catch (error) {
      setError("Error fetching payees");
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    const newInvoice = {
      invoice_number: invoiceNumber,
      date_issued: dateIssued,
      description,
      amount: parseInt(amount),
      account_debited: accountDebited,
      account_credited: accountCredited,
      grn_number: grnNumber,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/invoice-received", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newInvoice),
      });

      if (response.ok) {
        fetchInvoices(); // Refresh the list of invoices
        resetForm(); // Reset the form fields
      } else {
        setError("Error creating invoice");
      }
    } catch (error) {
      setError("Error creating invoice");
    }
  };

  // Function to reset form fields
  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAmount("");
    setAccountDebited("");
    setAccountCredited("");
    setGrnNumber("");
  };

  return (
    <div className="invoice-received">
      <h1>Invoice Received</h1>

      {/* Toggle to show/hide the form */}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Hide Invoice Form" : "Add New Invoice"}
      </button>

      {showForm && (
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
          <div>
            <label>Account Debited:</label>
            <select
              value={accountDebited}
              onChange={(e) => setAccountDebited(e.target.value)}
              required
            >
              <option value="">Select Debited account</option>
              {chartOfAccounts.flatMap((account) =>
                account.sub_account_details.map((subAccount) => (
                  <option key={subAccount.id} value={subAccount.id}>
                    {subAccount.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label>Account Credited:</label>
            <select
              value={accountCredited}
              onChange={(e) => setAccountCredited(e.target.value)}
              required
            >
              <option value="">Select Credited account</option>
              {payees.flatMap((payee) =>
                payee.sub_account_details.map((subAccount) => (
                  <option key={subAccount.id} value={subAccount.id}>
                    {subAccount.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label>GRN Number:</label>
            <input
              type="text"
              value={grnNumber}
              onChange={(e) => setGrnNumber(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Invoice"}
          </button>
        </form>
      )}

      {/* Display any error messages */}
      {error && <div className="error">{error}</div>}

      <h2>Invoices List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date Issued</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Account Debited</th>
              <th>Account Credited</th>
              <th>GRN Number</th>
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
                  <td>{invoice.grn_number}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceReceived;
