import React, { useState, useEffect } from "react";
import "./InvoicesTable.css";

const InvoiceRecieved = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDebited, setAccountDebited] = useState("");
  const [accountCredited, setAccountCredited] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [payeeName, setPayeeName] = useState(""); // State for storing payee name

  // State to manage the invoices, form visibility, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State for payee and chart of accounts data
  const [payees, setPayees] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

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
        const tradeCreditorsAccount = data.find(account =>
          account.sub_account_details &&
          account.sub_account_details.some(subAccount => subAccount.name === "2250-Trade Creditors Control Account")
        );

        if (tradeCreditorsAccount) {
          const subAccount = tradeCreditorsAccount.sub_account_details.find(
            subAccount => subAccount.name === "2250-Trade Creditors Control Account"
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
    setPayeeName(selectedPayeeName); // Set the selected payee name
    setAccountDebited(""); // Reset the account debited field
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
      date_issued: dateIssued, // Date should be in ISO format (YYYY-MM-DD)
      description,
      amount: parseInt(amount),
      account_debited: accountDebited,
      account_credited: accountCredited, // Automatically set to "2250-Trade Creditors Control Account"
      grn_number: grnNumber,
      name: payeeName, // Use the payee name separately
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
        const errorData = await response.json();
        setError(errorData.error || "Error creating invoice");
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
    setGrnNumber("");
    setPayeeName(""); // Reset the payee name field
  };

  // Get all sub_account_details from payees and chartOfAccounts and merge them
  const getSubAccountNames = () => {
    const payeeSubAccounts = payees.flatMap(payee =>
      payee.sub_account_details.map(subAccount => subAccount.name)
    );

    const coaSubAccounts = chartOfAccounts
      .filter(account => account.account_type !== "40-Revenue") // Exclude accounts with account_type "40-Revenue"
      .flatMap(account =>
        account.sub_account_details ? account.sub_account_details.map(subAccount => subAccount.name) : []
      );

    // Combine both payee and COA sub account names
    return [...new Set([...payeeSubAccounts, ...coaSubAccounts])];
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

          {/* Payee Name Selection */}
          <div>
            <label>Payee Name:</label>
            <select
              value={payeeName}
              onChange={handlePayeeChange} // Handle change to select a payee
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
              disabled // Disable the input field
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
              <th>Payee Name</th>
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
                  <td>{invoice.name}</td> {/* Display the payee name */}
                  <td>{invoice.grn_number}</td>
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

export default InvoiceRecieved;