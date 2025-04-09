import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faCalendar,
  faFileAlt,
  faUser,
  faDollarSign,
  faWallet,
  faBook,
  faPrint,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import "./DisbursementForm.css";
import * as XLSX from 'xlsx';

const api = 'https://yoming.boogiecoin.com';

const DisbursementForm = () => {
  const [formData, setFormData] = useState({
    disbursement_date: "",
    cheque_no: "",
    p_voucher_no: "",
    to_whom_paid: "",
    description: "",
    payment_type: "",
    manual_number: "",
    account_debited: "",
    account_credited: "",
    cash: "0.00",
    bank: "0.00",
    total: "0.00",
    cashbook: "",
    parent_account: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [disbursements, setDisbursements] = useState([]);
  const [totalDisbursed, setTotalDisbursed] = useState(0);
  const [editingDisbursement, setEditingDisbursement] = useState(null);
  const [printableDisbursement, setPrintableDisbursement] = useState(null);
  const printRef = useRef();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ksh',
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
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Unauthorized: Missing token.");
        return;
      }
      try {
        const coaResponse = await fetch(`${api}/chart-of-accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!coaResponse.ok) throw new Error("Failed to fetch COA(token expired).");
        const coaData = await coaResponse.json();
        setCoaAccounts(coaData);

        const payeesResponse = await fetch(`${api}/payee`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!payeesResponse.ok) throw new Error("Failed to fetch payees.");
        const payeesData = await payeesResponse.json();
        setPayees(payeesData);

        const invoicesResponse = await fetch(`${api}/invoice-received`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!invoicesResponse.ok) throw new Error("Failed to fetch invoices.");
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);

        const disbursementsResponse = await fetch(`${api}/cash-disbursement-journals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
        const disbursementsData = await disbursementsResponse.json();
        setDisbursements(disbursementsData);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };
      if (name === "cash" || name === "bank") {
        updatedData.total = calculateTotal(updatedData.cash, updatedData.bank);
      }
      return updatedData;
    });
  };

  const calculateTotal = (cash, bank) => {
    return formatCurrency(parseFloat(cash.replace(/[^\d.-]/g, '')) + parseFloat(bank.replace(/[^\d.-]/g, '')));
  };

  const calculateBalanceAndTotalDisbursed = (payeeName) => {
    console.log("Calculating balance for:", payeeName);
    const payeeInvoices = invoices.filter((invoice) => invoice.name === payeeName);
    const totalInvoiceAmount = payeeInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount || 0),
      0
    );
    const payeeDisbursements = disbursements.filter(
      (disbursement) => disbursement.to_whom_paid === payeeName
    );
    const totalDisbursedAmount = payeeDisbursements.reduce(
      (sum, disbursement) => {
        const totalAsString = typeof disbursement.total === 'string'
          ? disbursement.total
          : disbursement.total.toString();
        return sum + parseFloat(totalAsString.replace(/[^\d.-]/g, ''));
      },
      0
    );
    const payeeBalance = formatCurrency(totalInvoiceAmount - totalDisbursedAmount);
    console.log("Calculated balance:", payeeBalance);
    setBalance(payeeBalance);
    setTotalDisbursed(formatCurrency(totalDisbursedAmount));
  };

  const generateUniqueVoucherNumber = (existingVouchers) => {
    if (existingVouchers.length === 0) {
      return "PV-1";
    }
    const highestVoucherNumber = existingVouchers.reduce((max, voucher) => {
      const number = parseInt(voucher.p_voucher_no.split("-")[1]);
      return number > max ? number : max;
    }, 0);
    return `PV-${highestVoucherNumber + 1}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Unauthorized: Missing token.");
      return;
    }

    const payload = {
      ...formData,
      disbursement_date: new Date(formData.disbursement_date).toISOString().split("T")[0],
      p_voucher_no: editingDisbursement ? formData.p_voucher_no : generateUniqueVoucherNumber(disbursements),
      manual_number: formData.manual_number || null,
      cash: parseFloat(formData.cash.replace(/[^\d.-]/g, '')),
      bank: parseFloat(formData.bank.replace(/[^\d.-]/g, '')),
      total: parseFloat(formData.total.replace(/[^\d.-]/g, '')),
    };

    console.log("Payload being sent:", payload);

    try {
      let response;
      if (editingDisbursement) {
        // Update existing entry using PUT method
        response = await fetch(`${api}/cash-disbursement-journals/${editingDisbursement.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new entry using POST method
        response = await fetch(`${api}/cash-disbursement-journals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Fetch updated disbursements data
      const disbursementsResponse = await fetch(`${api}/cash-disbursement-journals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData);

      alert(editingDisbursement ? "Disbursement updated successfully!" : "Disbursement added successfully!");

      // Reset form data
      setFormData({
        disbursement_date: "",
        cheque_no: "",
        p_voucher_no: "",
        to_whom_paid: "",
        description: "",
        payment_type: "",
        manual_number: "",
        account_debited: "",
        account_credited: "",
        cash: "0.00",
        bank: "0.00",
        total: "0.00",
        cashbook: "",
        parent_account: "",
      });
      setErrorMessage("");
      setShowForm(false);
      setEditingDisbursement(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteDisbursement = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Unauthorized: Missing token.");
      return;
    }
    try {
      const response = await fetch(`${api}/cash-disbursement-journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const disbursementsResponse = await fetch(`${api}/cash-disbursement-journals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData);
      alert("Disbursement deleted successfully!");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditClick = (disbursement) => {
    setEditingDisbursement(disbursement);
    setFormData({
      disbursement_date: disbursement.disbursement_date,
      cheque_no: disbursement.cheque_no,
      p_voucher_no: disbursement.p_voucher_no,
      to_whom_paid: disbursement.to_whom_paid,
      description: disbursement.description,
      payment_type: disbursement.payment_type,
      manual_number: disbursement.manual_number || "",
      account_debited: disbursement.account_debited,
      account_credited: disbursement.account_credited,
      cash: formatCurrency(parseFloat(disbursement.cash)),
      bank: formatCurrency(parseFloat(disbursement.bank)),
      total: formatCurrency(parseFloat(disbursement.total)),
      cashbook: disbursement.cashbook,
      parent_account: disbursement.parent_account,
    });
    setShowForm(true);
  };

  const getDebitAccounts = () => {
    if (formData.payment_type === "Cash") {
      const cashAccounts = coaAccounts.flatMap((account) => {
        const validSubAccounts = account.sub_account_details?.filter(
          (subAccount) => subAccount.account_type !== "40-Revenue"
        );
        return validSubAccounts || [];
      });
      return cashAccounts;
    } else if (formData.payment_type === "Invoiced") {
      const invoicedAccount = coaAccounts.flatMap((account) => {
        if (account.account_name === "200-Current Liabilities") {
          return account.sub_account_details?.filter(
            (subAccount) => subAccount.name === "2250- Trade Creditors Control Account"
          ) || [];
        }
        return [];
      });
      return invoicedAccount;
    } else {
      return [];
    }
  };

  const getCreditAccounts = () => {
    const assetsAccount = coaAccounts.find(
      (account) => account.account_name === "100-Current Assets"
    );
    return assetsAccount?.sub_account_details || [];
  };

  const openFormPopup = () => {
    setShowForm(true);
  };

  const closeFormPopup = () => {
    setShowForm(false);
    setFormData({
      disbursement_date: "",
      cheque_no: "",
      p_voucher_no: "",
      to_whom_paid: "",
      description: "",
      payment_type: "",
      manual_number: "",
      account_debited: "",
      account_credited: "",
      cash: "$0.00",
      bank: "$0.00",
      total: "$0.00",
      cashbook: "",
      parent_account: "",
    });
    setErrorMessage("");
    setEditingDisbursement(null);
  };

  const openPrintableView = (disbursement) => {
    setPrintableDisbursement(disbursement);
    setTimeout(() => {
      window.print();
      closePrintableView();
    }, 100);
  };

  const closePrintableView = () => {
    setPrintableDisbursement(null);
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(disbursements);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Disbursements');
    XLSX.writeFile(workbook, 'disbursements.xlsx');
  };

  const payeeOptions = payees.flatMap((payee) =>
    payee.sub_account_details?.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    })) || []
  );

  const debitAccountOptions = getDebitAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  const creditAccountOptions = getCreditAccounts().map((subAccount) => ({
    value: subAccount.name,
    label: subAccount.name,
  }));

  return (
    <div className="disbursement-container">
      <h1 className="head">
        <FontAwesomeIcon icon={faWallet} className="icon" /> Cash Disbursement Journal
      </h1>
      <button onClick={openFormPopup} className="add-button">
        <FontAwesomeIcon icon={faPlus} className="icon" /> Add New Disbursement
      </button>
      <button onClick={handleExportToExcel} className="export-button">
        <FontAwesomeIcon icon={faFileExcel} className="icon" /> Export to Excel
      </button>
      {showForm && (
        <div className="form-popup">
          <div className="form-container">
            <h2>{editingDisbursement ? "Edit Disbursement" : "Cash Disbursement Form"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="disbursement_date">
                  <FontAwesomeIcon icon={faCalendar} className="icon" /> Disbursement Date
                </label>
                <input
                  type="date"
                  id="disbursement_date"
                  name="disbursement_date"
                  value={formData.disbursement_date}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="cheque_no">
                  <FontAwesomeIcon icon={faFileAlt} className="icon" /> Cheque No
                </label>
                <input
                  type="text"
                  id="cheque_no"
                  name="cheque_no"
                  value={formData.cheque_no}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="p_voucher_no">
                  <FontAwesomeIcon icon={faFileAlt} className="icon" /> Payment Voucher No
                </label>
                <input
                  type="text"
                  id="p_voucher_no"
                  name="p_voucher_no"
                  value={formData.p_voucher_no}
                  onChange={handleInputChange}
                  readOnly
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="manual_number">Manual PV Number</label>
                <input
                  type="text"
                  id="manual_number"
                  name="manual_number"
                  value={formData.manual_number}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="to_whom_paid">
                  <FontAwesomeIcon icon={faUser} className="icon" /> To Whom Paid
                </label>
                <Select
                  value={payeeOptions.find((option) => option.value === formData.to_whom_paid)}
                  onChange={(selectedOption) => {
                    setFormData((prev) => ({
                      ...prev,
                      to_whom_paid: selectedOption.value,
                    }));
                    calculateBalanceAndTotalDisbursed(selectedOption.value);
                  }}
                  options={payeeOptions}
                  placeholder="Select Payee"
                  isSearchable
                  styles={customStyles}
                />
              </div>
              <div className="form-row">
                <label>Balance</label>
                <input
                  type="text"
                  value={balance}
                  readOnly
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="payment_type">Payment Type</label>
                <select
                  id="payment_type"
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Payment Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Invoiced">Invoiced</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="parent_account">Parent Account:</label>
                <select
                  name="parent_account"
                  value={formData.parent_account}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Parent Account</option>
                  {coaAccounts.filter(account => account.parent_account).map((account) => (
                    <option key={account.id} value={account.parent_account}>
                      {account.parent_account}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="account_debited">Account Debited</label>
                <Select
                  value={debitAccountOptions.find((option) => option.value === formData.account_debited)}
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
                <label htmlFor="account_credited">Account Credited</label>
                <Select
                  value={creditAccountOptions.find((option) => option.value === formData.account_credited)}
                  onChange={(selectedOption) =>
                    setFormData((prev) => ({
                      ...prev,
                      account_credited: selectedOption.value,
                    }))
                  }
                  options={creditAccountOptions}
                  placeholder="Select Account Credited"
                  isSearchable
                  styles={customStyles}
                />
              </div>
              <div className="form-row">
                <label htmlFor="cash">
                  <FontAwesomeIcon icon={faDollarSign} className="icon" /> Cash
                </label>
                <input
                  type="text"
                  id="cash"
                  name="cash"
                  value={formData.cash}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="bank">
                  <FontAwesomeIcon icon={faBook} className="icon" /> Bank
                </label>
                <input
                  type="text"
                  id="bank"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <label htmlFor="total">
                  <FontAwesomeIcon icon={faWallet} className="icon" /> Total
                </label>
                <input
                  type="text"
                  id="total"
                  name="total"
                  value={formData.total}
                  readOnly
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  <FontAwesomeIcon icon={faWallet} className="icon" /> {editingDisbursement ? "Update" : "Submit"}
                </button>
                <button type="button" onClick={closeFormPopup} className="cancel-button">
                  <FontAwesomeIcon icon={faTrash} className="icon" /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="disbursements-list">
          <h2>Disbursements</h2>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {disbursements.length > 0 ? (
            <table className="disbursements-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cheque No</th>
                  <th>Voucher No</th>
                  <th>Manual PV Number</th>
                  <th>To Whom Paid</th>
                  <th>Description</th>
                  <th>Payment Type</th>
                  <th>parent Account</th>
                  <th>Account Debited</th>
                  <th>Account Credited</th>
                  <th>Cash</th>
                  <th>Bank</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disbursements.map((disbursement) => (
                  <tr key={disbursement.id}>
                    <td>{disbursement.disbursement_date}</td>
                    <td>{disbursement.cheque_no}</td>
                    <td>{disbursement.p_voucher_no}</td>
                    <td>{disbursement.manual_number}</td>
                    <td>{disbursement.to_whom_paid}</td>
                    <td>{disbursement.description}</td>
                    <td>{disbursement.payment_type}</td>
                    <td>{disbursement.parent_account}</td>
                    <td>{disbursement.account_debited}</td>
                    <td>{disbursement.account_credited}</td>
                    <td>{formatCurrency(parseFloat(disbursement.cash))}</td>
                    <td>{formatCurrency(parseFloat(disbursement.bank))}</td>
                    <td>{formatCurrency(parseFloat(disbursement.total))}</td>
                    <td>
                      <button onClick={() => handleEditClick(disbursement)} className="edit-button">
                        <FontAwesomeIcon icon={faEdit} className="icon" /> Edit
                      </button>
                      <button onClick={() => handleDeleteDisbursement(disbursement.id)} className="delete-button">
                        <FontAwesomeIcon icon={faTrash} className="icon" /> Delete
                      </button>
                      <button onClick={() => openPrintableView(disbursement)} className="print-button">
                        <FontAwesomeIcon icon={faPrint} className="icon" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No disbursements available.</p>
          )}
        </div>
      )}
      {printableDisbursement && (
        <div className="printable-voucher" ref={printRef}>
          <Voucher disbursement={printableDisbursement} formatCurrency={formatCurrency} />
        </div>
      )}
    </div>
  );
};

const Voucher = ({ disbursement, formatCurrency }) => {
  return (
    <div className="voucher">
      <h2 className="voucher-title">UNHCR Payment Voucher</h2>
      <table className="voucher-table">
        <tbody>
          <tr>
            <td><strong>Date:</strong></td>
            <td>{disbursement.disbursement_date}</td>
            <td><strong>Cheque No:</strong></td>
            <td>{disbursement.cheque_no}</td>
          </tr>
          <tr>
            <td><strong>Voucher No:</strong></td>
            <td>{disbursement.p_voucher_no}</td>
            <td><strong>To Whom Paid:</strong></td>
            <td>{disbursement.to_whom_paid}</td>
          </tr>
          <tr>
            <td><strong>Description:</strong></td>
            <td colSpan="3">{disbursement.description}</td>
          </tr>
          <tr>
            <td><strong>Payment Type:</strong></td>
            <td>{disbursement.payment_type}</td>
            <td><strong>Account Debited:</strong></td>
            <td>{disbursement.account_debited}</td>
          </tr>
          <tr>
            <td><strong>Account Credited:</strong></td>
            <td>{disbursement.account_credited}</td>
            <td><strong>Cash:</strong></td>
            <td>{formatCurrency(parseFloat(disbursement.cash))}</td>
          </tr>
          <tr>
            <td><strong>Bank:</strong></td>
            <td>{formatCurrency(parseFloat(disbursement.bank))}</td>
            <td><strong>Total:</strong></td>
            <td>{formatCurrency(parseFloat(disbursement.total))}</td>
          </tr>
          <tr>
            <td><strong>Cashbook:</strong></td>
            <td colSpan="3">{disbursement.cashbook}</td>
          </tr>
        </tbody>
      </table>
      <div className="signature-section">
        <table className="signature-table">
          <tbody>
            <tr>
              <td><strong>Paid By:</strong></td>
              <td>____________________</td>
              <td><strong>Signature:</strong></td>
              <td>____________________</td>
            </tr>
            <tr>
              <td><strong>Approved By:</strong></td>
              <td>____________________</td>
              <td><strong>Signature:</strong></td>
              <td>____________________</td>
            </tr>
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .voucher {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          border: 2px solid #0072BC;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .voucher-title {
          text-align: center;
          font-size: 24px;
          margin-bottom: 20px;
          color: #0072BC;
        }
        .voucher-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .voucher-table td {
          padding: 8px;
          border: 1px solid #ddd;
          font-size: 14px;
        }
        .voucher-table strong {
          color: #0072BC;
        }
        .signature-section {
          margin-top: 20px;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signature-table td {
          padding: 8px;
          border: 1px solid #ddd;
          font-size: 14px;
        }
        .signature-table strong {
          color: #0072BC;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .voucher, .voucher * {
            visibility: visible;
          }
          .voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 14px;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DisbursementForm;
