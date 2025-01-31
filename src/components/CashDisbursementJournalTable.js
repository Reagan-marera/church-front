import React, { useState, useEffect } from 'react';
import './DisbursementForm.css';

function DisbursementForm() {
  const [formData, setFormData] = useState({
    disbursement_date: '',
    cheque_no: '',
    p_voucher_no: '',
    to_whom_paid: '',
    description: '',
    account_class: '',
    account_type: '',
    payment_type: '',
    cashbook: '',
    account_credited: '',
    account_debited: '',
    parent_account: '',
    cash: 0.0,
    bank: 0.0,
    total: 0.0,
  });

  const [subAccountData, setSubAccountData] = useState([{ name: '', amount: 0 }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disbursements, setDisbursements] = useState([]);

  useEffect(() => {
    const fetchCOA = async () => {
      const token = localStorage.getItem('token');
      try {
        if (!token) throw new Error('Unauthorized: Missing token.');
        const response = await fetch('http://127.0.0.1:5000/chart-of-accounts', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoaAccounts(data);
        }
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCOA();
  }, []);

  useEffect(() => {
    const fetchPayees = async () => {
      const token = localStorage.getItem('token');
      try {
        if (!token) throw new Error('Unauthorized: Missing token.');
        const response = await fetch('http://127.0.0.1:5000/payee', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setPayees(data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };
    fetchPayees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      if (name === 'cash' || name === 'bank') {
        const newTotal = calculateTotal(updatedData.cash, updatedData.bank);
        updatedData.total = newTotal;
      }

      return updatedData;
    });
  };

  const calculateTotal = (cash, bank, subAccounts = []) => {
    const subAccountTotal = subAccounts.reduce((sum, subAccount) => sum + parseFloat(subAccount.amount || 0), 0);
    return parseFloat(cash || 0) + parseFloat(bank || 0) + subAccountTotal;
  };

  const handleSubAccountChange = (index, name, value) => {
    const updatedSubAccounts = [...subAccountData];
    updatedSubAccounts[index] = { ...updatedSubAccounts[index], [name]: value };
    setSubAccountData(updatedSubAccounts);
  };

  const handleAddSubAccount = () => {
    setSubAccountData([...subAccountData, { name: '', amount: 0 }]);
  };

  const handleRemoveSubAccount = (index) => {
    const updatedSubAccounts = subAccountData.filter((_, i) => i !== index);
    setSubAccountData(updatedSubAccounts);
    calculateTotal(formData.cash, formData.bank, updatedSubAccounts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const subTotal = subAccountData.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
    
    if (formData.total !== subTotal) {
      setErrorMessage('Total amount does not match the sum of sub-accounts.');
      return;
    }

    const formattedSubAccounts = subAccountData.reduce((acc, { name, amount }) => {
      if (name && amount) acc[name] = parseFloat(amount);
      return acc;
    }, {});
    
    const formattedDate = new Date(formData.disbursement_date).toISOString().split('T')[0];
    
    const payload = {
      ...formData,
      disbursement_date: formattedDate,
      sub_accounts: formattedSubAccounts,
    };

    try {
      let response;
      if (formData.id) {
        response = await fetch(`http://127.0.0.1:5000/cash-disbursement-journals/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://127.0.0.1:5000/cash-disbursement-journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.message || 'Failed to submit data');
      }

      const result = await response.json();

      if (formData.id) {
        setDisbursements(disbursements.map((disbursement) =>
          disbursement.id === result.id ? result : disbursement
        ));
      } else {
        setDisbursements([...disbursements, result]);
      }

      alert(formData.id ? 'Disbursement updated successfully!' : 'Disbursement added successfully!');
      setErrorMessage("");
      setFormData({});
      setSubAccountData([]);
      window.location.reload();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEdit = (disbursement) => {
    setFormData({
      id: disbursement.id,
      disbursement_date: disbursement.disbursement_date,
      cheque_no: disbursement.cheque_no,
      p_voucher_no: disbursement.p_voucher_no,
      to_whom_paid: disbursement.to_whom_paid,
      description: disbursement.description,
      account_class: disbursement.account_class,
      account_type: disbursement.account_type,
      payment_type: disbursement.payment_type,
      cashbook: disbursement.cashbook,
      account_credited: disbursement.account_credited,
      account_debited: disbursement.account_debited,
      parent_account: disbursement.parent_account,
      cash: disbursement.cash,
      bank: disbursement.bank,
      total: disbursement.total,
    });

    const formattedSubAccounts = Object.entries(disbursement.sub_accounts || {}).map(([name, amount]) => ({ name, amount }));
    setSubAccountData(formattedSubAccounts);
  };

  return (
    <div className="disbursement-form-container">
      <h2 className="form-header">Cash Disbursement Form</h2>
      <form onSubmit={handleSubmit} className="form">
        {/* Add other form fields as before */}
        <div className="form-row">
          <label htmlFor="disbursement_date">Disbursement Date</label>
          <input
            type="date"
            id="disbursement_date"
            name="disbursement_date"
            value={formData.disbursement_date}
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* To Whom Paid */}
        <div className="form-row">
          <label htmlFor="to_whom_paid">To Whom Paid</label>
          <input
            type="text"
            id="to_whom_paid"
            name="to_whom_paid"
            value={formData.to_whom_paid}
            onChange={handleChange}
            required
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
            onChange={handleChange}
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
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Payment Type</option>
            <option value="Cash">Cash</option>
            <option value="Invoiced">Invoiced</option>
          </select>
        </div>

        {/* Cashbook */}
        <div className="form-row">
          <label htmlFor="cashbook">Cashbook</label>
          <input
            type="text"
            id="cashbook"
            name="cashbook"
            value={formData.cashbook}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        {/* Account Debited and Credited */}
        <div className="form-row">
          <select
            name="account_debited"
            value={formData.account_debited}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Select Account Debited</option>
            {coaAccounts.map((account) =>
              account.sub_account_details?.map((subAccount, subIndex) => (
                <option key={subIndex} value={subAccount.name}>
                  {subAccount.name}
                </option>
              ))
            )}
          </select>

          <select
            name="account_credited"
            value={formData.account_credited}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Select Account Credited</option>
            {formData.payment_type === 'Cash' ? (
              coaAccounts.map((account) =>
                account.sub_account_details?.map((subAccount, subIndex) => (
                  <option key={subIndex} value={subAccount.name}>
                    {subAccount.name}
                  </option>
                ))
              )
            ) : (
              payees.map((payee, index) =>
                payee.sub_account_details?.map((subAccount, subIndex) => (
                  <option key={subIndex} value={subAccount.name}>
                    {subAccount.name}
                  </option>
                ))
              )
            )}
          </select>
        </div>

        {/* Cash and Bank Amounts */}
        <div className="form-row">
          <label htmlFor="cash">Cash Amount</label>
          <input
            type="number"
            id="cash"
            name="cash"
            value={formData.cash}
            onChange={handleChange}
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
            onChange={handleChange}
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

        {/* Submit Button */}
        <div className="form-row">
          <button type="submit" className="submit-button">Submit</button>
        </div>

        {/* Display error messages */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </form>
    </div>
  );
}

export default DisbursementForm;
