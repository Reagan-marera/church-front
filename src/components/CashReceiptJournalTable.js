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
import "./CashReceiptJournalTable.css";

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [singleCustomerName, setSingleCustomerName] = useState("");
  const [allCustomersSelected, setAllCustomersSelected] = useState([]);
  const [allCustomersSubAccounts, setAllCustomersSubAccounts] = useState([]);
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
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCustomerChange = (selectedOption) => {
    const selectedSubAccount = selectedOption.value;
    console.log("Selected Sub-Account:", selectedSubAccount); // Debugging line
    setSingleCustomerName(selectedSubAccount);
    setAllCustomersSelected([]);
  
    // Set allCustomersSubAccounts with the single selected sub-account
    setAllCustomersSubAccounts([{ value: selectedSubAccount, label: selectedSubAccount }]);
  
    // Further logic for invoices, total amount, balance, etc.
    const customerInvoices = invoices.filter(
      (invoice) => invoice.name === selectedSubAccount
    );
  
    const totalAmount = customerInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount),
      0
    );
    setInvoiceAmount(totalAmount);
  
    const customerReceipts = journals.filter(
      (journal) => journal.from_whom_received === selectedSubAccount
    );
  
    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0
    );
  
    const customerBalance = totalAmount - totalReceipts;
    setBalance(customerBalance);
  
    setFormData((prev) => ({
      ...prev,
      from_whom_received: selectedSubAccount,
    }));
  };
  
  const handleAllCustomersChange = (selectedOptions) => {
    const selectedCustomerNames = selectedOptions.map((option) => option.value);
    setAllCustomersSelected(selectedCustomerNames);
    setSingleCustomerName(""); // Clear single customer selection

    const selectedSubAccounts = customers
      .filter((customer) => selectedCustomerNames.includes(customer.account_name))
      .flatMap((customer) =>
        customer.sub_account_details.map((subAccount) => ({
          value: subAccount.name,
          label: subAccount.name,
        }))
      );

    setAllCustomersSubAccounts(selectedSubAccounts);

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
      total: parseFloat(selectedInvoice?.amount || 0),
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

  try {
    setLoading(true);

    // Fetch the token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }

    // Fetch the last receipt number from the server or initialize with a default value
    let lastReceiptNo = await fetchLastReceiptNumber();
    if (!lastReceiptNo) lastReceiptNo = 0;

    // Prepare payloads for each sub-account of the selected customers
    const payloads = allCustomersSubAccounts.map((subAccount, index) => {
      // Increment the receipt number for each sub-account
      const newReceiptNo = `${parseInt(lastReceiptNo) + index + 1}`;

      return {
        receipt_date: formData.receipt_date,
        receipt_no: newReceiptNo, // Assign unique receipt number
        ref_no: formData.ref_no,
        from_whom_received: subAccount.value, // Use sub-account name
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
    });

    console.log("Payloads:", payloads); // Debugging line

    // Submit a receipt for each sub-account
    for (const payload of payloads) {
      const response = await fetch("http://127.0.0.1:5000/cash-receipt-journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Use the fetched token here
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    }

    refreshData();
    setFormData({});
    setError("");
    setShowForm(false);
    setAllCustomersSelected([]); // Clear selected customers after submission
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // Helper function to fetch the last receipt number from the server
  const fetchLastReceiptNumber = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const response = await fetch("http://127.0.0.1:5000/last-receipt-number", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.lastReceiptNo || 0; // Default to 0 if no receipts exist
    } catch (err) {
      console.error("Error fetching last receipt number:", err.message);
      return 0;
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
    setSingleCustomerName(""); // Clear single customer selection

  };

  const printReceipt = async (journal) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.open();

    const customerName = journal.from_whom_received;

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

        invoiceCreditedAccounts = invoicesData.flatMap((invoice) =>
          invoice.account_credited?.map((account) => ({
            name: account.name || "N/A",
            amount: parseFloat(account.amount) || 0,
          }))
        );
      } catch (err) {
        console.error("Error fetching invoices for customer:", err.message);
        invoiceCreditedAccounts = [];
      }
    }

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

    const totalRemainingBalance = clearedAccounts.reduce(
      (total, account) => total + account.remainingAmount,
      0
    );

    printWindow.document.write(`
      <h3>World Bank</h3>
      <h4>Cash Receipt Journal</h4>
      <p><strong>Official Receipt</strong></p>
      <table border="1" cellpadding="5">
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
          <td>Total Amount</td>
          <td>${journal.total || "N/A"}</td>
        </tr>
      </table>
      <h4>Votes Heads</h4>
      <table border="1" cellpadding="5">
        <tr>
          <th>Name</th>
          <th>Amount</th>
          <th>Cleared</th>
          <th>Remaining</th>
        </tr>
        ${clearedAccounts
          .map(
            (account) => `
        <tr>
          <td>${account.name}</td>
          <td>${account.amount.toFixed(2)}</td>
          <td>${account.clearedAmount.toFixed(2)}</td>
          <td>${account.remainingAmount.toFixed(2)}</td>
        </tr>`
          )
          .join("")}
      </table>
      <p><strong>Total Remaining Balance:</strong> ${totalRemainingBalance.toFixed(2)}</p>
      <p>Thank you for your payment. This is an official receipt.</p>
      <p>Youming Tech | www.youmingtech.org</p>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const customerOptions = customers.flatMap((customer) =>
    customer.sub_account_details.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    }))
  );

  const allCustomersOptions = customers.map((customer) => ({
    value: customer.account_name,
    label: customer.account_name,
  }));

  const invoiceOptions = invoices
    .filter(
      (invoice) =>
        invoice.name === singleCustomerName || allCustomersSelected.includes(invoice.name)
    )
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
        <div className="form-popup">
          <h3>{isEditing ? "Edit Receipt" : "Add New Receipt"}</h3>
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-row">
              <label>Receipt Date:</label>
              <input
                type="date"
                name="receipt_date"
                value={formData.receipt_date}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Receipt No:</label>
              <input
                type="text"
                name="receipt_no"
                value={formData.receipt_no}
                readOnly
                className="form-input read-only"
              />
            </div>

            <div className="form-row">
              <label>Reference No:</label>
              <input
                type="text"
                name="ref_no"
                value={formData.ref_no}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Single Customer:</label>
              <Select
                value={customerOptions.find((option) => option.value === singleCustomerName)}
                onChange={(selectedOption) => handleCustomerChange(selectedOption)}
                options={customerOptions}
                placeholder="Select Customer"
                isSearchable
                styles={customStyles}
              />
            </div>

            <div className="form-row">
              <label>All Customers in Account:</label>
              <Select
                value={allCustomersSelected.map((name) => ({ value: name, label: name }))}
                onChange={(selectedOptions) => {
                  handleAllCustomersChange(selectedOptions);
                }}
                options={allCustomersOptions}
                placeholder="Select All Customers in Account"
                isSearchable
                isMulti
                styles={customStyles}
              />
            </div>

            <div className="form-row">
              <label>Invoice Amount:</label>
              <input
                type="number"
                value={invoiceAmount}
                readOnly
                className="form-input read-only"
              />
            </div>

            <div className="form-row">
              <label>Balance:</label>
              <input
                type="number"
                value={balance}
                readOnly
                className="form-input read-only"
              />
            </div>

            <div className="form-row">
              <label>Select Invoice:</label>
              <Select
                value={invoiceOptions.find(
                  (option) => option.value === formData.selectedInvoice?.invoice_number
                )}
                onChange={handleInvoiceChange}
                options={invoiceOptions}
                placeholder="Select Invoice"
                isSearchable
                styles={customStyles}
              />
            </div>

            <div className="form-row">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Receipt Type:</label>
              <select
                name="receipt_type"
                value={formData.receipt_type}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Cash">Cash</option>
                <option value="Invoiced">Invoiced</option>
              </select>
            </div>

            <div className="form-row">
              <label>Account Debited:</label>
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
              />
            </div>

            <div className="form-row">
              <label>Account Credited:</label>
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
              />
            </div>

            <div className="form-row">
              <label>Cash:</label>
              <input
                type="number"
                name="cash"
                value={formData.cash}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Bank:</label>
              <input
                type="number"
                name="bank"
                value={formData.bank}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Total:</label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>Cashbook:</label>
              <input
                type="text"
                name="cashbook"
                value={formData.cashbook}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                {loading ? "Submitting..." : isEditing ? "Update Receipt" : "Submit Receipt"}
              </button>
              <button type="button" onClick={closeFormPopup} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table border="1" cellpadding="5">
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
