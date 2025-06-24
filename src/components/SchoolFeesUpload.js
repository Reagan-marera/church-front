import React, { useState, useEffect } from 'react';
import Select from 'react-select';

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
          subAccounts: customer.sub_account_details || [] // Ensure subAccounts is defined
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

      // Iterate over each selected customer and their subaccounts
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
    <div className="school-fees-upload">
      <h2>Upload School Fees</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Select class students:</label>
          <Select
            value={allCustomersSelected}
            onChange={setAllCustomersSelected}
            options={allCustomers}
            placeholder="Select class students"
            isSearchable
            isMulti
            styles={customStyles}
          />
        </div>
        <div>
          <label>Date Issued:</label>
          <input
            type="date"
            name="date_issued"
            value={formData.date_issued}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Account Debited:</label>
          <input
            type="text"
            name="account_debited"
            value={formData.account_debited}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Account Credited:</label>
          {formData.account_credited.map((account, index) => (
            <div key={index}>
              <input
                type="text"
                name="account"
                value={account.account}
                onChange={(e) => handleAccountCreditedChange(index, e)}
                placeholder="Account"
              />
              <input
                type="number"
                name="amount"
                value={account.amount}
                onChange={(e) => handleAccountCreditedChange(index, e)}
                placeholder="Amount"
              />
              <button type="button" onClick={() => removeAccountCreditedField(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addAccountCreditedField}>
            Add Another Account
          </button>
        </div>
        <div>
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Manual Number:</label>
          <input
            type="text"
            name="manual_number"
            value={formData.manual_number}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Parent Account:</label>
          <input
            type="text"
            name="parent_account"
            value={formData.parent_account}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload School Fees'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default SchoolFeesUpload;
