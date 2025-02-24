import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faCalendar, faFileAlt, faUser, faDollarSign, faWallet, faBook } from "@fortawesome/free-solid-svg-icons";
import "./DisbursementForm.css";

const DisbursementForm = () => {
  const [formData, setFormData] = useState({
    disbursement_date: "",
    cheque_no: "",
    p_voucher_no: "",
    to_whom_paid: "",
    description: "",
    payment_type: "",
    account_debited: "",
    account_credited: "",
    cash: 0,
    bank: 0,
    total: 0,
    cashbook: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [balance, setBalance] = useState(0);
  const [disbursements, setDisbursements] = useState([]);
  const [totalDisbursed, setTotalDisbursed] = useState(0);
  const [editingDisbursement, setEditingDisbursement] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Unauthorized: Missing token.");
        return;
      }

      try {
        const coaResponse = await fetch("http://127.0.0.1:5000/chart-of-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!coaResponse.ok) throw new Error("Failed to fetch COA.");
        const coaData = await coaResponse.json();
        setCoaAccounts(coaData);

        const payeesResponse = await fetch("http://127.0.0.1:5000/payee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!payeesResponse.ok) throw new Error("Failed to fetch payees.");
        const payeesData = await payeesResponse.json();
        setPayees(payeesData);

        const invoicesResponse = await fetch("http://127.0.0.1:5000/invoice-received", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!invoicesResponse.ok) throw new Error("Failed to fetch invoices.");
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);

        const disbursementsResponse = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
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

    if (name === "to_whom_paid") {
      calculateBalanceAndTotalDisbursed(value);
    }
  };

  const calculateTotal = (cash, bank) => {
    return parseFloat(cash || 0) + parseFloat(bank || 0);
  };

  const calculateBalanceAndTotalDisbursed = (payeeName) => {
    const payeeInvoices = invoices.filter(
      (invoice) => invoice.name === payeeName
    );

    const totalInvoiceAmount = payeeInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount || 0),
      0
    );

    const payeeDisbursements = disbursements.filter(
      (disbursement) => disbursement.to_whom_paid === payeeName
    );

    const totalDisbursedAmount = payeeDisbursements.reduce(
      (sum, disbursement) => sum + parseFloat(disbursement.total || 0),
      0
    );

    const payeeBalance = totalInvoiceAmount - totalDisbursedAmount;
    setBalance(payeeBalance);

    setTotalDisbursed(totalDisbursedAmount);
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
    };

    try {
      let response;
      if (editingDisbursement) {
        response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${editingDisbursement.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
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

      const result = await response.json();

      const disbursementsResponse = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData);

      alert(editingDisbursement ? "Disbursement updated successfully!" : "Disbursement added successfully!");
      setFormData({
        disbursement_date: "",
        cheque_no: "",
        p_voucher_no: "",
        to_whom_paid: "",
        description: "",
        payment_type: "",
        account_debited: "",
        account_credited: "",
        cash: 0,
        bank: 0,
        total: 0,
        cashbook: "",
      });
      setErrorMessage("");
      setShowForm(false);
      setEditingDisbursement(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleUpdateDisbursement = async (id, updatedData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Unauthorized: Missing token.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();

      const disbursementsResponse = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData);

      alert("Disbursement updated successfully!");
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
      const response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const disbursementsResponse = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
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
      account_debited: disbursement.account_debited,
      account_credited: disbursement.account_credited,
      cash: disbursement.cash,
      bank: disbursement.bank,
      total: disbursement.total,
      cashbook: disbursement.cashbook,
    });
    setShowForm(true);
  };

  const getDebitAccounts = () => {
    if (formData.payment_type === "Cash") {
      const cashAccounts = coaAccounts.flatMap((account) => {
        const validSubAccounts = account.sub_account_details?.filter(
          (subAccount) => subAccount.account_type !== "50-Expenses"
        );
        return validSubAccounts || [];
      });
      return cashAccounts;
    } else if (formData.payment_type === "Invoiced") {
      const invoicedAccount = coaAccounts.flatMap((account) => {
        if (account.account_name === "200-current Liabilities") {
          return account.sub_account_details?.filter(
            (subAccount) => subAccount.name === "2250-Trade Creditors Control Account"
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
    const liabilitiesAccount = coaAccounts.find(
      (account) => account.parent_account === "1000"
    );
    return liabilitiesAccount?.sub_account_details || [];
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
      account_debited: "",
      account_credited: "",
      cash: 0,
      bank: 0,
      total: 0,
      cashbook: "",
    });
    setErrorMessage("");
    setEditingDisbursement(null);
  };

  return (
    <div className="disbursement-container">
  <h1 className="head">
        <FontAwesomeIcon icon={faWallet} className="icon" /> Cash disbursement Journal
      </h1>      <button onClick={openFormPopup} className="add-button">
        <FontAwesomeIcon icon={faPlus} className="icon" /> Add New Disbursement
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
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label htmlFor="to_whom_paid">
                  <FontAwesomeIcon icon={faUser} className="icon" /> To Whom Paid
                </label>
                <select
                  id="to_whom_paid"
                  name="to_whom_paid"
                  value={formData.to_whom_paid}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Payee</option>
                  {payees.flatMap((payee) =>
                    payee.sub_account_details?.map((subAccount) => (
                      <option key={subAccount.id} value={subAccount.name}>
                        {subAccount.name}
                      </option>
                    )) || []
                  )}
                </select>
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
                <label>Total Disbursed</label>
                <input
                  type="text"
                  value={totalDisbursed}
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
                <label htmlFor="account_debited">Account Debited</label>
                <select
                  id="account_debited"
                  name="account_debited"
                  value={formData.account_debited}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Account Debited</option>
                  {getDebitAccounts().map((subAccount, index) => (
                    <option key={index} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="account_credited">Account Credited</label>
                <select
                  id="account_credited"
                  name="account_credited"
                  value={formData.account_credited}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Account Credited</option>
                  {getCreditAccounts().map((subAccount, index) => (
                    <option key={index} value={subAccount.name}>
                      {subAccount.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="cash">Cash Amount</label>
                <input
                  type="number"
                  id="cash"
                  name="cash"
                  value={formData.cash}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label htmlFor="bank">Bank Amount</label>
                <input
                  type="number"
                  id="bank"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label>Total</label>
                <input
                  type="text"
                  value={formData.total}
                  readOnly
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label htmlFor="cashbook">Cashbook</label>
                <input
                  type="text"
                  id="cashbook"
                  name="cashbook"
                  value={formData.cashbook}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <button type="submit" className="submit-button">
                  {editingDisbursement ? (
                    <>
                      <FontAwesomeIcon icon={faEdit} className="icon" /> Update
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="icon" /> Submit
                    </>
                  )}
                </button>
                <button type="button" onClick={closeFormPopup} className="cancel-button">
                  Cancel
                </button>
              </div>

              {errorMessage && <div className="error-message">{errorMessage}</div>}
            </form>
          </div>
        </div>
      )}

      <div className="submitted-disbursements">
        <h2>Disbursements</h2>
        <table>
          <thead>
            <tr >
              <th className="ths">Disbursement Date</th>
              <th className="ths">Cheque No</th>
              <th className="ths">Payment Voucher No</th>
              <th className="ths">To Whom Paid</th>
              <th className="ths">Description</th>
              <th className="ths">Payment Type</th>
              <th className="ths">Account Debited</th>
              <th className="ths">Account Credited</th>
              <th className="ths">Cash</th>
              <th className="ths">Bank</th>
              <th className="ths">Total</th>
              <th className="ths">Cashbook</th>
              <th className="ths">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disbursements.map((disbursement, index) => (
              <tr key={index}>
                <td>{disbursement.disbursement_date}</td>
                <td>{disbursement.cheque_no}</td>
                <td>{disbursement.p_voucher_no}</td>
                <td>{disbursement.to_whom_paid}</td>
                <td>{disbursement.description}</td>
                <td>{disbursement.payment_type}</td>
                <td>{disbursement.account_debited}</td>
                <td>{disbursement.account_credited}</td>
                <td>{disbursement.cash}</td>
                <td>{disbursement.bank}</td>
                <td>{disbursement.total}</td>
                <td>{disbursement.cashbook}</td>
                <td>
                  <button
                    onClick={() => handleEditClick(disbursement)}
                    className="edit-button"
                  >
                    <FontAwesomeIcon icon={faEdit} className="icon" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDisbursement(disbursement.id)}
                    className="delete-button"
                  >
                    <FontAwesomeIcon icon={faTrash} className="icon" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisbursementForm;