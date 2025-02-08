import React, { useState, useEffect } from "react";
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
  const [totalDisbursed, setTotalDisbursed] = useState(0); // Total disbursed amount

  // Fetch COA, Payees, Invoices, and Disbursements on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Unauthorized: Missing token.");
        return;
      }

      try {
        // Fetch Chart of Accounts
        const coaResponse = await fetch("http://127.0.0.1:5000/chart-of-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!coaResponse.ok) throw new Error("Failed to fetch COA.");
        const coaData = await coaResponse.json();
        setCoaAccounts(coaData);

        // Fetch Payees
        const payeesResponse = await fetch("http://127.0.0.1:5000/payee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!payeesResponse.ok) throw new Error("Failed to fetch payees.");
        const payeesData = await payeesResponse.json();
        setPayees(payeesData);

        // Fetch Invoices
        const invoicesResponse = await fetch("http://127.0.0.1:5000/invoice-received", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!invoicesResponse.ok) throw new Error("Failed to fetch invoices.");
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);

        // Fetch Disbursements
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Recalculate total if cash or bank changes
      if (name === "cash" || name === "bank") {
        updatedData.total = calculateTotal(updatedData.cash, updatedData.bank);
      }

      return updatedData;
    });

    // Recalculate balance and total disbursed when payee changes
    if (name === "to_whom_paid") {
      calculateBalanceAndTotalDisbursed(value);
    }
  };

  // Calculate total amount
  const calculateTotal = (cash, bank) => {
    return parseFloat(cash || 0) + parseFloat(bank || 0);
  };

  // Calculate balance and total disbursed for the selected payee
  const calculateBalanceAndTotalDisbursed = (payeeName) => {
    // Filter invoices for the selected payee
    const payeeInvoices = invoices.filter(
      (invoice) => invoice.name === payeeName
    );

    // Calculate total invoice amount
    const totalInvoiceAmount = payeeInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.amount || 0),
      0
    );

    // Filter disbursements for the selected payee
    const payeeDisbursements = disbursements.filter(
      (disbursement) => disbursement.to_whom_paid === payeeName
    );

    // Calculate total disbursed amount
    const totalDisbursedAmount = payeeDisbursements.reduce(
      (sum, disbursement) => sum + parseFloat(disbursement.total || 0),
      0
    );

    // Calculate balance
    const payeeBalance = totalInvoiceAmount - totalDisbursedAmount;
    setBalance(payeeBalance);

    // Set total disbursed amount
    setTotalDisbursed(totalDisbursedAmount);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Unauthorized: Missing token.");
      return;
    }

    // Prepare payload
    const payload = {
      ...formData,
      disbursement_date: new Date(formData.disbursement_date).toISOString().split("T")[0],
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
        method: "POST",
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

      const result = await response.json();

      // Refresh the disbursements list after submission
      const disbursementsResponse = await fetch("http://127.0.0.1:5000/cash-disbursement-journals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!disbursementsResponse.ok) throw new Error("Failed to fetch disbursements.");
      const disbursementsData = await disbursementsResponse.json();
      setDisbursements(disbursementsData);

      alert("Disbursement added successfully!");
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
      setShowForm(false); // Close the popup after submission
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Get debit accounts based on payment type
  const getDebitAccounts = () => {
    if (formData.payment_type === "Cash") {
      // Handle Cash disbursements: Filter for all accounts except those with "50-Expenses"
      const cashAccounts = coaAccounts.flatMap((account) => {
        const validSubAccounts = account.sub_account_details?.filter(
          (subAccount) => subAccount.account_type !== "50-Expenses"
        );
        return validSubAccounts || [];
      });
      return cashAccounts;
    } else if (formData.payment_type === "Invoiced") {
      // Handle Invoiced disbursements: Only pull the "2250-Trade Creditors Control Account"
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

  // Get credit accounts based on payment type
  const getCreditAccounts = () => {
    // Always find the account with the parent_account "1000"
    const liabilitiesAccount = coaAccounts.find(
      (account) => account.parent_account === "1000"
    );
    return liabilitiesAccount?.sub_account_details || [];
  };

  // Open the form popup
  const openFormPopup = () => {
    setShowForm(true);
  };

  // Close the form popup
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
  };

  return (
    <div className="disbursement-container">
      <h1>Cash Disbursement Journal</h1>
      <button onClick={openFormPopup} className="add-button">
        Add New Disbursement
      </button>

      {showForm && (
        <div className="form-popup">
          <div className="form-container">
            <h2>Cash Disbursement Form</h2>
            <form onSubmit={handleSubmit}>
              {/* Disbursement Date */}
              <div className="form-row">
                <label htmlFor="disbursement_date">Disbursement Date</label>
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

              {/* Cheque No */}
              <div className="form-row">
                <label htmlFor="cheque_no">Cheque No</label>
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

              {/* Payment Voucher No */}
              <div className="form-row">
                <label htmlFor="p_voucher_no">Payment Voucher No</label>
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

              {/* To Whom Paid (Payee) */}
              <div className="form-row">
                <label htmlFor="to_whom_paid">To Whom Paid</label>
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

              {/* Balance */}
              <div className="form-row">
                <label>Balance</label>
                <input
                  type="text"
                  value={balance}
                  readOnly
                  className="form-input"
                />
              </div>

              {/* Total Disbursed */}
              <div className="form-row">
                <label>Total Disbursed</label>
                <input
                  type="text"
                  value={totalDisbursed}
                  readOnly
                  className="form-input"
                />
              </div>

              {/* Description */}
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

              {/* Payment Type */}
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

              {/* Account Debited */}
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

              {/* Account Credited */}
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

              {/* Cash Amount */}
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

              {/* Bank Amount */}
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

              {/* Total Amount */}
              <div className="form-row">
                <label>Total</label>
                <input
                  type="text"
                  value={formData.total}
                  readOnly
                  className="form-input"
                />
              </div>

              {/* Cashbook */}
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

              {/* Submit Button */}
              <div className="form-row">
                <button type="submit" className="submit-button">
                  Submit
                </button>
                <button type="button" onClick={closeFormPopup} className="cancel-button">
                  Cancel
                </button>
              </div>

              {/* Display error messages */}
              {errorMessage && <div className="error-message">{errorMessage}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Table to display disbursements */}
      <div className="submitted-disbursements">
        <h2>Disbursements</h2>
        <table>
          <thead>
            <tr>
              <th>Disbursement Date</th>
              <th>Cheque No</th>
              <th>Payment Voucher No</th>
              <th>To Whom Paid</th>
              <th>Description</th>
              <th>Payment Type</th>
              <th>Account Debited</th>
              <th>Account Credited</th>
              <th>Cash</th>
              <th>Bank</th>
              <th>Total</th>
              <th>Cashbook</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisbursementForm;