import React, { useState, useEffect } from 'react';
import './Subaccounts.css';

const Subaccounts = () => {
  const [subaccounts, setSubaccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debitTotal, setDebitTotal] = useState(0);
  const [creditTotal, setCreditTotal] = useState(0);
  const [editIndex, setEditIndex] = useState(null); // Tracks which row is being edited

  // Fetch subaccounts data when the component mounts
  useEffect(() => {
    fetchSubaccounts();
  }, []);

  const fetchSubaccounts = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://127.0.0.1:5000/get_subaccount_details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubaccounts(data.subaccounts);
        calculateTotals(data.subaccounts);
      } else {
        console.error('Failed to fetch subaccounts');
      }
    } catch (error) {
      console.error('Error fetching subaccounts:', error);
    }
    setLoading(false);
  };

  const calculateTotals = (subaccounts) => {
    let debit = 0;
    let credit = 0;

    subaccounts.forEach(subaccount => {
      debit += parseFloat(subaccount.debit || 0);
      credit += parseFloat(subaccount.credit || 0);
    });

    setDebitTotal(debit);
    setCreditTotal(credit);
  };

  const handleUpdateSubaccount = async (subaccountName, description, debitAmount, creditAmount) => {
    if (isNaN(debitAmount) || isNaN(creditAmount)) {
      return alert('Please enter valid numeric values for both amounts');
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://127.0.0.1:5000/update_subaccount_details/${subaccountName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
        }),
      });

      if (response.ok) {
        alert('Subaccount updated successfully');
        fetchSubaccounts(); // Refresh subaccounts list
        setEditIndex(null); // Reset edit mode after update
      } else {
        console.error('Failed to update subaccount');
      }
    } catch (error) {
      console.error('Error updating subaccount:', error);
    }
  };

  const handleDeleteSubaccount = async (subaccountName) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://127.0.0.1:5000/delete_subaccount/${subaccountName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Subaccount deleted successfully');
        fetchSubaccounts(); // Refresh after deletion
      } else {
        console.error('Failed to delete subaccount');
      }
    } catch (error) {
      console.error('Error deleting subaccount:', error);
    }
  };

  const handleDescriptionChange = (index, newDescription) => {
    const updatedSubaccounts = [...subaccounts];
    updatedSubaccounts[index].description = newDescription;
    setSubaccounts(updatedSubaccounts);
  };

  const handleDebitChange = (index, newDebit) => {
    const updatedSubaccounts = [...subaccounts];
    updatedSubaccounts[index].debit = newDebit;
    setSubaccounts(updatedSubaccounts);
  };

  const handleCreditChange = (index, newCredit) => {
    const updatedSubaccounts = [...subaccounts];
    updatedSubaccounts[index].credit = newCredit;
    setSubaccounts(updatedSubaccounts);
  };

  return (
    <div className="container">
      <h1>General Journal Management</h1>

      <h2>General Journal</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="totals">
            <p><strong>Total Debit: </strong>{debitTotal}</p>
            <p><strong>Total Credit: </strong>{creditTotal}</p>
          </div>

          <table className="subaccount-table">
            <thead>
              <tr>
                <th>Debited</th>
                <th>Description </th>
                <th>Credited</th>
                <th>Amount (DR)</th>
                <th>Amount (CR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subaccounts.map((subaccount, index) => (
                <tr key={index}>
                  {/* DR Subaccount */}
                  <td>
                    {subaccount.debit && editIndex !== index ? (
                      <span>{subaccount.sub_account_name}</span>
                    ) : (
                      <select
                        value={subaccount.debit || ''}
                        onChange={(e) => handleDebitChange(index, e.target.value)}
                      >
                        <option value="">Select Subaccount to Debit</option>
                        {subaccounts.map((sub, idx) => (
                          <option key={idx} value={sub.sub_account_name}>
                            {sub.sub_account_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* DR Description */}
                  <td>
                    <input
                      type="text"
                      value={subaccount.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    />
                  </td>

                  {/* CR Subaccount */}
                  <td>
                    {subaccount.credit && editIndex !== index ? (
                      <span>{subaccount.sub_account_name}</span>
                    ) : (
                      <select
                        value={subaccount.credit || ''}
                        onChange={(e) => handleCreditChange(index, e.target.value)}
                      >
                        <option value="">Select Subaccount to Credit</option>
                        {subaccounts.map((sub, idx) => (
                          <option key={idx} value={sub.sub_account_name}>
                            {sub.sub_account_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  

                  {/* Debit Amount */}
                  <td>
                    <input
                      type="number"
                      placeholder="Enter debit amount"
                      value={subaccount.debit || ''}
                      onChange={(e) => handleDebitChange(index, e.target.value)}
                    />
                  </td>

                  {/* Credit Amount */}
                  <td>
                    <input
                      type="number"
                      placeholder="Enter credit amount"
                      value={subaccount.credit || ''}
                      onChange={(e) => handleCreditChange(index, e.target.value)}
                    />
                  </td>

                  <td>
                    <button onClick={() => setEditIndex(index)}>
                      Update
                    </button>
                    <button onClick={() => handleDeleteSubaccount(subaccount.sub_account_name)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Subaccounts;
