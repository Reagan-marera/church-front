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

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [singleCustomerName, setSingleCustomerName] = useState("");
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
    account_debited: "",
    account_credited: "", // Single credited account
    cash: 0,
    bank: 0,
    total: 0,
    cashbook: "",
    selectedInvoice: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allCustomersSelected, setAllCustomersSelected] = useState([]);
  const [accountName, setAccountName] = useState("");

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

      // Debugging: Log the raw invoice data
      console.log("Raw Invoice Data:", data);

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
      const data = await response.json();

      // Enrich journals with selectedInvoice data
      const enrichedJournals = data.map((journal) => ({
        ...journal,
        selectedInvoice: invoices.find(
          (invoice) => invoice.invoice_number === journal.ref_no
        ),
      }));

      setJournals(enrichedJournals);
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
      const data = await response.json();
      setCoa(data);
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

  const handleAccountNameChange = (selectedOption) => {
    const selectedAccountName = selectedOption.value;
    setAccountName(selectedAccountName);
    setSingleCustomerName("");
    setAllCustomersSelected([]);

    const accountCustomers = customers.filter(
      (customer) => customer.parentName === selectedAccountName
    );

    const totalAmount = accountCustomers.reduce(
      (sum, customer) => sum + parseFloat(customer.amount),
      0
    );
    setInvoiceAmount(totalAmount);

    const customerReceipts = journals.filter((journal) =>
      accountCustomers.some((customer) => customer.name === journal.from_whom_received)
    );

    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0
    );

    const customerBalance = totalAmount - totalReceipts;
    setBalance(customerBalance);

    setFormData((prev) => ({
      ...prev,
      from_whom_received: accountCustomers.map((customer) => customer.name).join(", "),
    }));
  };

  const handleSingleCustomerChange = (selectedOption) => {
    const selectedCustomerName = selectedOption.value;
    setSingleCustomerName(selectedCustomerName);
    setAllCustomersSelected([]); // Clear all customers selection

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

  const handleAllCustomersChange = (selectedOptions) => {
    const selectedCustomerNames = selectedOptions.map((option) => option.value);
    setAllCustomersSelected(selectedCustomerNames);
    setSingleCustomerName(""); // Clear single customer selection

    const customerInvoices = invoices.filter((invoice) =>
      selectedCustomerNames.includes(invoice.name)
    );

    const totalAmount = customerInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount),
      0
    );
    setInvoiceAmount(totalAmount);

    const customerReceipts = journals.filter((journal) =>
      selectedCustomerNames.includes(journal.from_whom_received)
    );

    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0
    );

    const customerBalance = totalAmount - totalReceipts;
    setBalance(customerBalance);

    setFormData((prev) => ({
      ...prev,
      from_whom_received: selectedCustomerNames.join(", "),
    }));
  };

  const handleInvoiceChange = (selectedOption) => {
    const selectedInvoice = invoices.find(
      (invoice) => invoice.invoice_number === selectedOption.value
    );

    setFormData((prev) => ({
      ...prev,
      selectedInvoice: selectedInvoice,
      total: parseFloat(selectedInvoice.amount),
    }));
  };

  const getDebitAccounts = () => {
    if (formData.receipt_type === "Invoiced") {
      const currentAssetsAccount = coa.find(
        (account) => account.account_name === "100-Current Assets"
      );
      return currentAssetsAccount?.sub_account_details || [];
    } else if (formData.receipt_type === "Cash") {
      const cashAccount = coa.find(
        (account) => account.account_name === "100-Current Assets"
      );
      return cashAccount?.sub_account_details || [];
    } else {
      return coa.filter((account) => account.parent_account === "1000");
    }
  };

  const getCreditedAccounts = () => {
    return coa.flatMap((account) => {
      const subAccounts = account.sub_account_details || [];
      return subAccounts.filter((subAccount) => {
        if (formData.receipt_type === "Invoiced") {
          return subAccount.name === "1150- Trade Debtors Control Account";
        } else {
          return subAccount.account_type !== "50-Expenses";
        }
      });
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      account_debited: formData.account_debited,
      account_credited: formData.account_credited, // Single credited account
      cash: parseFloat(formData.cash) || 0,
      bank: parseFloat(formData.bank) || 0,
      total: parseFloat(formData.total),
      cashbook: formData.cashbook,
      selected_invoice_id: formData.selectedInvoice?.id,
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

      setFormData({
        receipt_date: journal.receipt_date,
        receipt_no: journal.receipt_no,
        ref_no: journal.ref_no,
        from_whom_received: journal.from_whom_received,
        description: journal.description,
        receipt_type: journal.receipt_type,
        account_debited: journal.account_debited,
        account_credited: journal.account_credited, // Single credited account
        cash: journal.cash,
        bank: journal.bank,
        total: journal.total,
        cashbook: journal.cashbook,
        selectedInvoice: journal.selectedInvoice || null,
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
        account_debited: "",
        account_credited: "", // Single credited account
        cash: 0,
        bank: 0,
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

  const printReceipt = async (journal) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.open();

    // Extract the customer name from the journal
    const customerName = journal.from_whom_received;

    // Fetch invoices for the specific customer
    let invoiceCreditedAccounts = [];
    if (customerName) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User is not authenticated");

        const response = await fetch(
          `http://127.0.0.1:5000/invoices?name=${encodeURIComponent(customerName)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error(await response.text());
        const invoicesData = await response.json();

        // Combine all credited accounts from the invoices
        invoiceCreditedAccounts = invoicesData.flatMap((invoice) =>
          invoice.account_credited?.map((account) => ({
            name: account.name || "N/A",
            amount: parseFloat(account.amount) || 0,
          }))
        );
      } catch (err) {
        console.error("Error fetching invoices for customer:", err.message);
        invoiceCreditedAccounts = []; // Default to empty array on error
      }
    }

    // Calculate the remaining balance after clearing each invoice account
    let remainingBalance = parseFloat(journal.total) || 0;
    const clearedAccounts = invoiceCreditedAccounts.map((account) => {
      const clearedAmount = Math.min(remainingBalance, account.amount);
      remainingBalance -= clearedAmount;
      return {
        name: account.name,
        amount: account.amount,
        clearedAmount: clearedAmount,
        remainingAmount: account.amount - clearedAmount,
      };
    });

    // Calculate the total remaining balance from uncleared amounts
    const totalRemainingBalance = clearedAccounts.reduce((total, account) => {
      return total + account.remainingAmount;
    }, 0);

    // Generate the printout content
    printWindow.document.write(`
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header h2 { font-size: 18px; margin: 5px 0; }
          .header p { font-size: 14px; margin: 0; }
          .section { margin-bottom: 20px; }
          .section h3 { font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .section table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .section table th, .section table td { border: 1px solid #000; padding: 8px; text-align: left; }
          .section table th { background-color: #f2f2f2; }
          .total { font-weight: bold; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>World Bank</h1>
          <h2>Cash Receipt Journal</h2>
          <p>Official Receipt</p>
        </div>

        <div class="section">
          <h3>Receipt Details</h3>
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
              <td>Total Amount</td>
              <td>${journal.total || "N/A"}</td>
            </tr>
            <tr>
              <td>Account Deposited</td>
              <td>${journal.cashbook || "N/A"}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Vote Heads</h3>
          <table>
            <tr>
              <th>Account Name</th>
              <th>Total Amount</th>
              <th>Cleared Amount</th>
              <th>Remaining Amount</th>
            </tr>
            ${
              clearedAccounts.length > 0
                ? clearedAccounts
                    .map(
                      (account) => `
                    <tr>
                      <td>${account.name}</td>
                      <td>${account.amount.toFixed(2)}</td>
                      <td>${account.clearedAmount.toFixed(2)}</td>
                      <td>${account.remainingAmount.toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")
                : `<tr><td colspan="4">No invoice accounts.</td></tr>`
            }
          </table>
        </div>

        <div class="section">
          <h3>Summary</h3>
          <p class="total">Total Remaining Balance: ${totalRemainingBalance.toFixed(2)}</p>
        </div>

        <div class="footer">
          <p>Thank you for your payment. This is an official receipt.</p>
          <p>Youming Tech | www.youmingtech.org</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const accountOptions = coa.map((account) => ({
    value: account.account_name,
    label: account.account_name,
  }));

  const customerOptions = customers.map((customer) => ({
    value: customer.parentName,
    label: customer.parentName,
  }));

  const invoiceOptions = invoices
    .filter((invoice) => invoice.name === singleCustomerName || allCustomersSelected.includes(invoice.name))
    .map((invoice) => ({
      value: invoice.invoice_number,
      label: `Invoice ${invoice.invoice_number} - ${invoice.amount}`,
    }));

  const debitAccountOptions = getDebitAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  const creditedAccountOptions = getCreditedAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => openFormPopup()}>Add New Receipt</button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? "Edit Receipt" : "Add New Receipt"}</h3>

          {/* Form Fields */}
          <label>
            Receipt Date:
            <input
              type="date"
              name="receipt_date"
              value={formData.receipt_date}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Receipt No:
            <input
              type="text"
              name="receipt_no"
              value={formData.receipt_no}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Reference No:
            <input
              type="text"
              name="ref_no"
              value={formData.ref_no}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Account Name:
            <Select
              value={accountOptions.find(
                (option) => option.value === accountName
              )}
              onChange={handleAccountNameChange}
              options={accountOptions}
              placeholder="Select Account Name"
              isSearchable
              styles={customStyles}
            />
          </label>
          <br />

          <label>
            Single Customer:
            <Select
              value={customerOptions.find(
                (option) => option.value === singleCustomerName
              )}
              onChange={handleSingleCustomerChange}
              options={customerOptions}
              placeholder="Select Customer"
              isSearchable
              styles={customStyles}
            />
          </label>
          <br />

          <label>
            All Customers in Account:
            <Select
              value={customerOptions.filter(
                (option) => allCustomersSelected.includes(option.value)
              )}
              onChange={handleAllCustomersChange}
              options={customerOptions}
              placeholder="Select All Customers in Account"
              isSearchable
              isMulti
              styles={customStyles}
            />
          </label>
          <br />

          <label>
            Invoice Amount:
            <input value={invoiceAmount} readOnly />
          </label>
          <br />

          <label>
            Balance:
            <input value={balance} readOnly />
          </label>
          <br />

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
              className="form-input"
            />
          </label>
          <br />

          <label>
            Description:
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </label>
          <br />

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
          <br />

          <label>
            Account Debited:
            <Select
              value={debitAccountOptions.find(
                (option) => option.value === formData.account_debited
              )}
              onChange={(selectedOption) =>
                setFormData((prev) => ({
                  ...prev,
                  account_debited: selectedOption.value,
                }))
              }
              options={debitAccountOptions}
              placeholder="Select Account Debited"
              isSearchable
              styles={customStyles}
              className="form-input"
            />
          </label>
          <br />

          <label>
            Account Credited:
            <Select
              value={creditedAccountOptions.find(
                (option) => option.value === formData.account_credited
              )}
              onChange={(selectedOption) =>
                setFormData((prev) => ({
                  ...prev,
                  account_credited: selectedOption.value,
                }))
              }
              options={creditedAccountOptions}
              placeholder="Select Account Credited"
              isSearchable
              styles={customStyles}
              className="form-input"
            />
          </label>
          <br />

          <label>
            Cash:
            <input
              type="number"
              name="cash"
              value={formData.cash}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Bank:
            <input
              type="number"
              name="bank"
              value={formData.bank}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Total:
            <input
              type="number"
              name="total"
              value={formData.total}
              readOnly
            />
          </label>
          <br />

          <label>
            Cashbook:
            <input
              type="text"
              name="cashbook"
              value={formData.cashbook}
              onChange={handleInputChange}
            />
          </label>
          <br />

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
      )}

      <table border="1">
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
