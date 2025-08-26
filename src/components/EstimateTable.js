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
      console.error("Error fetching estimates:", err);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      total_estimates: name === 'quantity' || name === 'current_estimated_price' 
        ? (name === 'quantity' ? parseFloat(value) : prev.quantity) * 
          (name === 'current_estimated_price' ? parseFloat(value) : prev.current_estimated_price)
        : prev.total_estimates
    }));
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
    account.sub_account_details?.map((subAccount) => ({
      value: subAccount.name,
      label: subAccount.name,
    })) || []
  );

  const filteredEstimates = estimates.filter((estimate) =>
    estimate.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "KES 0.00";
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
        adjusted_quantity: adjustments.adjusted_quantity !== undefined 
          ? parseFloat(adjustments.adjusted_quantity)
          : null,
        adjusted_price: adjustments.adjusted_price !== undefined
          ? parseFloat(adjustments.adjusted_price)
          : null
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
      "Item Specifications": estimate.item_specifications,
      "Unit of Measure": estimate.unit_of_measure,
      "Original Quantity": estimate.quantity,
      "Adjusted Quantity": estimate.adjusted_quantity,
      "Original Price": estimate.current_estimated_price,
      "Adjusted Price": estimate.adjusted_price,
      "Original Total": estimate.total_estimates,
      "Adjusted Total": estimate.adjusted_total_estimates,
      "Parent Account": estimate.parent_account,
      "Sub Account": estimate.sub_account,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimates");
    XLSX.writeFile(workbook, "Estimates.xlsx");
  };

  const printDepartmentBudgets = () => {
    const filtered = estimates.filter((estimate) =>
      estimate.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length === 0) {
      alert("No estimates found for the given department.");
      return;
    }

    const departmentTotals = filtered.reduce((acc, estimate) => {
      const originalTotal = estimate.total_estimates;
      const adjustedTotal = estimate.adjusted_total_estimates !== null 
        ? estimate.adjusted_total_estimates 
        : originalTotal;

      if (!acc[estimate.department]) {
        acc[estimate.department] = {
          originalTotal: 0,
          adjustedTotal: 0,
          estimates: [],
        };
      }
      acc[estimate.department].originalTotal += originalTotal;
      acc[estimate.department].adjustedTotal += adjustedTotal;
      acc[estimate.department].estimates.push(estimate);
      return acc;
    }, {});

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Department Budgets</title>');
    printWindow.document.write('<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Department Budgets</h1>');
    
    Object.keys(departmentTotals).forEach((department) => {
      const departmentData = departmentTotals[department];
      printWindow.document.write(`<h2>${department}</h2>`);
      printWindow.document.write('<table>');
      printWindow.document.write('<thead><tr><th>Item</th><th>Unit</th><th>Original Qty</th><th>Adjusted Qty</th><th>Original Price</th><th>Adjusted Price</th><th>Original Total</th><th>Adjusted Total</th></tr></thead>');
      printWindow.document.write('<tbody>');
      
      departmentData.estimates.forEach((estimate) => {
        printWindow.document.write(`<tr>
          <td>${estimate.item_specifications}</td>
          <td>${estimate.unit_of_measure}</td>
          <td>${estimate.quantity}</td>
          <td>${estimate.adjusted_quantity !== null ? estimate.adjusted_quantity : ""}</td>
          <td>${formatAmount(estimate.current_estimated_price)}</td>
          <td>${estimate.adjusted_price !== null ? formatAmount(estimate.adjusted_price) : ""}</td>
          <td>${formatAmount(estimate.total_estimates)}</td>
          <td>${estimate.adjusted_total_estimates !== null ? formatAmount(estimate.adjusted_total_estimates) : ""}</td>
        </tr>`);
      });
      
      printWindow.document.write(`<tr>
        <td colspan="6" style="text-align: right;"><strong>Total</strong></td>
        <td><strong>${formatAmount(departmentData.originalTotal)}</strong></td>
        <td><strong>${departmentData.adjustedTotal !== departmentData.originalTotal ? formatAmount(departmentData.adjustedTotal) : ""}</strong></td>
      </tr>`);
      printWindow.document.write('</tbody></table>');
    });
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="estimate-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="action-buttons">
        <button className="btn-primary" onClick={() => openFormPopup()}>Add New Estimate</button>
        <button className="btn-secondary" onClick={exportToExcel}>Export to Excel</button>
        <button className="btn-secondary" onClick={printDepartmentBudgets}>Print Department Budgets</button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Department"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? "Edit Estimate" : "Add New Estimate"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department:</label>
                <input 
                  type="text" 
                  name="department" 
                  value={formData.department} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Procurement Method:</label>
                <input 
                  type="text" 
                  name="procurement_method" 
                  value={formData.procurement_method} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="form-group">
                <label>Item Specifications:</label>
                <input 
                  type="text" 
                  name="item_specifications" 
                  value={formData.item_specifications} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Unit of Measure:</label>
                <input 
                  type="text" 
                  name="unit_of_measure" 
                  value={formData.unit_of_measure} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleInputChange} 
                    required 
                    min="0"
                    step="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Estimated Price:</label>
                  <input 
                    type="number" 
                    name="current_estimated_price" 
                    value={formData.current_estimated_price} 
                    onChange={handleInputChange} 
                    required 
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Total:</label>
                  <input 
                    type="text" 
                    value={formatAmount(formData.total_estimates)} 
                    readOnly 
                    className="read-only"
                  />
                </div>
              </div>
              
              <div className="form-group">
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
              
              <div className="form-group">
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
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Processing..." : isEditing ? "Update Estimate" : "Add Estimate"}
                </button>
                <button type="button" className="btn-cancel" onClick={closeFormPopup}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="estimates-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Item</th>
              <th>Unit</th>
              <th>Original Qty</th>
              <th>Adjusted Qty</th>
              <th>Original Price</th>
              <th>Adjusted Price</th>
              <th>Original Total</th>
              <th>Adjusted Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {filteredEstimates.map(estimate => {
            const currentAdjustments = updatedAdjustments[estimate.id] || {};
            const hasAdjustments = estimate.adjusted_price !== null || 
                                 estimate.adjusted_quantity !== null;

            return (
              <tr key={estimate.id}>
                <td>{estimate.department}</td>
                <td>{estimate.item_specifications}</td>
                <td>{estimate.unit_of_measure}</td>
                <td>{estimate.quantity}</td>
                <td>
                  <input
                    type="number"
                    value={
                      currentAdjustments.adjusted_quantity !== undefined
                        ? currentAdjustments.adjusted_quantity
                        : estimate.adjusted_quantity !== null
                          ? estimate.adjusted_quantity
                          : ""
                    }
                    onChange={(e) => setUpdatedAdjustments(prev => ({
                      ...prev,
                      [estimate.id]: {
                        ...prev[estimate.id],
                        adjusted_quantity: e.target.value === "" ? null : parseFloat(e.target.value)
                      }
                    }))}
                    placeholder="Adjust qty"
                  />
                </td>
                <td>{formatAmount(estimate.current_estimated_price)}</td>
                <td>
                  <input
                    type="number"
                    value={
                      currentAdjustments.adjusted_price !== undefined
                        ? currentAdjustments.adjusted_price
                        : estimate.adjusted_price !== null
                          ? estimate.adjusted_price
                          : ""
                    }
                    onChange={(e) => setUpdatedAdjustments(prev => ({
                      ...prev,
                      [estimate.id]: {
                        ...prev[estimate.id],
                        adjusted_price: e.target.value === "" ? null : parseFloat(e.target.value)
                      }
                    }))}
                    placeholder="Adjust price"
                    step="0.01"
                  />
                </td>
                <td>{formatAmount(estimate.total_estimates)}</td>
                <td>
                  {hasAdjustments || currentAdjustments.adjusted_price !== undefined || 
                   currentAdjustments.adjusted_quantity !== undefined
                    ? formatAmount(
                        (currentAdjustments.adjusted_quantity !== undefined
                          ? currentAdjustments.adjusted_quantity
                          : estimate.adjusted_quantity !== null
                            ? estimate.adjusted_quantity
                            : estimate.quantity) *
                        (currentAdjustments.adjusted_price !== undefined
                          ? currentAdjustments.adjusted_price
                          : estimate.adjusted_price !== null
                            ? estimate.adjusted_price
                            : estimate.current_estimated_price)
                      )
                    : "No adjustments"}
                </td>
                <td>
                  <button onClick={() => {
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
                    setIsEditing(true);
                    setShowForm(true);
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(estimate.id)}>Delete</button>
                  {(currentAdjustments.adjusted_price !== undefined || 
                    currentAdjustments.adjusted_quantity !== undefined) && (
                    <button onClick={() => updateAdjustments(estimate.id, currentAdjustments)}>
                      Save Adjust
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimateTable;