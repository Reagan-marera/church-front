import React, { useState, useEffect } from "react";
import Select from "react-select";
import * as XLSX from 'xlsx';
import "./DisbursementForm.css";

const EstimateTable = () => {
  const [estimates, setEstimates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    department: "",
    procurement_method: "",
    item_specifications: "",
    unit_of_measure: "",
    quantity: 0,
    current_estimated_price: 0,
    total_estimates: 0,
    parent_account: null,
    sub_account: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatedAdjustments, setUpdatedAdjustments] = useState({});

  useEffect(() => {
    fetchEstimates();
    fetchAccounts();
  }, []);

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#e2e8f0" : "white",
      color: "black",
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

  const fetchEstimates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("https://backend.youmingtechnologies.co.ke/estimates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      setEstimates(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const response = await fetch("https://backend.youmingtechnologies.co.ke/chart-of-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    }
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
        ...formData,
        total_estimates: parseFloat(formData.quantity) * parseFloat(formData.current_estimated_price),
      };
      let response;
      if (isEditing) {
        response = await fetch(`https://backend.youmingtechnologies.co.ke/estimates/${editingData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("https://backend.youmingtechnologies.co.ke/estimates", {
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
      fetchEstimates();
      setFormData({
        department: "",
        procurement_method: "",
        item_specifications: "",
        unit_of_measure: "",
        quantity: 0,
        current_estimated_price: 0,
        total_estimates: 0,
        parent_account: null,
        sub_account: null,
      });
      setError("");
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this estimate?")) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not authenticated.");
      return;
    }
    try {
      const response = await fetch(`https://backend.youmingtechnologies.co.ke/estimates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      fetchEstimates();
    } catch (err) {
      setError(err.message);
    }
  };

  const openFormPopup = (estimate = null) => {
    if (estimate) {
      setIsEditing(true);
      setEditingData(estimate);
      setFormData({
        department: estimate.department,
        procurement_method: estimate.procurement_method,
        item_specifications: estimate.item_specifications,
        unit_of_measure: estimate.unit_of_measure,
        quantity: estimate.quantity,
        current_estimated_price: estimate.current_estimated_price,
        total_estimates: estimate.total_estimates,
        parent_account: estimate.parent_account,
        sub_account: estimate.sub_account,
      });
    } else {
      setIsEditing(false);
      setEditingData(null);
      setFormData({
        department: "",
        procurement_method: "",
        item_specifications: "",
        unit_of_measure: "",
        quantity: 0,
        current_estimated_price: 0,
        total_estimates: 0,
        parent_account: null,
        sub_account: null,
      });
    }
    setShowForm(true);
  };

  const closeFormPopup = () => {
    setShowForm(false);
    setFormData({
      department: "",
      procurement_method: "",
      item_specifications: "",
      unit_of_measure: "",
      quantity: 0,
      current_estimated_price: 0,
      total_estimates: 0,
      parent_account: null,
      sub_account: null,
    });
    setError("");
    setIsEditing(false);
    setEditingData(null);
  };

  const parentAccountOptions = accounts.map((account) => ({
    value: account.parent_account,
    label: account.parent_account,
  }));

  const subAccountOptions = accounts.flatMap((account) =>
    account.sub_account_details.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    }))
  );

  const filteredEstimates = estimates.filter((estimate) =>
    estimate.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    });
  };

  const updateAdjustments = async (id, adjustments) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");
      const estimate = estimates.find((e) => e.id === id);
      if (!estimate) throw new Error("Estimate not found");
      const payload = {
        adjusted_quantity: adjustments.adjusted_quantity || estimate.adjusted_quantity || estimate.quantity,
        adjusted_price: adjustments.adjusted_price || estimate.adjusted_price || estimate.current_estimated_price,
      };
      const response = await fetch(`https://backend.youmingtechnologies.co.ke/estimates/${id}`, {
        method: "PUT",
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
      fetchEstimates();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(estimates.map(estimate => ({
      Department: estimate.department,
      "Procurement Method": estimate.procurement_method,
      "Item Specifications": estimate.item_specifications,
      "Unit of Measure": estimate.unit_of_measure,
      "Original Quantity": estimate.quantity,
      "Adjusted Quantity": estimate.adjusted_quantity || estimate.quantity,
      "Original Price": estimate.current_estimated_price,
      "Adjusted Price": estimate.adjusted_price || estimate.current_estimated_price,
      "Original Total Estimates": estimate.total_estimates,
      "Adjusted Total Estimates": (estimate.adjusted_quantity || estimate.quantity) * (estimate.adjusted_price || estimate.current_estimated_price),
      "Parent Account": estimate.parent_account,
      "Sub Account": estimate.sub_account,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
    XLSX.writeFile(workbook, "Estimates.xlsx");
  };

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => openFormPopup()}>Add New Estimate</button>
      <button onClick={exportToExcel}>Export to Excel</button>
      <input
        type="text"
        placeholder="Search by Department"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />
      {showForm && (
        <div className="form-popup">
          <h3>{isEditing ? "Edit Estimate" : "Add New Estimate"}</h3>
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-row">
              <label>Department:</label>
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-row">
              <label>Procurement Method:</label>
              <input type="text" name="procurement_method" value={formData.procurement_method} onChange={handleInputChange} className="form-input" />
            </div>
            <div className="form-row">
              <label>Item Specifications:</label>
              <input type="text" name="item_specifications" value={formData.item_specifications} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-row">
              <label>Unit of Measure:</label>
              <input type="text" name="unit_of_measure" value={formData.unit_of_measure} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-row">
              <label>Quantity:</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-row">
              <label>Current Estimated Price:</label>
              <input type="number" name="current_estimated_price" value={formData.current_estimated_price} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-row">
              <label>Total Estimates:</label>
              <input type="number" name="total_estimates" value={formData.total_estimates} readOnly className="form-input read-only" />
            </div>
            <div className="form-row">
              <label>Parent Account:</label>
              <Select
                value={parentAccountOptions.find((option) => option.value === formData.parent_account) || null}
                onChange={(selectedOption) => setFormData((prev) => ({ ...prev, parent_account: selectedOption ? selectedOption.value : null }))}
                options={parentAccountOptions}
                placeholder="Select Parent Account"
                isSearchable
                styles={customStyles}
              />
            </div>
            <div className="form-row">
              <label>Sub Account:</label>
              <Select
                value={subAccountOptions.find((option) => option.value === formData.sub_account) || null}
                onChange={(selectedOption) => setFormData((prev) => ({ ...prev, sub_account: selectedOption ? selectedOption.value : null }))}
                options={subAccountOptions}
                placeholder="Select Sub Account"
                isSearchable
                styles={customStyles}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                {loading ? "Submitting..." : isEditing ? "Update Estimate" : "Submit Estimate"}
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
            <th>Department</th>
            <th>Procurement Method</th>
            <th>Item Specifications</th>
            <th>Unit of Measure</th>
            <th>Original Quantity</th>
            <th>Adjusted Quantity</th>
            <th>Original Price</th>
            <th>Adjusted Price</th>
            <th>Original Total Estimates</th>
            <th>Adjusted Total Estimates</th>
            <th>Parent Account</th>
            <th>Sub Account</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEstimates.map((estimate) => {
            const handleAdjustmentChange = (field, value) => {
              setUpdatedAdjustments((prev) => ({
                ...prev,
                [estimate.id]: {
                  ...prev[estimate.id],
                  [field]: value,
                },
              }));
            };
            const handleSaveAdjustments = async () => {
              const adjustments = updatedAdjustments[estimate.id];
              if (!adjustments) return;
              await updateAdjustments(estimate.id, adjustments);
              setUpdatedAdjustments((prev) => {
                const newState = { ...prev };
                delete newState[estimate.id];
                return newState;
              });
            };
            const currentAdjustments = updatedAdjustments[estimate.id] || {};
            return (
              <tr key={estimate.id}>
                <td>{estimate.department}</td>
                <td>{estimate.procurement_method}</td>
                <td>{estimate.item_specifications}</td>
                <td>{estimate.unit_of_measure}</td>
                <td>{estimate.quantity}</td>
                <td>
                  <input
                    type="number"
                    value={currentAdjustments.adjusted_quantity || estimate.adjusted_quantity || ""}
                    onChange={(e) => handleAdjustmentChange("adjusted_quantity", parseFloat(e.target.value))}
                    style={{ width: "80px" }}
                  />
                </td>
                <td>{formatAmount(estimate.current_estimated_price)}</td>
                <td>
                  <input
                    type="number"
                    value={currentAdjustments.adjusted_price || estimate.adjusted_price || ""}
                    onChange={(e) => handleAdjustmentChange("adjusted_price", parseFloat(e.target.value))}
                    style={{ width: "80px" }}
                  />
                </td>
                <td>{formatAmount(estimate.total_estimates)}</td>
                <td>
                  {formatAmount(
                    (currentAdjustments.adjusted_quantity || estimate.adjusted_quantity || estimate.quantity) *
                      (currentAdjustments.adjusted_price || estimate.adjusted_price || estimate.current_estimated_price)
                  )}
                </td>
                <td>{estimate.parent_account}</td>
                <td>{estimate.sub_account}</td>
                <td>
                  <button onClick={() => openFormPopup(estimate)}>Edit</button>
                  <button onClick={() => handleDelete(estimate.id)}>Delete</button>
                  <button onClick={handleSaveAdjustments}>Save Adjustments</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EstimateTable;
