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
  
  // State to manage the invoices and form visibility
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Function to fetch invoices from the API
  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage

    if (!token) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/invoice-received", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Send the token in the Authorization header
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setInvoices(data); // Set invoices if the response is an array
      } else {
        console.error("Fetched data is not an array:", data);
        setInvoices([]); // Set empty array in case of invalid response
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Error fetching invoices");
      setInvoices([]); // Set empty array in case of an error
    } finally {
      setLoading(false);
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
          Authorization: `Bearer ${token}`, // Send the token in the Authorization header
        },
        body: JSON.stringify(newInvoice),
      });

      if (response.ok) {
        fetchInvoices(); // Refresh the list of invoices after submitting
        resetForm(); // Reset the form fields
      } else {
        console.error("Error creating invoice:", response.statusText);
        setError("Error creating invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
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

      {/* Show the form to add a new invoice */}
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
            <input
              type="text"
              value={accountDebited}
              onChange={(e) => setAccountDebited(e.target.value)}
            />
          </div>
          <div>
            <label>Account Credited:</label>
            <input
              type="text"
              value={accountCredited}
              onChange={(e) => setAccountCredited(e.target.value)}
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
