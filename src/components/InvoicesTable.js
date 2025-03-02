import React, { useState, useEffect } from "react";
import Select from "react-select"; // Import react-select
import "./InvoicesTable.css"; // Ensure this file exists for styling
import { FaEdit, FaTrash, FaPrint, FaCheck } from "react-icons/fa"; // Import icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faMoneyBill,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

const InvoiceIssued = () => {
  // State for storing form fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountDebited, setAccountDebited] = useState("");
  const [accountsCredited, setAccountsCredited] = useState([]);
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
  const [allCustomers, setAllCustomers] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#e2e8f0" : "white", // Background color on hover
      color: state.isSelected ? "#4a5568" : "black", // Text color for selected option
      padding: "10px",
      fontWeight: state.inputValue && state.label.toLowerCase().includes(state.inputValue.toLowerCase()) ? "bold" : "normal", // Bold matching options
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
        setCustomers(data); // Set detailed customer data (one customer)
  
        // Extract all customer account names (all customers)
        const allCustomersList = data.map((customer) => customer.account_name);
        setAllCustomers(allCustomersList);
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
              (subAccount) => subAccount.name === "1150- Trade Debtors Control Account"
            )
        );

        if (tradeDebtorsAccount) {
          const subAccount = tradeDebtorsAccount.sub_account_details.find(
            (subAccount) => subAccount.name === "1150- Trade Debtors Control Account"
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

  // Function to generate a unique invoice number
  const generateUniqueInvoiceNumber = (existingInvoices) => {
    let newInvoiceNumber;
    do {
      newInvoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    } while (existingInvoices.some((invoice) => invoice.invoice_number === newInvoiceNumber));
    return newInvoiceNumber;
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

    const selectedCustomer = customers.find((customer) => customer.account_name === customerName);

    if (!selectedCustomer) {
      setError("Selected customer not found.");
      return;
    }

    const subAccounts = selectedCustomer.sub_account_details || [];

    for (const subAccount of subAccounts) {
      const uniqueInvoiceNumber = generateUniqueInvoiceNumber(invoices);

      const payload = {
        invoice_number: uniqueInvoiceNumber,
        date_issued: dateIssued,
        description,
        amount: totalAmount,
        account_debited: accountDebited,
        account_credited: accountsCredited.map(account => ({
          name: account.value,
          amount: account.amount
        })),
        name: subAccount.name,
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
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    fetchInvoices();
    resetForm();
    setError("");
    setShowForm(false);
    if (isEditing) {
      setIsEditing(false);
      setEditingInvoiceId(null);
    }
  };

  // Function to handle updating an invoice
  const handleUpdate = (invoice) => {
    setInvoiceNumber(invoice.invoice_number);
    setDateIssued(invoice.date_issued);
    setDescription(invoice.description);
    setAccountsCredited(invoice.account_credited.map(account => ({
      value: account.name,
      label: account.name,
      amount: account.amount
    })));
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

  // Function to handle posting an invoice
  const handlePost = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/invoices/${id}/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error posting invoice");
      }
    } catch (error) {
      setError("Error posting invoice");
    }
  };

  // Function to reset the form fields
  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAccountsCredited([]);
    setCustomerName("");
    setTotalAmount(0);
  };

  // Function to get all sub-account names for the "Account Credited" dropdown
  const getSubAccountNames = () => {
    const revenueSubAccounts = chartOfAccounts
      .filter((account) =>
        account.account_type === "40-Revenue" || account.account_type === "10-assets"
      )
      .flatMap((account) => account.sub_account_details || []);

    return revenueSubAccounts.map((subAccount) => subAccount.name);
  };

  // Prepare customer options for react-select
  const customerOptions = customers.flatMap((customer) =>
    customer.sub_account_details.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    }))
  );

  // Prepare all customers options for react-select
  const allCustomersOptions = allCustomers.map((accountName) => ({
    value: accountName,
    label: accountName,
  }));

  // Prepare credited account options for react-select
  const creditedAccountOptions = getSubAccountNames().map((subAccountName) => ({
    value: subAccountName,
    label: subAccountName,
  }));

  // Handle adding a new credited account
  const handleAddCreditedAccount = () => {
    setAccountsCredited([...accountsCredited, { value: "", label: "", amount: 0 }]);
  };

  // Handle removing a credited account
  const handleRemoveCreditedAccount = (index) => {
    setAccountsCredited(accountsCredited.filter((_, i) => i !== index));
  };

  // Handle changes to credited accounts
  const handleCreditedAccountChange = (index, value, amount) => {
    const updatedAccounts = [...accountsCredited];
    updatedAccounts[index] = { value, label: value, amount: parseFloat(amount) };
    setAccountsCredited(updatedAccounts);

    // Update total amount
    const newTotalAmount = updatedAccounts.reduce((sum, account) => sum + account.amount, 0);
    setTotalAmount(newTotalAmount);
  };

  // Function to handle printing an invoice
  const handlePrint = (invoice) => {
    const printContents = `
      <style>
        body { font-family: Arial, sans-serif; }
        h2 { text-align: center; }
        .invoice-details { border-collapse: collapse; width: 100%; }
        .invoice-details th, .invoice-details td { border: 1px solid #ddd; padding: 8px; }
        .invoice-details th { background-color: #f2f2f2; }
      </style>
      <h2>Invoice Details</h2>
      <table class="invoice-details">
        <tr><th>Invoice Number</th><td>${invoice.invoice_number}</td></tr>
        <tr><th>Date Issued</th><td>${invoice.date_issued}</td></tr>
        <tr><th>Description</th><td>${invoice.description}</td></tr>
        <tr><th>Total Amount</th><td>${invoice.amount}</td></tr>
        <tr><th>Customer Name</th><td>${invoice.name}</td></tr>
        <tr><th>Fees Vote Heads</th><td>
          ${invoice.account_credited.map(account => `<div>${account.name}: ${account.amount}</div>`).join('')}
        </td></tr>
      </table>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="invoice-issued">
      <h1 className="head">
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="icon" /> Invoice Issued
      </h1>

      {/* Toggle to show/hide the form */}
      <button className="invoice-issued button" onClick={() => setShowForm(true)}>
        Add New Invoice
      </button>

      {/* Modal for the form */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <button className="close" onClick={() => { setShowForm(false); resetForm(); }}>
              &times;
            </button>
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
                <label>Total Amount:</label>
                <input
                  type="number"
                  value={totalAmount}
                  readOnly
                  className="form-input"
                />
              </div>

              {/* Customer Name Selection */}
              <div>
                <label>Customer Name:</label>
                <Select
                  value={customerOptions.find(
                    (option) => option.value === customerName
                  )}
                  onChange={(selectedOption) =>
                    setCustomerName(selectedOption.value)
                  }
                  options={customerOptions}
                  placeholder="Select Customer"
                  isSearchable
                  styles={customStyles}
                />
              </div>

              {/* All Customers Selection */}
              <div>
                <label>All Customers:</label>
                <Select
                  value={allCustomersOptions.find(
                    (option) => option.value === customerName
                  )}
                  onChange={(selectedOption) =>
                    setCustomerName(selectedOption.value)
                  }
                  options={allCustomersOptions}
                  placeholder="Select All Customers"
                  isSearchable
                  styles={customStyles}
                />
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
                {accountsCredited.map((account, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center" }}>
                    <Select
                      value={creditedAccountOptions.find(
                        (option) => option.value === account.value
                      )}
                      onChange={(selectedOption) =>
                        handleCreditedAccountChange(index, selectedOption.value, account.amount)
                      }
                      options={creditedAccountOptions}
                      placeholder="Select Credited Account"
                      isSearchable
                      styles={customStyles}
                    />
                    <input
                      type="number"
                      value={account.amount}
                      onChange={(e) =>
                        handleCreditedAccountChange(index, account.value, e.target.value)
                      }
                      placeholder="Amount"
                      style={{ marginLeft: "10px" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCreditedAccount(index)}
                      style={{ marginLeft: "10px" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleAddCreditedAccount}>
                  Add Another Account
                </button>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : isEditing ? "Update Invoice" : "Submit Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Display error messages */}
      {error && <p className="error">{error}</p>}

      {/* Display invoices in a table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Date Issued</th>
            <th>Description</th>
            <th>Total Amount</th>
            <th>Customer Name</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.date_issued}</td>
              <td>{invoice.description}</td>
              <td>{invoice.amount}</td>
              <td>{invoice.name}</td>
              <td>{invoice.account_debited}</td>
              <td>
                {invoice.account_credited.map((account, index) => (
                  <div key={index}>
                    {account.name}: {account.amount}
                  </div>
                ))}
              </td>
              <td>
                <button onClick={() => handleUpdate(invoice)}>
                  <FaEdit /> Edit
                </button>
                <button onClick={() => handleDelete(invoice.id)}>
                  <FaTrash /> Delete
                </button>
                <button onClick={() => handlePost(invoice.id)}>
                  <FaCheck /> Post
                </button>
                <button onClick={() => handlePrint(invoice)}>
                  <FaPrint /> Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceIssued;
