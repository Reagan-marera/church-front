import React, { useState, useEffect } from "react";
import Select from "react-select";
import "./InvoicesTable.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from 'xlsx';

const InvoiceReceived = () => {
  // Function to format financial values
  const formatFinancialValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [accountsDebited, setAccountsDebited] = useState([]);
  const [accountCredited, setAccountCredited] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [parentAccount, setParentAccount] = useState("");

  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [payees, setPayees] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  const [editingInvoice, setEditingInvoice] = useState(null);

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

  const api = 'https://backend.youmingtechnologies.co.ke';

  useEffect(() => {
    fetchInvoices();
    fetchPayees();
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
      const response = await fetch(`${api}/invoice-received`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      console.log("Fetched Invoices:", data);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Error fetching invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayees = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/payee`, {
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

        const tradeCreditorsAccount = data.find(
          (account) =>
            account.sub_account_details &&
            account.sub_account_details.some(
              (subAccount) => subAccount.name === "2250- Trade Payables Control Account"
            )
        );

        if (tradeCreditorsAccount) {
          const subAccount = tradeCreditorsAccount.sub_account_details.find(
            (subAccount) => subAccount.name === "2250- Trade Payables Control Account"
          );
          setAccountCredited(subAccount.name);
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

  const handlePayeeChange = (selectedOption) => {
    setPayeeName(selectedOption.value);
    setAccountsDebited([]);
  };

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
      amount: totalAmount,
      account_debited: accountsDebited.map(account => ({
        name: account.value,
        amount: account.amount
      })),
      account_credited: accountCredited,
      grn_number: grnNumber,
      name: payeeName,
      parent_account: parentAccount,
    };

    try {
      const response = await fetch(
        `${api}/invoice-received/${editingInvoice ? editingInvoice : ''}`,
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

  const resetForm = () => {
    setInvoiceNumber("");
    setDateIssued("");
    setDescription("");
    setTotalAmount(0);
    setAccountsDebited([]);
    setGrnNumber("");
    setPayeeName("");
    setParentAccount("");
  };

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

  const handleEdit = (invoice) => {
    setInvoiceNumber(invoice.invoice_number);
    setDateIssued(invoice.date_issued);
    setDescription(invoice.description);
    setTotalAmount(invoice.amount);
    setAccountsDebited(
      Array.isArray(invoice.account_debited)
        ? invoice.account_debited.map(account => ({
            value: account.name,
            label: account.name,
            amount: account.amount
          }))
        : []
    );
    setGrnNumber(invoice.grn_number);
    setPayeeName(invoice.name);
    setParentAccount(invoice.parent_account || "");
    setEditingInvoice(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (invoiceId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated");
      return;
    }

    try {
      const response = await fetch(`${api}/invoice-received/${invoiceId}`, {
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

    try {
      const response = await fetch(`${api}/invoice-received`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const deletePromises = data.map(invoice =>
        fetch(`${api}/invoice-received/${invoice.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      await Promise.all(deletePromises);
      fetchInvoices();
    } catch (error) {
      setError("Error deleting all invoices");
    }
  };

  const payeeOptions = payees.flatMap((payee) =>
    payee.sub_account_details.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    }))
  );

  const debitedAccountOptions = getSubAccountNames().map((subAccountName) => ({
    value: subAccountName,
    label: subAccountName,
  }));

  const parentAccountOptions = chartOfAccounts.map((account) => ({
    value: account.parent_account,
    label: account.parent_account,
  }));

  const handleAddDebitedAccount = () => {
    setAccountsDebited([...accountsDebited, { value: "", label: "", amount: 0 }]);
  };

  const handleRemoveDebitedAccount = (index) => {
    setAccountsDebited(accountsDebited.filter((_, i) => i !== index));
  };

  const handleDebitedAccountChange = (index, value, amount) => {
    const updatedAccounts = [...accountsDebited];
    updatedAccounts[index] = { value, label: value, amount: parseFloat(amount) };
    setAccountsDebited(updatedAccounts);

    const newTotalAmount = updatedAccounts.reduce((sum, account) => sum + account.amount, 0);
    setTotalAmount(newTotalAmount);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setError("");
        setLoading(true);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
        const invoicesToUpload = [];
        let invoiceCounter = 1;
        const COLUMNS = {
          DATE: 1,
          INV_NO: 2,
          GRN: 3,
          PAYEE_NAME: 4,
          DESCRIPTION: 5,
          PARENT_ACCOUNT: 6,
          ACCOUNT_DEBITED: 7,
          ACCOUNT_CREDITED: 8,
          AMOUNT: 9
        };

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length <= COLUMNS.AMOUNT || row.every(cell => cell === "")) continue;

          let amount = 0;
          try {
            const amountValue = row[COLUMNS.AMOUNT];
            amount = typeof amountValue === "number"
              ? amountValue
              : parseFloat(String(amountValue).replace(/[^\d.-]/g, "")) || 0;
          } catch (e) {
            console.warn(`Invalid amount in row ${i}`);
            continue;
          }

          if (amount <= 0) continue;

          const invoiceNumber = row[COLUMNS.INV_NO]?.toString().trim() || `UP-${invoiceCounter++}`;

          let dateIssued;
          try {
            const dateValue = row[COLUMNS.DATE];
            if (typeof dateValue === "number") {
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              dateIssued = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
            } else if (typeof dateValue === "string") {
              const [month, day, year] = dateValue.split("/").map(Number);
              dateIssued = new Date(year, month - 1, day);
            }

            if (!dateIssued || isNaN(dateIssued.getTime())) {
              throw new Error('Invalid date');
            }
          } catch (e) {
            console.warn(`Invalid date in row ${i}:`, row[COLUMNS.DATE]);
            continue;
          }

          invoicesToUpload.push({
            invoice_number: invoiceNumber,
            date_issued: dateIssued.toISOString().split("T")[0],
            amount: amount,
            account_debited: row[COLUMNS.ACCOUNT_DEBITED]?.toString().trim() || "",
            account_credited: row[COLUMNS.ACCOUNT_CREDITED]?.toString().trim() || "",
            description: row[COLUMNS.DESCRIPTION]?.toString().trim() || "",
            name: row[COLUMNS.PAYEE_NAME]?.toString().trim() || "",
            grn_number: row[COLUMNS.GRN]?.toString().trim() || "",
            parent_account: row[COLUMNS.PARENT_ACCOUNT]?.toString().trim() || ""
          });
        }

        if (invoicesToUpload.length === 0) {
          throw new Error("No valid invoices found in the file.");
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token missing");
        const uploadResults = { success: 0, failures: 0, errors: [] };

        for (const invoice of invoicesToUpload) {
          try {
            const response = await fetch("https://backend.youmingtechnologies.co.ke/invoice-received", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(invoice)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || "Upload failed");
            }
            uploadResults.success++;
          } catch (err) {
            uploadResults.failures++;
            uploadResults.errors.push({
              invoice: invoice.invoice_number,
              error: err.message
            });
            console.error(`Failed to upload ${invoice.invoice_number}:`, err);
          }
        }

        if (uploadResults.success > 0) {
          alert(`${uploadResults.success} invoices uploaded successfully!`);
        }
        if (uploadResults.failures > 0) {
          setError(`${uploadResults.failures} failed. Errors: ${uploadResults.errors.map(e => `${e.invoice}: ${e.error}`).join(", ")}`);
        }
      } catch (err) {
        console.error("File processing error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportToExcel = () => {
    const dataForExcel = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Date Issued': invoice.date_issued,
      'Payee Name': invoice.name,
      'Description': invoice.description,
      'Total Amount': invoice.amount,
      'Parent Account': invoice.parent_account,
      'Account Debited': Array.isArray(invoice.account_debited)
        ? invoice.account_debited.map(account => `${account.name}: ${formatFinancialValue(account.amount)}`).join(', ')
        : 'No Accounts Debited',
      'Account Credited': invoice.account_credited,
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    XLSX.writeFile(wb, 'Invoices.xlsx');
  };

  return (
    <div className="invoice-received">
      <h1 className="head">
        <FontAwesomeIcon icon={faCreditCard} className="icon" /> Invoice Received
      </h1>

      <button
        onClick={() => setShowForm(true)}
        style={{
          backgroundColor: "#FFA500",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Add New Invoice
      </button>

      <button
        onClick={handleExportToExcel}
        style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginLeft: "10px",
        }}
      >
        Export to Excel
      </button>

      <button
        onClick={handleDeleteAll}
        style={{
          backgroundColor: "#FF0000",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginLeft: "10px",
        }}
      >
        Delete All Invoices
      </button>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{
          marginLeft: "10px",
        }}
      />

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => { setShowForm(false); resetForm(); }}>
              &times;
            </span>
            <form onSubmit={handleSubmit} className="invoice-form">
              <div>
                <label>Date:</label>
                <input
                  type="date"
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  required
                />
              </div>
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
                <label>GRN Number:</label>
                <input
                  type="text"
                  value={grnNumber}
                  onChange={(e) => setGrnNumber(e.target.value)}
                />
              </div>
              <div>
                <label>Payee Name:</label>
                <Select
                  value={payeeOptions.find((option) => option.value === payeeName)}
                  onChange={handlePayeeChange}
                  options={payeeOptions}
                  placeholder="Select Payee"
                  isSearchable
                  styles={customStyles}
                />
              </div>
              <div>
                <label>Parent Account:</label>
                <Select
                  value={parentAccountOptions.find((option) => option.value === parentAccount)}
                  onChange={(selectedOption) => setParentAccount(selectedOption.value)}
                  options={parentAccountOptions}
                  placeholder="Select Parent Account"
                  isSearchable
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
                {accountsDebited.map((account, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center" }}>
                    <Select
                      value={debitedAccountOptions.find((option) => option.value === account.value)}
                      onChange={(selectedOption) => handleDebitedAccountChange(index, selectedOption.value, account.amount)}
                      options={debitedAccountOptions}
                      placeholder="Select Debited Account"
                      isSearchable
                      styles={customStyles}
                    />
                    <input
                      type="number"
                      value={account.amount}
                      onChange={(e) => handleDebitedAccountChange(index, account.value, e.target.value)}
                      placeholder="Amount"
                      style={{ marginLeft: "10px" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDebitedAccount(index)}
                      style={{ marginLeft: "10px" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleAddDebitedAccount}>
                  Add Another Account
                </button>
              </div>
              <div>
                <label>Account Credited:</label>
                <input
                  type="text"
                  value={accountCredited}
                  disabled
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

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : editingInvoice ? "Update Invoice" : "Submit Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <h2>Invoices List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="compact-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice Number</th>
              <th>GRN Number</th>
              <th>Payee Name</th>
              <th>Description</th>
              <th>Account Debited</th>
              <th>Account Credited</th>
              <th>Parent Account</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.date_issued}</td>
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.grn_number}</td>
                  <td>{invoice.name}</td>
                  <td>{invoice.description}</td>
                <td>
  {Array.isArray(invoice.account_debited) ? (
    invoice.account_debited.length > 0 ? (
      invoice.account_debited.map((account, index) => (
        <div key={index}>
          {account.name || account.account || 'Unknown Account'} - {formatFinancialValue(account.amount)}
        </div>
      ))
    ) : (
      "No Accounts Debited"
    )
  ) : (
    typeof invoice.account_debited === 'string' ? invoice.account_debited : "Invalid Format"
  )}
</td>
                  <td>{invoice.account_credited}</td>
                  <td>{invoice.parent_account}</td>
                  <td>{formatFinancialValue(invoice.amount)}</td>
                  <td>
                    <button onClick={() => handleEdit(invoice)}><FaEdit /></button>
                    <button onClick={() => handleDelete(invoice.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvoiceReceived;
