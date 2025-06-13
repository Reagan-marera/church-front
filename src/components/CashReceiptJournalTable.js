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
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import "./CashReceiptJournalTable.css";
import * as XLSX from 'xlsx';

const api = 'https://backend.youmingtechnologies.co.ke';

const CashReceiptJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [coa, setCoa] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [singleCustomerName, setSingleCustomerName] = useState("");
  const [allCustomersSelected, setAllCustomersSelected] = useState([]);
  const [allCustomersSubAccounts, setAllCustomersSubAccounts] = useState([]);
  const [invoiceAmount, setInvoiceAmount] = useState("$0.00");
  const [balance, setBalance] = useState("$0.00");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    receipt_date: "",
    receipt_no: "",
    ref_no: "",
    from_whom_received: "",
    description: "",
    receipt_type: "",
    manual_number: "",
    account_debited: "",
    account_credited: "",
    cash: "$0.00",
    bank: "$0.00",
    total: "$0.00",
    cashbook: "",
    selectedInvoice: null,
    parent_account: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
    initializeReceiptCounter();

    const storedDeletedItems = localStorage.getItem("deletedItems");
    if (storedDeletedItems) {
      const deletedItems = JSON.parse(storedDeletedItems);
      setJournals((prevJournals) =>
        prevJournals.map((journal) =>
          deletedItems.includes(journal.id) ? { ...journal, isDeleted: true } : journal
        )
      );
    }
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
      const response = await fetch(`${api}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching invoices:", errorText);
        setError(errorText);
        return;
      }
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error("Error in fetchInvoices:", err);
      setError(err.message);
    }
  };

  const fetchJournals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch(`${api}/cash-receipt-journals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching journals:", errorText);
        setError(errorText);
        return;
      }
      const data = await response.json();
      const enrichedJournals = data.map((journal) => ({
        ...journal,
        selectedInvoice: invoices.find(
          (invoice) => invoice.invoice_number === journal.ref_no
        ),
        isDeleted: false,
      }));
      setJournals(enrichedJournals);
    } catch (err) {
      console.error("Error in fetchJournals:", err);
      setError(err.message);
    }
  };

  const fetchCOA = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch(`${api}/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching COA:", errorText);
        setError(errorText);
        return;
      }
      const data = await response.json();
      setCoa(data);
    } catch (err) {
      console.error("Error in fetchCOA:", err);
      setError(err.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch(`${api}/customer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching customers:", errorText);
        setError(errorText);
        return;
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error("Error in fetchCustomers:", err);
      setError(err.message);
    }
  };

  const initializeReceiptCounter = () => {
    let currentReceiptCounter = localStorage.getItem("receipt_counter");
    if (currentReceiptCounter === null) {
      const highestReceiptNumber = journals.reduce((max, journal) => {
        const receiptNumberMatch = journal.receipt_no.match(/R-(\d+)/);
        const receiptNumber = receiptNumberMatch ? parseInt(receiptNumberMatch[1], 10) : 0;
        return Math.max(max, isNaN(receiptNumber) ? 0 : receiptNumber);
      }, 0);
      localStorage.setItem("receipt_counter", highestReceiptNumber);
    }
  };

  const generateUniqueReceiptNumber = () => {
    let currentCounter = parseInt(localStorage.getItem("receipt_counter"), 10) || 0;
    currentCounter += 1;
    localStorage.setItem("receipt_counter", currentCounter);
    return `R-${currentCounter}`;
  };

  const handleCustomerChange = (selectedOption) => {
    const selectedSubAccount = selectedOption.value;
    setSingleCustomerName(selectedSubAccount);
    setAllCustomersSelected([]);
    setAllCustomersSubAccounts([{ value: selectedSubAccount, label: selectedSubAccount }]);
    const customerInvoices = invoices.filter(
      (invoice) => invoice.name === selectedSubAccount
    );
    const totalAmount = customerInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount),
      0.00
    );
    setInvoiceAmount(formatCurrency(totalAmount));
    const customerReceipts = journals.filter(
      (journal) => journal.from_whom_received === selectedSubAccount
    );
    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0.00
    );
    const customerBalance = formatCurrency(totalAmount - totalReceipts);
    setBalance(customerBalance);
    setFormData((prev) => ({
      ...prev,
      from_whom_received: selectedSubAccount,
    }));
  };

  const handleAllCustomersChange = (selectedOptions) => {
    const selectedCustomerNames = selectedOptions.map((option) => option.value);
    setAllCustomersSelected(selectedCustomerNames);
    setSingleCustomerName("");
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
      0.00
    );
    setInvoiceAmount(formatCurrency(totalAmount));
    const customerReceipts = journals.filter((journal) =>
      selectedCustomerNames.includes(journal.from_whom_received)
    );
    const totalReceipts = customerReceipts.reduce(
      (sum, journal) => sum + parseFloat(journal.total),
      0.00
    );
    const customerBalance = formatCurrency(totalAmount - totalReceipts);
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
      total: formatCurrency(parseFloat(selectedInvoice?.amount || 0)),
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
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated.");
        return;
      }

      const payload = {
        receipt_date: formData.receipt_date,
        receipt_no: formData.receipt_no,
        ref_no: formData.ref_no,
        manual_number: formData.manual_number,
        from_whom_received: formData.from_whom_received,
        description: formData.description,
        receipt_type: formData.receipt_type,
        account_debited: formData.account_debited,
        account_credited: formData.account_credited,
        cash: parseFloat(formData.cash.replace(/[^\d.-]/g, '')),
        bank: parseFloat(formData.bank.replace(/[^\d.-]/g, '')),
        total: parseFloat(formData.total.replace(/[^\d.-]/g, '')),
        cashbook: formData.cashbook,
        selected_invoice_id: formData.selectedInvoice?.id,
        parent_account: formData.parent_account,
      };

      if (isEditing && editingData) {
        const response = await fetch(`${api}/cash-receipt-journals/${editingData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error updating receipt:", errorText);
          setError(errorText);
          return;
        }
      } else {
        const payloads = allCustomersSubAccounts.map((subAccount) => {
          const newReceiptNo = generateUniqueReceiptNumber();
          return {
            ...payload,
            receipt_no: newReceiptNo,
            from_whom_received: subAccount.value,
          };
        });

        for (const payload of payloads) {
          const response = await fetch(`${api}/cash-receipt-journals`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error creating receipt:", errorText);
            setError(errorText);
            return;
          }
        }
      }

      refreshData();
      setFormData({
        receipt_date: "",
        receipt_no: "",
        ref_no: "",
        from_whom_received: "",
        description: "",
        receipt_type: "",
        manual_number: "",
        account_debited: "",
        account_credited: "",
        cash: "0.00",
        bank: "0.00",
        total: "0.00",
        cashbook: "",
        selectedInvoice: null,
        parent_account: "",
      });
      setError("");
      setShowForm(false);
      setAllCustomersSelected([]);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
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
      const response = await fetch(`${api}/cash-receipt-journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error deleting receipt:", errorText);
        setError(errorText);
        return;
      }

      setJournals((prevJournals) =>
        prevJournals.map((journal) =>
          journal.id === id ? { ...journal, isDeleted: true } : journal
        )
      );

      const storedDeletedItems = localStorage.getItem("deletedItems");
      const deletedItems = storedDeletedItems ? JSON.parse(storedDeletedItems) : [];
      localStorage.setItem("deletedItems", JSON.stringify([...deletedItems, id]));

      const remainingJournals = journals.filter(journal => journal.id !== id);
      const highestReceiptNumber = remainingJournals.reduce((max, journal) => {
        const receiptNumberMatch = journal.receipt_no.match(/R-(\d+)/);
        const receiptNumber = receiptNumberMatch ? parseInt(receiptNumberMatch[1], 10) : 0;
        return Math.max(max, isNaN(receiptNumber) ? 0 : receiptNumber);
      }, 0);

      localStorage.setItem("receipt_counter", highestReceiptNumber);
    } catch (err) {
      console.error("Error in handleDelete:", err);
      setError(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all entries?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }

    try {
      for (const journal of journals) {
        if (journal.isDeleted) continue;

        const response = await fetch(`${api}/cash-receipt-journals/${journal.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error deleting receipt ${journal.id}:`, errorText);
          setError(errorText);
          continue;
        }

        setJournals((prevJournals) =>
          prevJournals.map((j) =>
            j.id === journal.id ? { ...j, isDeleted: true } : j
          )
        );

        const storedDeletedItems = localStorage.getItem("deletedItems");
        const deletedItems = storedDeletedItems ? JSON.parse(storedDeletedItems) : [];
        localStorage.setItem("deletedItems", JSON.stringify([...deletedItems, journal.id]));
      }

      const remainingJournals = journals.filter(journal => !journal.isDeleted);
      const highestReceiptNumber = remainingJournals.reduce((max, journal) => {
        const receiptNumberMatch = journal.receipt_no.match(/R-(\d+)/);
        const receiptNumber = receiptNumberMatch ? parseInt(receiptNumberMatch[1], 10) : 0;
        return Math.max(max, isNaN(receiptNumber) ? 0 : receiptNumber);
      }, 0);

      localStorage.setItem("receipt_counter", highestReceiptNumber);
    } catch (err) {
      console.error("Error in handleDeleteAll:", err);
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
        manual_number: journal.manual_number,
        from_whom_received: journal.from_whom_received,
        description: journal.description,
        receipt_type: journal.receipt_type,
        account_debited: journal.account_debited,
        account_credited: journal.account_credited,
        cash: formatCurrency(parseFloat(journal.cash)),
        bank: formatCurrency(parseFloat(journal.bank)),
        total: formatCurrency(parseFloat(journal.total)),
        cashbook: journal.cashbook,
        selectedInvoice: journal.selectedInvoice || null,
        parent_account: journal.parent_account,
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
        manual_number: "",
        receipt_type: "",
        account_debited: "",
        account_credited: "",
        cash: "0.00",
        bank: "0.00",
        total: "0.00",
        cashbook: "",
        selectedInvoice: null,
        parent_account: "",
      });
    }
    setShowForm(true);
  };

  const closeFormPopup = () => {
    setShowForm(false);
    setFormData({
      receipt_date: "",
      receipt_no: "",
      ref_no: "",
      from_whom_received: "",
      description: "",
      manual_number: "",
      receipt_type: "",
      account_debited: "",
      account_credited: "",
      cash: "$0.00",
      bank: "$0.00",
      total: "$0.00",
      cashbook: "",
      selectedInvoice: null,
      parent_account: "",
    });
    setError("");
    setIsEditing(false);
    setEditingData(null);
    setSingleCustomerName("");
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
          `${api}/invoices?name=${encodeURIComponent(customerName)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching invoices for customer:", errorText);
          setError(errorText);
          return;
        }
        const invoicesData = await response.json();
        const filteredInvoices = invoicesData.filter(invoice => invoice.name === customerName);
        if (filteredInvoices.length > 0) {
          invoiceCreditedAccounts = filteredInvoices.flatMap((invoice) =>
            invoice.account_credited?.map((account) => ({
              name: account.name || "N/A",
              amount: parseFloat(account.amount) || 0,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching invoices for customer:", err.message);
        invoiceCreditedAccounts = [];
      }
    }
    let remainingBalance = parseFloat(journal.total) || 0.00;
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
      0.00
    );
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
          <h1>youmingtech</h1>
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
              <td>${formatCurrency(parseFloat(journal.total)) || "N/A"}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h3>Vote Heads</h3>
          <table>
            <tr>
              <th>Account Name</th>
              <th>Total Amount</th>
            </tr>
            ${
              clearedAccounts.length > 0
                ? clearedAccounts
                    .map(
                      (account) => `
                    <tr>
                      <td>${account.name}</td>
                      <td>${formatCurrency(account.amount)}</td>
                    </tr>
                  `
                    )
                    .join("")
                : `<tr><td colspan="4">${journal.account_credited || "No invoice accounts."}</td></tr>`
            }
          </table>
        </div>
        <div class="section">
          <h3>Summary</h3>
          <p class="total">Total Remaining Balance: ${formatCurrency(totalRemainingBalance)}</p>
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

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(journals);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');
    XLSX.writeFile(workbook, 'receipts.xlsx');
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
  
        // Get raw data with header: 1 to skip Excel header row
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1, 
          defval: '',
          raw: false
        });
  
        console.log('First 5 rows:', rawData.slice(0, 5));
  
        const journalsToUpload = [];
        const skippedReasons = [];
  
        // CORRECTED column indices based on actual data structure
        const COLS = {
          DATE: 1,          // Column B: Date (M/D/YYYY)
          RECEIPT_NO: 2,    // Column C: Receipt No
          TRANSACTION_NO: 4, // Column E: Transaction No (skipping empty column D)
          FROM_WHOM: 5,     // Column F: From Whom Received
          MANUAL_NO: 6,     // Column G: Manual Receipt No
          DESCRIPTION: 7,   // Column H: Description
          RECEIPT_TYPE: 8,  // Column I: Receipt Type
          PARENT_ACCOUNT: 9, // Column J: Parent Account
          ACCOUNT_CREDITED: 10, // Column K: Credited Account
          ACCOUNT_DEBITED: 11, // Column L: Debited Account
          CASH: 12,         // Column M: Cash
          BANK: 13          // Column N: Bank
        };
  
        // Process rows starting from row 1 (index 0 is header)
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 14) { // Now checking for 14 columns
            skippedReasons.push(`Row ${i+1}: Insufficient columns (${row ? row.length : 'null'})`);
            continue;
          }
  
          // Extract date string from column B (index 1)
          const dateString = String(row[COLS.DATE] || '').trim();
          
          // Parse date in M/D/YYYY format
          let receipt_date;
          try {
            if (dateString) {
              const [month, day, year] = dateString.split('/').map(Number);
              const dateObj = new Date(year, month - 1, day);
              if (!isNaN(dateObj.getTime())) {
                receipt_date = dateObj.toISOString().split('T')[0];
              }
            }
          } catch (err) {
            console.error(`Date parsing error for row ${i+1}:`, err);
          }
  
          if (!receipt_date) {
            skippedReasons.push(`Row ${i+1}: Invalid date format (${dateString})`);
            continue;
          }
  
          // Extract values with correct column mapping
          const receipt_no = String(row[COLS.RECEIPT_NO] || '').trim();
          const transaction_no = String(row[COLS.TRANSACTION_NO] || '').trim();
          const from_whom_received = String(row[COLS.FROM_WHOM] || '').trim();
          const manual_number = String(row[COLS.MANUAL_NO] || '').trim();
          const description = String(row[COLS.DESCRIPTION] || '').trim();
          const receipt_type = String(row[COLS.RECEIPT_TYPE] || '').trim();
          const parent_account = String(row[COLS.PARENT_ACCOUNT] || '').trim();
          const account_credited = String(row[COLS.ACCOUNT_CREDITED] || '').trim();
          const account_debited = String(row[COLS.ACCOUNT_DEBITED] || '').trim();
          
          // Parse amounts - remove commas and convert to numbers
          const cash = parseFloat(String(row[COLS.CASH] || '0').replace(/,/g, '')) || 0;
          const bank = parseFloat(String(row[COLS.BANK] || '0').replace(/,/g, '')) || 0;
  
          // Validate required fields
          if (!receipt_no && !manual_number) {
            skippedReasons.push(`Row ${i+1}: Missing both receipt_no and manual_number`);
            continue;
          }
  
          if (!from_whom_received) {
            skippedReasons.push(`Row ${i+1}: Missing recipient`);
            continue;
          }
  
          if (cash === 0 && bank === 0) {
            skippedReasons.push(`Row ${i+1}: Both cash and bank amounts are zero`);
            continue;
          }
  
          journalsToUpload.push({
            receipt_date,
            receipt_no,
            manual_number,
            ref_no: transaction_no,
            from_whom_received,
            description,
            receipt_type,
            parent_account,
            account_credited,
            account_debited,
            cash,
            bank
          });
        }
  
        console.log(`Found ${journalsToUpload.length} valid journals to upload`);
        console.log('Sample journal:', journalsToUpload[0]);
        console.log('Skipped reasons (first 10):', skippedReasons.slice(0, 10));
  
        if (journalsToUpload.length === 0) {
          throw new Error(`No valid journals found. First reasons:\n${
            skippedReasons.slice(0, 10).join('\n')
          }${skippedReasons.length > 10 ? '\n...and more' : ''}`);
        }
  
        // Rest of your upload logic...
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing');
          return;
        }
  
        let successCount = 0;
        const uploadErrors = [];
  
        for (const journal of journalsToUpload) {
          try {
            const response = await fetch(`${api}/cash-receipt-journals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(journal),
            });
  
            if (!response.ok) {
              const error = await response.json();
              uploadErrors.push(`Receipt ${journal.receipt_no}: ${error.error || response.statusText}`);
              continue;
            }
            successCount++;
          } catch (err) {
            uploadErrors.push(`Receipt ${journal.receipt_no}: ${err.message}`);
          }
        }
  
        // Show results
        let resultMessage = `${successCount} journals uploaded successfully!`;
        if (uploadErrors.length > 0) {
          resultMessage += `\n\n${uploadErrors.length} errors:\n${uploadErrors.slice(0, 5).join('\n')}`;
        }
        alert(resultMessage);
        fetchJournals(); // Refresh the UI
  
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
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
      label: `Invoice ${invoice.invoice_number} - ${formatCurrency(parseFloat(invoice.amount))}`,
    }));

  const debitAccountOptions = getDebitAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  const creditedAccountOptions = getCreditedAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  const parentAccountOptions = coa.filter(account => account.parent_account).map((account) => ({
    value: account.parent_account,
    label: account.parent_account,
  }));

  const filteredJournals = journals.filter((journal) =>
    journal.from_whom_received.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => openFormPopup()}>Add New Receipt</button>
      <button onClick={handleExportToExcel} style={{ marginLeft: '10px' }}>
        <FontAwesomeIcon icon={faFileExcel} className="icon" /> Export to Excel
      </button>
      <button onClick={handleDeleteAll} style={{ marginLeft: '10px' }}>
        Delete All
      </button>
      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center' }}>
        <label htmlFor="file-upload" style={{ marginRight: '10px' }}>Upload Excel File:</label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
      <input
        type="text"
        placeholder="Search by Customer"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '10px', padding: '5px' }}
      />
      {showForm && (
        <div className="form-popup">
          <h3>{isEditing ? 'Edit Receipt' : 'Add New Receipt'}</h3>
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-row">
              <label> Date:</label>
              <input
                type="date"
                name="receipt_date"
                value={formData.receipt_date}
                onChange={handleInputChange}
                required
                className="form-inputs"
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
              <label>Manual Receipt No:</label>
              <input
                type="text"
                name="manual_number"
                value={formData.manual_number}
                onChange={handleInputChange}
                className="form-input"
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
              <label>Balance:</label>
              <input
                type="text"
                value={balance}
                readOnly
                className="form-input read-only"
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
                <option></option>
                <option value="Cash">Cash</option>
                <option value="Invoiced">Invoiced</option>
              </select>
            </div>
            <div className="form-row">
              <label>Parent Account:</label>
              <select
                name="parent_account"
                value={formData.parent_account}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Parent Account</option>
                {parentAccountOptions.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
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
                type="text"
                name="cash"
                value={formData.cash}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <label>Bank:</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-row">
              <label>Total:</label>
              <input
                type="text"
                name="total"
                value={formData.total}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                {loading ? 'Submitting...' : isEditing ? 'Update Receipt' : 'Submit Receipt'}
              </button>
              <button type="button" onClick={closeFormPopup} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
     <table border="1" cellPadding="5">
  <thead>
    <tr>
      <th>Id</th>
      <th>Date</th>
      <th>Receipt No</th>
      <th>Manual R. Number</th>
      <th>Reference No</th>
      <th>From Whom Received</th>
      <th>Description</th>
      <th>Receipt Type</th>
      <th>Parent Account</th>
      <th>Credited Account</th>
      <th>Debited Account</th>
      <th>Total</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredJournals
      .slice() // Create a copy to avoid mutating original
      .sort((a, b) => a.id - b.id) // Sort by ID ascending
      .map((journal) => {
        const isDeleted = journal.isDeleted;
        const rowStyle = {
          textDecoration: isDeleted ? 'line-through' : 'none',
          backgroundColor: isDeleted ? '#ffcccc' : 'transparent'
        };

        return (
          <tr key={journal.id} style={rowStyle}>
            <td>{journal.id}</td>
            <td>{journal.receipt_date}</td>
            <td>{journal.receipt_no}</td>
            <td>{journal.manual_number}</td>
            <td>{journal.ref_no}</td>
            <td>{journal.from_whom_received}</td>
            <td>{journal.description}</td>
            <td>{journal.receipt_type}</td>
            <td>{journal.parent_account}</td>
            <td>{journal.account_credited}</td>
            <td>{journal.account_debited}</td>
            <td>{formatCurrency(parseFloat(journal.total))}</td>
            <td>
              {!isDeleted ? (
                <>
                  <button onClick={() => openFormPopup(journal)}>Edit</button>
                  <button onClick={() => handleDelete(journal.id)}>Delete</button>
                  <button onClick={() => printReceipt(journal)}>Print</button>
                </>
              ) : (
                <span>Deleted</span>
              )}
            </td>
          </tr>
        );
      })}
  </tbody>
</table>

    </div>
  );
};

export default CashReceiptJournalTable;
