import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './SchoolFeesUpload.css'; // Import a CSS file for styling

const SchoolFeesUpload = () => {
  const [formData, setFormData] = useState({
    date_issued: '',
    amount: '',
    account_debited: '',
    account_credited: [{ account: '', amount: '' }],
    description: '',
    manual_number: '',
    parent_account: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allCustomersSelected, setAllCustomersSelected] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [accountsCredited, setAccountsCredited] = useState([]);

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
        const allCustomersList = data.map((customer) => ({
          value: customer.account_name,
          label: customer.account_name,
          subAccounts: customer.sub_account_details || []
        }));
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
          setFormData(prevFormData => ({
            ...prevFormData,
            account_debited: subAccount.name
          }));
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

  useEffect(() => {
    fetchCustomers();
    fetchChartOfAccounts();
  }, []);

  const generateInvoiceNumber = () => {
    // Get the current counter from local storage
    let currentCounter = parseInt(localStorage.getItem('schoolFeesCounter'), 10) || 0;
    // Increment the counter
    currentCounter += 1;
    // Store the updated counter back to local storage
    localStorage.setItem('schoolFeesCounter', currentCounter);
  
    // Generate a random number
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  
    // Combine the counter and random number to create a unique invoice number
    return `SF-${currentCounter}-${randomNumber}`;
  };
  

  const resetCounter = () => {
    localStorage.removeItem('schoolFeesCounter');
    // Optionally reset any related state if needed
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAccountCreditedChange = (index, selectedOption, amount) => {
    const updatedAccounts = [...accountsCredited];
    updatedAccounts[index] = { value: selectedOption, label: selectedOption, amount };

    setAccountsCredited(updatedAccounts);

    // Calculate total amount
    const totalAmount = updatedAccounts.reduce((sum, account) => sum + (parseFloat(account.amount) || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      amount: totalAmount
    }));
  };

  const handleAddCreditedAccount = () => {
    setAccountsCredited([
      ...accountsCredited,
      { value: "", label: "", amount: 0 }
    ]);
  };

  const handleRemoveCreditedAccount = (index) => {
    const updatedAccounts = accountsCredited.filter((_, i) => i !== index);
    setAccountsCredited(updatedAccounts);

    // Calculate total amount after removing an account
    const totalAmount = updatedAccounts.reduce((sum, account) => sum + (parseFloat(account.amount) || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      amount: totalAmount
    }));
  };

  const parentAccountOptions = chartOfAccounts.map((account) => ({
    value: account.parent_account || account.name,
    label: account.parent_account || account.name,
  }));

  const creditedAccountOptions = chartOfAccounts
    .filter(account => account.account_type === "40-Revenue" || account.account_type === "10-Assets")
    .flatMap(account => account.sub_account_details || [])
    .map(subAccount => ({
      value: subAccount.name,
      label: subAccount.name
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allCustomersSelected.length) {
      setError('Please select at least one customer.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let successfulUploads = 0;

      for (const selectedCustomer of allCustomersSelected) {
        const customer = customers.find(c => c.account_name === selectedCustomer.value);
        if (customer && customer.sub_account_details) {
          for (const subAccount of customer.sub_account_details) {
            const invoiceNumber = generateInvoiceNumber();

            const submissionData = {
              invoice_number: invoiceNumber,
              date_issued: formData.date_issued,
              amount: parseFloat(formData.amount),
              account_debited: formData.account_debited,
              account_credited: accountsCredited.map(acc => ({
                name: acc.value,
                amount: parseFloat(acc.amount) || 0
              })),
              description: formData.description,
              name: subAccount.name,
              manual_number: formData.manual_number,
              parent_account: formData.parent_account
            };

            console.log('Data being sent:', submissionData);

            const response = await fetch(`${api}/invoices`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(submissionData)
            });

            if (response.ok) {
              successfulUploads++;
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to upload school fees');
            }
          }
        }
      }

      alert(`Successfully uploaded school fees for ${successfulUploads} accounts!`);
      setFormData({
        date_issued: '',
        amount: '',
        account_debited: '',
        account_credited: [{ account: '', amount: '' }],
        description: '',
        manual_number: '',
        parent_account: ''
      });
      setAccountsCredited([{ value: "", label: "", amount: 0 }]);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="school-fees-upload-container">
      <h2 className="school-fees-upload-title">Upload School Fees</h2>
      <form onSubmit={handleSubmit} className="school-fees-upload-form">
        <div className="form-group">
          <label className="form-label">Select class students:</label>
          <Select
            className="form-select"
            value={allCustomersSelected}
            onChange={setAllCustomersSelected}
            options={allCustomers}
            placeholder="Select class students"
            isSearchable
            isMulti
            styles={customStyles}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Date Issued:</label>
          <input
            className="form-input"
            type="date"
            name="date_issued"
            value={formData.date_issued}
            onChange={handleInputChange}
            required
          />
        </div>
       
        <div className="form-group">
          <label className="form-label">Account Debited:</label>
          <input
            className="form-input"
            type="text"
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Credited:</label>
          {accountsCredited.map((account, index) => (
            <div key={index} className="account-credited-group">
              <Select
                value={creditedAccountOptions.find(option => option.value === account.value)}
                onChange={(selectedOption) => handleAccountCreditedChange(index, selectedOption.value, account.amount)}
                options={creditedAccountOptions}
                placeholder="Select Credited Account"
                isSearchable
                styles={customStyles}
              />
              <input
                className="form-input"
                type="number"
                value={account.amount}
                onChange={(e) => handleAccountCreditedChange(index, account.value, parseFloat(e.target.value) || 0)}
                placeholder="Amount"
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => handleRemoveCreditedAccount(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-button"
            onClick={handleAddCreditedAccount}
          >
            Add Credit Account
          </button>
          <div className="form-group">
          <label className="form-label">Amount:</label>
          <input
            className="form-input"
            type="number"
            name="amount"
            value={formData.amount}
            readOnly
          />
        </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description:</label>
          <input
            className="form-input"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Parent Account:</label>
          <Select
            value={parentAccountOptions.find(option => option.value === formData.parent_account)}
            onChange={(selectedOption) => setFormData(prev => ({ ...prev, parent_account: selectedOption.value }))}
            options={parentAccountOptions}
            placeholder="Select Parent Account"
            isSearchable
            styles={customStyles}
          />
        </div>
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload School Fees'}
        </button>
        <button
          type="button"
          className="reset-button"
          onClick={resetCounter}
        >
          Reset Counter
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SchoolFeesUpload;
