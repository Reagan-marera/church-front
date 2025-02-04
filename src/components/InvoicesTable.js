import React, { useState, useEffect } from "react";
import "./InvoicesTable.css"; // Ensure this file exists for styling

const InvoiceIssued = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountDebited, setAccountDebited] = useState(""); // Set dynamically from COA
  const [accountCredited, setAccountCredited] = useState("");
  const [customerName, setCustomerName] = useState(""); // State for storing customer name separately

  // State to manage the invoices, form visibility, loading, and errors
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        // Find the "1150-Trade Debtors  Control Account" from the fetched chart of accounts
        const tradeDebtorsAccount = data.find(account =>
          account.sub_account_details &&
          account.sub_account_details.some(subAccount => subAccount.name === "1150-Trade Debtors  Control Account")
        );

        if (tradeDebtorsAccount) {
          const subAccount = tradeDebtorsAccount.sub_account_details.find(
            subAccount => subAccount.name === "1150-Trade Debtors  Control Account"
          );
          setAccountDebited(subAccount.name); // Set the account debited to the found account name
        } else {
          setError("1150-Trade Debtors  Control Account not found in COA");
        }
      } else {
        setError("Error fetching chart of accounts");
      }
    } catch (error) {
      setError("Error fetching chart of accounts");
    }
  };

  // Helper function to get the name of a sub-account by its ID
  const getSubAccountNameById = (id) => {
    const allSubAccounts = [...customers, ...chartOfAccounts].flatMap(item =>
      item.sub_account_details || []
    );
    const subAccount = allSubAccounts.find(subAccount => subAccount.id === id);
    return subAccount ? subAccount.name : "Unknown";
  };

  // Helper function to get the customer name by sub-account ID
  const getCustomerNameBySubAccountId = (id) => {
    const customer = customers.find(customer =>
      customer.sub_account_details.some(subAccount => subAccount.id === id)
    );
    return customer ? customer.name : "Unknown";
  };

  // Function to get all sub-account names for the "Account Credited" dropdown
  const getSubAccountNames = () => {
    // Filter sub-accounts where the parent account has account_type "40-Revenue"
    const revenueSubAccounts = chartOfAccounts
      .filter(account => account.account_type === "40-Revenue")
      .flatMap(account => account.sub_account_details || []);

    return revenueSubAccounts.map(subAccount => subAccount.name);
  };

  // Handle change of selected customer and update related sub-accounts for "Account Debited"
  const handleCustomerChange = (e) => {
    const selectedCustomerName = e.target.value;
    setCustomerName(selectedCustomerName); // Set the selected customer name
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
      account_debited: accountDebited, // Dynamically set account debited from COA
      account_credited: accountCredited,
      name: customerName, // Use the customer name separately
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newInvoice),
      });

      if (response.ok) {
        fetchInvoices(); 
        resetForm(); 
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error creating invoice");
      }
    } catch (error) {
      setError("Error creating invoice");
    }
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAmount("");
    setAccountCredited("");
    setCustomerName(""); 
  };

  return (
    <div className="invoice-received">
      <h1>Invoice Issued</h1>

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

          {/* Customer Name Selection */}
          <div>
            <label>Customer Name:</label>
            <select
              value={customerName}
              onChange={handleCustomerChange} // Handle change to select a customer
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
              disabled // Disable the input field
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
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date Issued</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Account Debited</th>
              <th>Account Credited</th>
              <th>Customer Name</th>
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
                  <td>{getSubAccountNameById(invoice.account_debited)}</td>
                  <td>{getSubAccountNameById(invoice.account_credited)}</td>
                  <td>{getCustomerNameBySubAccountId(invoice.name)}</td>
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

export default InvoiceIssued;