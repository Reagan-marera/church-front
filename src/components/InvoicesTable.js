import React, { useState, useEffect } from "react";
import Select from "react-select";
import "./InvoicesTable.css";
import { FaEdit, FaTrash, FaPrint, FaSearch } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from 'xlsx';

const InvoiceIssued = () => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountDebited, setAccountDebited] = useState("");
  const [accountsCredited, setAccountsCredited] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [allCustomersSelected, setAllCustomersSelected] = useState([]);
  const [manualNumber, setManualNumber] = useState("");
  const [parentAccount, setParentAccount] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const api = 'https://backend.youmingtechnologies.co.ke';

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#e2e8f0" : "white",
      color: state.isSelected ? "#4a5568" : "black",
      padding: "10px",
      fontWeight: state.inputValue && state.label.toLowerCase().includes(state.inputValue.toLowerCase()) ? "bold" : "normal",
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
    fetchInvoices();
    fetchCustomers();
    fetchChartOfAccounts();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api}/invoices`, {
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

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/customer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);

        const allCustomersList = data.map((customer) => customer.account_name);
        setAllCustomers(allCustomersList);
      } else {
        setError("Error fetching customers");
      }
    } catch (error) {
      setError("Error fetching customers");
    }
  };

  const fetchChartOfAccounts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/chart-of-accounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChartOfAccounts(data);

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

  const generateUniqueInvoiceNumber = () => {
    let currentCounter = parseInt(localStorage.getItem('invoice_counter'), 10) || 0;
    currentCounter += 1;
    localStorage.setItem('invoice_counter', currentCounter);
    return `INV-${currentCounter}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    const isValidDate = (date) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    };
    if (!isValidDate(dateIssued)) {
      setError("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    let customersToProcess = [];
    if (selectedCustomer) {
      const selectedCustomerData = customers.find((customer) =>
        customer.sub_account_details.some(subAccount => subAccount.name === selectedCustomer)
      );
      if (!selectedCustomerData) {
        setError("Selected customer not found.");
        return;
      }
      customersToProcess = selectedCustomerData.sub_account_details.filter(subAccount => subAccount.name === selectedCustomer);
    } else if (allCustomersSelected.length > 0) {
      const allCustomersData = customers.filter((customer) =>
        allCustomersSelected.includes(customer.account_name)
      );
      if (allCustomersData.length === 0) {
        setError("No valid customers found in the selected list.");
        return;
      }
      customersToProcess = allCustomersData.flatMap((customer) => customer.sub_account_details || []);
    } else {
      setError("Please select a customer or a list of customers.");
      return;
    }

    const sumOfCreditedAmounts = accountsCredited.reduce((sum, account) => sum + account.amount, 0);
    if (sumOfCreditedAmounts !== totalAmount) {
      setError("The sum of credited amounts must equal the total amount.");
      return;
    }

    for (const subAccount of customersToProcess) {
      const uniqueInvoiceNumber = generateUniqueInvoiceNumber();
      const payload = {
        invoice_number: uniqueInvoiceNumber,
        date_issued: dateIssued,
        description,
        amount: totalAmount,
        account_debited: accountDebited,
        account_credited: accountsCredited.map(account => ({
          name: account.value,
          amount: account.amount,
        })),
        name: subAccount.name,
        manual_number: manualNumber || null,
        parent_account: parentAccount,
      };
      try {
        const url = isEditing
          ? `${api}/invoices/${editingInvoiceId}`
          : `${api}/invoices`;
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

  const handleUpdate = (invoice) => {
    setDateIssued(invoice.date_issued);
    setDescription(invoice.description);
    setAccountsCredited(invoice.account_credited.map(account => ({
      value: account.name,
      label: account.name,
      amount: account.amount || 0,
    })));
    setSelectedCustomer(invoice.name);
    setManualNumber(invoice.manual_number || "");
    setParentAccount(invoice.parent_account || "");
    setTotalAmount(invoice.amount || 0);
    setIsEditing(true);
    setEditingInvoiceId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/invoices/${id}`, {
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

  const handleDeleteAll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }
  
    setIsDeleting(true); // Set deleting state to true
    setError(""); // Clear any previous errors
  
    try {
      // Use Promise.all to delete invoices in parallel
      await Promise.all(
        invoices.map(invoice =>
          fetch(`${api}/invoices/${invoice.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Error deleting invoice with ID ${invoice.id}`);
            }
            return response.json();
          })
        )
      );
  
      fetchInvoices(); // Refresh the list of invoices
    } catch (error) {
      setError("Error deleting invoices: " + error.message);
    } finally {
      setIsDeleting(false); // Reset deleting state
    }
  };
  
  const handlePost = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/invoices/${id}/post`, {
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

  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setAccountsCredited([]);
    setSelectedCustomer("");
    setAllCustomersSelected([]);
    setTotalAmount(0);
    setManualNumber("");
    setParentAccount("");
  };

  const getSubAccountNames = () => {
    const revenueSubAccounts = chartOfAccounts
      .filter((account) =>
        account.account_type === "40-Revenue" || account.account_type === "10-Assets"
      )
      .flatMap((account) => account.sub_account_details || []);

    return revenueSubAccounts.map((subAccount) => subAccount.name);
  };

  const customerOptions = customers.flatMap((customer) =>
    customer.sub_account_details.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    }))
  );

  const allCustomersOptions = allCustomers.map((accountName) => ({
    value: accountName,
    label: accountName,
  }));

  const creditedAccountOptions = getSubAccountNames().map((subAccountName) => ({
    value: subAccountName,
    label: subAccountName,
  }));

  const parentAccountOptions = chartOfAccounts.map((account) => ({
    value: account.parent_account || account.name,
    label: account.parent_account || account.name,
  }));

  const handleAddCreditedAccount = () => {
    setAccountsCredited([...accountsCredited, { value: "", label: "", amount: 0 }]);
  };

  const handleRemoveCreditedAccount = (index) => {
    setAccountsCredited(accountsCredited.filter((_, i) => i !== index));
  };

  const handleCreditedAccountChange = (index, value, amount) => {
    const updatedAccounts = [...accountsCredited];
    updatedAccounts[index] = { value, label: value, amount };
    setAccountsCredited(updatedAccounts);
    const sumOfCreditedAmounts = updatedAccounts.reduce((sum, account) => sum + account.amount, 0);
    setTotalAmount(sumOfCreditedAmounts);
  };

  const handlePrint = (invoice) => {
    const printContents = `
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
        }

        h2 {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: #004b87;
          margin-bottom: 20px;
        }

        .invoice-details {
          border-collapse: collapse;
          width: 100%;
          margin-top: 20px;
        }

        .invoice-details th {
          background-color: #004b87;
          color: #fff;
          font-weight: 600;
          text-align: left;
          padding: 12px;
          text-transform: uppercase;
          border: 2px solid #ddd;
        }

        .invoice-details td {
          text-align: left;
          padding: 12px;
          border: 1px solid #ddd;
        }

        .invoice-details td.number {
          text-align: right;
        }

        .vote-heads {
          margin-top: 20px;
        }

        .vote-heads table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .vote-heads th, .vote-heads td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }

        .vote-heads th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 40px;
        }

        @media print {
          body {
            margin: 0;
            padding: 10mm;
          }

          h2 {
            font-size: 28px;
            margin-bottom: 10px;
          }

          .invoice-details th, .invoice-details td {
            font-size: 14px;
          }

          .footer {
            font-size: 10px;
          }

          @page {
            size: landscape;
          }
        }
      </style>

      <h2>Invoice Details</h2>

      <table class="invoice-details">
        <tr><th>Invoice Number</th><td>${invoice.invoice_number}</td></tr>
        <tr><th>Date Issued</th><td>${invoice.date_issued}</td></tr>
        <tr><th>Customer Name</th><td>${invoice.name}</td></tr>
        <tr><th>Description</th><td>${invoice.description}</td></tr>
        <tr><th>Total Amount</th><td class="number">${formatFinancialValue(invoice.amount)}</td></tr>
        <tr><th>Parent Account</th><td>${invoice.parent_account}</td></tr>
      </table>

      <div class="vote-heads">
        <h3>Vote Heads</h3>
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.account_credited.map(account => `
              <tr>
                <td>${account.name}</td>
                <td>${formatFinancialValue(account.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Generated by Your Company</p>
        <p>For inquiries, contact us at: info@company.com</p>
      </div>
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

  const formatFinancialValue = (value) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(numericValue);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleExportToExcel = () => {
    const dataForExcel = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Date Issued': invoice.date_issued,
      'Customer Name': invoice.name,
      'Description': invoice.description,
      'Total Amount': invoice.amount,
      'Parent Account': invoice.parent_account,
      'Account Debited': invoice.account_debited,
      'Account Credited': invoice.account_credited.map(account => `${account.name} (${formatFinancialValue(account.amount)})`).join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    XLSX.writeFile(wb, 'Invoices.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        const invoicesToUpload = [];
        let invoiceCounter = 1;

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 9 || row.every(cell => cell === '')) continue;

          let amount = 0;
          try {
            const amountStr = String(row[8] || '0').trim();
            const cleanedAmountStr = amountStr.replace(/[^\d.-]/g, '').replace(/,/g, '');
            amount = parseFloat(cleanedAmountStr) || 0;
          } catch (e) {
            console.warn(`Failed to parse amount in row ${i}: ${row[8]}`);
            continue;
          }

          const invoiceNumber = `UP-${invoiceCounter++}`;

          let paymentDate;
          const dateValue = row[1];
          try {
            if (dateValue) {
              if (typeof dateValue === 'number') {
                const dateObj = XLSX.SSF.parse_date_code(dateValue);
                paymentDate = new Date(dateObj.y, dateObj.m - 1, dateObj.d);
              } else if (typeof dateValue === 'string' && dateValue.includes('/')) {
                const [day, month, year] = dateValue.split('/').map(Number);
                paymentDate = new Date(year, month - 1, day);
              }
              if (!(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
                throw new Error('Invalid date');
              }
            } else {
              throw new Error('Date value is empty');
            }
          } catch (e) {
            console.warn(`Invalid date in row ${i}: ${dateValue}. Using today's date.`);
            paymentDate = new Date();
          }

          invoicesToUpload.push({
            invoice_number: invoiceNumber,
            date_issued: paymentDate.toISOString().split('T')[0],
            amount: amount,
            account_debited: row[5]?.toString().trim() || null,
            account_credited: row[6]?.toString().trim() ? [{ name: row[6].toString().trim(), amount: amount }] : [],
            description: row[4]?.toString().trim() || '',
            name: row[3]?.toString().trim() || '',
            manual_number: row[1]?.toString().trim() || '',
            parent_account: row[7]?.toString().trim() || ''
          });
        }

        console.log('Processed invoices:', invoicesToUpload);
        if (invoicesToUpload.length === 0) {
          throw new Error('No valid invoices found after processing');
        }

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token missing');

        const uploadResults = await Promise.allSettled(
          invoicesToUpload.map(invoice =>
            fetch(`${api}/invoices`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(invoice)
            }).then(async res => {
              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Upload failed');
              }
              return res.json();
            })
          )
        );

        const successful = uploadResults.filter(r => r.status === 'fulfilled');
        const failed = uploadResults.filter(r => r.status === 'rejected');

        if (successful.length > 0) {
          fetchInvoices();
          alert(`${successful.length} invoices uploaded successfully!`);
        }
        if (failed.length > 0) {
          console.error('Failed uploads:', failed);
          alert(`${failed.length} invoices failed to upload. Check console for details.`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
        alert(`Upload failed: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="invoice-issued">
      <h1 className="head">
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="icon" /> Invoice Issued
      </h1>

      <button className="invoice-issued button" onClick={() => setShowForm(true)}>
        Add New Invoice
      </button>

      <button className="invoice-issued button" onClick={handleExportToExcel}>
        Export to Excel
      </button>

      <button className="invoice-issued button" onClick={handleDeleteAll} disabled={isDeleting}>
  Delete All Invoices
</button>
{isDeleting && <p>Deleting invoices, please wait...</p>}
{error && <p className="error">{error}</p>}

      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search Invoices..."
          style={{ marginBottom: "20px", padding: "10px", width: "300px" }}
        />
        <FaSearch style={{ position: "relative", left: "-30px", top: "10px" }} />
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <button className="close" onClick={() => { setShowForm(false); resetForm(); }}>
              &times;
            </button>
            <form onSubmit={handleSubmit} className="invoice-form">
              <div>
                <div>
                  <label>Date :</label>
                  <input
                    type="date"
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    required
                  />
                </div>
                <label>Invoice Number:</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  readOnly
                  required
                />
              </div>
              <div>
                <label>Manual Number:</label>
                <input
                  type="text"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  className="color"
                />
              </div>
              <div>
                <label>Customer Name:</label>
                <Select
                  value={customerOptions.find(
                    (option) => option.value === selectedCustomer
                  )}
                  onChange={(selectedOption) =>
                    setSelectedCustomer(selectedOption.value)
                  }
                  options={customerOptions}
                  placeholder="Select Customer"
                  isSearchable
                  styles={customStyles}
                />
              </div>
              <div>
                <label>Parent Account:</label>
                <Select
                  value={parentAccountOptions.find(
                    (option) => option.value === parentAccount
                  )}
                  onChange={(selectedOption) =>
                    setParentAccount(selectedOption.value)
                  }
                  options={parentAccountOptions}
                  placeholder="Select Parent Account"
                  isSearchable
                  styles={customStyles}
                />
              </div>
              <div>
                <label>All Customers:</label>
                <Select
                  value={allCustomersOptions.filter(
                    (option) => allCustomersSelected.includes(option.value)
                  )}
                  onChange={(selectedOptions) =>
                    setAllCustomersSelected(selectedOptions.map(option => option.value))
                  }
                  options={allCustomersOptions}
                  placeholder="Select All Customers"
                  isSearchable
                  isMulti
                  styles={customStyles}
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
                <label>Account Debited:</label>
                <input
                  type="text"
                  value={accountDebited}
                  disabled
                />
              </div>
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
                        handleCreditedAccountChange(index, account.value, parseFloat(e.target.value) || 0)
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
              <div>
                <label>Total Amount:</label>
                <input
                  type="number"
                  value={totalAmount}
                  readOnly
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : isEditing ? "Update Invoice" : "Submit Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice Number</th>
            <th>Manual INV.Number</th>
            <th>Customer Name</th>
            <th>Description</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Parent Account</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.date_issued}</td>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.manual_number}</td>
              <td>{invoice.name}</td>
              <td>{invoice.description}</td>
              <td>{invoice.account_debited}</td>
              <td>
                {invoice.account_credited.map((account, index) => (
                  <div key={index}>
                    {account.name} - {formatFinancialValue(account.amount)}
                  </div>
                ))}
              </td>
              <td>{invoice.parent_account}</td>
              <td>{formatFinancialValue(invoice.amount)}</td>
              <td>
                <button onClick={() => handleUpdate(invoice)}>
                  <FaEdit /> Edit
                </button>
                <button onClick={() => handleDelete(invoice.id)}>
                  <FaTrash /> Delete
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
