import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Ensure this file exists for styling
import { FaEdit, FaTrash } from "react-icons/fa"; // Import icons

const InvoiceReceived = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDebited, setAccountDebited] = useState("");
  const [accountCredited, setAccountCredited] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [payeeName, setPayeeName] = useState("");

  // State to manage the invoices, form visibility, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State for payee and chart of accounts data
  const [payees, setPayees] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  // State to manage editing invoices
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Fetch invoices and other data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchPayees();
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

  // Function to fetch payee data for the "Payee Name" select
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

        // Find the "2250-Trade Creditors Control Account" from the fetched chart of accounts
        const tradeCreditorsAccount = data.find(
          (account) =>
            account.sub_account_details &&
            account.sub_account_details.some(
              (subAccount) => subAccount.name === "2250-Trade Creditors Control Account"
            )
        );

        if (tradeCreditorsAccount) {
          const subAccount = tradeCreditorsAccount.sub_account_details.find(
            (subAccount) => subAccount.name === "2250-Trade Creditors Control Account"
          );
          setAccountCredited(subAccount.name); // Set the account credited to the found account name
        } else {
          setError("2250-Trade Creditors Control Account not found in COA");
        }
      } else {
        setError("Error fetching chart of accounts");
      }
    } catch (error) {
      setError("Error fetching chart of accounts");
    }
  };

  // Handle change of selected payee and update related sub-accounts for "Account Debited"
  const handlePayeeChange = (e) => {
    const selectedPayeeName = e.target.value;
    setPayeeName(selectedPayeeName);
    setAccountDebited("");
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
      name: payeeName,
    };

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/invoice-received/${editingInvoice ? editingInvoice : ''}`,
        {
          method: editingInvoice ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newInvoice),
        }
      );

      if (response.ok) {
        fetchInvoices();
        resetForm();
        setEditingInvoice(null);
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error submitting invoice");
      }
    } catch (error) {
      setError("Error submitting invoice");
    }
  };

  // Function to reset form fields
  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAmount("");
    setAccountDebited("");
    setGrnNumber("");
    setPayeeName("");
  };

  // Get all sub_account_details from payees and chartOfAccounts and merge them
  const getSubAccountNames = () => {
    const payeeSubAccounts = payees.flatMap((payee) =>
      payee.sub_account_details.map((subAccount) => subAccount.name)
    );

    const coaSubAccounts = chartOfAccounts
      .filter((account) => account.account_type !== "40-Revenue")
      .flatMap((account) =>
        account.sub_account_details ? account.sub_account_details.map((subAccount) => subAccount.name) : []
      );

    return [...new Set([...payeeSubAccounts, ...coaSubAccounts])];
  };

  // Function to handle editing an invoice
  const handleEdit = (invoice) => {
    setInvoiceNumber(invoice.invoice_number);
    setDateIssued(invoice.date_issued);
    setDescription(invoice.description);
    setAmount(invoice.amount);
    setAccountDebited(invoice.account_debited);
    setGrnNumber(invoice.grn_number);
    setPayeeName(invoice.name);
    setEditingInvoice(invoice.id);
    setShowForm(true);
  };

  // Function to handle deleting an invoice
  const handleDelete = async (invoiceId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/invoice-received/${invoiceId}`, {
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

  return (
    <div className="invoice-received">
      <h1 className="head">Invoice Received</h1>

      {/* Toggle to show/hide the form */}
      <button 
  onClick={() => setShowForm(true)} 
  style={{ 
    backgroundColor: '#FFA500', 
    color: 'white', 
    padding: '10px 20px', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer'
  }}
>
  Add New Invoice
</button>

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

              {/* Payee Name Selection */}
              <div>
                <label>Payee Name:</label>
                <select
                  value={payeeName}
                  onChange={handlePayeeChange}
                  required
                >
                  <option value="">Select Payee</option>
                  {payees.flatMap((payee) =>
                    payee.sub_account_details.map((subAccount) => (
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
                <select
                  value={accountDebited}
                  onChange={(e) => setAccountDebited(e.target.value)}
                  required
                >
                  <option value="">Select Debited Account</option>
                  {getSubAccountNames().map((subAccountName) => (
                    <option key={subAccountName} value={subAccountName}>
                      {subAccountName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Credited Selection */}
              <div>
                <label>Account Credited:</label>
                <input
                  type="text"
                  value={accountCredited}
                  disabled
                />
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
                {loading ? "Submitting..." : editingInvoice ? "Update Invoice" : "Submit Invoice"}
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
              <th>Payee Name</th>
              <th>GRN Number</th>
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
                  <td>{invoice.grn_number}</td>
                  <td>
                    <button onClick={() => handleEdit(invoice)}><FaEdit /></button>
                    <button onClick={() => handleDelete(invoice.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceReceived;