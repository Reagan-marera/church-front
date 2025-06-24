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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const generateInvoiceNumber = () => {
    let currentCounter = parseInt(localStorage.getItem('schoolFeesCounter'), 10) || 0;
    currentCounter += 1;
    localStorage.setItem('schoolFeesCounter', currentCounter);
    return `SF-${currentCounter}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAccountCreditedChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAccounts = [...formData.account_credited];
    updatedAccounts[index][name] = value;

    setFormData({
      ...formData,
      account_credited: updatedAccounts
    });

    // Calculate total amount
    const totalAmount = updatedAccounts.reduce((sum, account) => sum + (parseFloat(account.amount) || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      amount: totalAmount
    }));
  };

  const addAccountCreditedField = () => {
    setFormData({
      ...formData,
      account_credited: [...formData.account_credited, { account: '', amount: '' }]
    });
  };

  const removeAccountCreditedField = (index) => {
    const updatedAccounts = formData.account_credited.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      account_credited: updatedAccounts
    });

    // Calculate total amount after removing an account
    const totalAmount = updatedAccounts.reduce((sum, account) => sum + (parseFloat(account.amount) || 0), 0);
    setFormData(prevFormData => ({
      ...prevFormData,
      amount: totalAmount
    }));
  };

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
              account_credited: formData.account_credited.map(acc => ({
                name: acc.account,
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

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to upload school fees');
            }
          }
        }
      }

      alert('School fees uploaded successfully!');
      setFormData({
        date_issued: '',
        amount: '',
        account_debited: '',
        account_credited: [{ account: '', amount: '' }],
        description: '',
        manual_number: '',
        parent_account: ''
      });
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
          <label className="form-label">Amount:</label>
          <input
            className="form-input"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            readOnly
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
          {formData.account_credited.map((account, index) => (
            <div key={index} className="account-credited-group">
              <input
                className="form-input"
                type="text"
                name="account"
                value={account.account}
                onChange={(e) => handleAccountCreditedChange(index, e)}
                placeholder="Account"
              />
              <input
                className="form-input"
                type="number"
                name="amount"
                value={account.amount}
                onChange={(e) => handleAccountCreditedChange(index, e)}
                placeholder="Amount"
              />
              <button
                type="button"
                className="remove-button"
                onClick={() => removeAccountCreditedField(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-button"
            onClick={addAccountCreditedField}
          >
            Add Another Account
          </button>
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
          <input
            className="form-input"
            type="text"
            name="parent_account"
            value={formData.parent_account}
            onChange={handleInputChange}
          />
        </div>
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload School Fees'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SchoolFeesUpload;
