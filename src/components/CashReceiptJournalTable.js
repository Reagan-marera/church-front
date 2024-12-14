import React, { useEffect, useState } from "react";

const CashReceiptJournalTable = () => {
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    receipt_date: "",
    receipt_no: "",
    ref_no: "",
    from_whom_received: "",
    description: "",
    receipt_type: "",
    account_class: "",
    account_type: "",
    account_debited: "",
    cash: "",
    total: "",
  });

  // Retrieve token from localStorage
  const token = localStorage.getItem("token");

  // Fetch existing receipts on component mount
  const fetchReceipts = () => {
    if (!token) {
      setError("Unauthorized: No token provided");
      return;
    }

    fetch("http://localhost:5000/cash-receipt-journals", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized: Invalid token or permissions");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setReceipts(data);
          setError(null);
        } else {
          setError("Invalid data format: Expected an array.");
        }
      })
      .catch((error) => {
        setError(error.message || "Failed to fetch data");
        console.error("Fetch error:", error);
      });
  };

  useEffect(() => {
    fetchReceipts();
  }, [token]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      setError("Unauthorized: No token provided");
      return;
    }

    // Validate required fields
    const requiredFields = ["receipt_date", "receipt_no", "from_whom_received", "cash", "total"];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in the ${field.replace(/_/g, " ")}`);
        return;
      }
    }

    // Validate receipt_date format
    const isValidDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.test(formData.receipt_date);
    if (!isValidDate) {
      setError("Invalid date format. Please use dd/mm/yyyy.");
      return;
    }

    const [day, month, year] = formData.receipt_date.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      setError("Invalid date. Please check the values and use dd/mm/yyyy.");
      return;
    }

    // Submit data to backend
    fetch("http://localhost:5000/cash-receipt-journals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to add receipt: ${response.statusText}`);
        }
        return response.json();
      })
      .then((newReceipt) => {
        setReceipts((prevReceipts) => [...prevReceipts, newReceipt]);
        setFormData({
          receipt_date: "",
          receipt_no: "",
          ref_no: "",
          from_whom_received: "",
          description: "",
          receipt_type: "",
          account_class: "",
          account_type: "",
          account_debited: "",
          cash: "",
          total: "",
        });
        setError(null);
        fetchReceipts(); // Refresh data after submission
      })
      .catch((error) => {
        setError(error.message || "Failed to add receipt");
        console.error("Post error:", error);
      });
  };

  // Handle receipt update
  const handleUpdate = (id, updatedData) => {
    if (!token) {
      setError("Unauthorized: No token provided");
      return;
    }

    fetch(`http://localhost:5000/cash-receipt-journals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to update receipt: ${response.statusText}`);
        }
        return response.json();
      })
      .then(() => {
        fetchReceipts(); // Refresh data after update
      })
      .catch((error) => {
        setError(error.message || "Failed to update receipt");
        console.error("Update error:", error);
      });
  };

  // Handle receipt deletion
  const handleDelete = (id) => {
    if (!token) {
      setError("Unauthorized: No token provided");
      return;
    }

    fetch(`http://localhost:5000/cash-receipt-journals/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete receipt: ${response.statusText}`);
        }
        fetchReceipts(); // Refresh data after deletion
      })
      .catch((error) => {
        setError(error.message || "Failed to delete receipt");
        console.error("Delete error:", error);
      });
  };

  // Styling for the component
  const containerStyle = {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  const tableTitleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "20px",
    textAlign: "center",
  };

  const errorMessageStyle = {
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "15px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
  };

  const thTdStyle = {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };

  const thStyle = {
    backgroundColor: "#007BFF",
    color: "white",
  };

  const trHoverStyle = {
    backgroundColor: "#f1f1f1",
  };

  const noDataStyle = {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
  };

  // Component rendering
  return (
    <div style={containerStyle}>
      <h2 style={tableTitleStyle}>Cash Receipt Journal</h2>
      {error && <div style={errorMessageStyle}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <h3>Enter New Receipt</h3>
        {["receipt_date", "receipt_no", "ref_no", "from_whom_received", "description", "receipt_type", "account_class", "account_type", "account_debited","cash", "total"].map((field) => (
          <div key={field} style={{ marginBottom: "10px" }}>
            <label htmlFor={field} style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {field.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
              type={field === "receipt_date" ? "text" : "text"}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={field === "receipt_date" ? "dd/mm/yyyy" : ""}
              required={["receipt_date", "receipt_no", "from_whom_received", "cash", "total"].includes(field)}
              style={{
                padding: "10px",
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "6px",
                backgroundColor: "#fdfdfd",
              }}
            />
          </div>
        ))}
        <button
          type="submit"
          style={{
            padding: "12px 20px",
            backgroundColor: "#28a745",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add Receipt
        </button>
      </form>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...thTdStyle, ...thStyle }}>Actions</th>
            <th style={thTdStyle}>Receipt Date</th>
            <th style={thTdStyle}>Receipt Number</th>
            <th style={thTdStyle}>Reference Number</th>
            <th style={thTdStyle}>From Whom Received</th>
            <th style={thTdStyle}>Description</th>
            <th style={thTdStyle}>Receipt Type</th>
            <th style={thTdStyle}>Account Class</th>
            <th style={thTdStyle}>Account Type</th>
            <th style={thTdStyle}>Account Debited</th>
            <th style={thTdStyle}>Cash</th>
            <th style={thTdStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(receipts) && receipts.length > 0 ? (
            receipts.map((receipt) => (
              <tr key={receipt.id} style={trHoverStyle}>
                <td style={thTdStyle}>
                  <button
                    onClick={() => {
                      const updatedData = {
                        ...receipt,
                        receipt_date: prompt("Update Date (dd/mm/yyyy):", receipt.receipt_date) || receipt.receipt_date,
                        description: prompt("Update Description:", receipt.description) || receipt.description,
                        from_whom_received:
                          prompt("Update From Whom Received:", receipt.from_whom_received) || receipt.from_whom_received,
                      };
                      handleUpdate(receipt.id, updatedData);
                    }}
                    style={{
                      marginRight: "5px",
                      backgroundColor: "#007BFF",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(receipt.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
                <td style={thTdStyle}>{receipt.receipt_date}</td>
                <td style={thTdStyle}>{receipt.receipt_no}</td>
                <td style={thTdStyle}>{receipt.ref_no}</td>
                <td style={thTdStyle}>{receipt.from_whom_received}</td>
                <td style={thTdStyle}>{receipt.description}</td>
                <td style={thTdStyle}>{receipt.receipt_type}</td>
                <td style={thTdStyle}>{receipt.account_class}</td>
                <td style={thTdStyle}>{receipt.account_type}</td>
                <td style={thTdStyle}>{receipt.account_debited}</td>
                <td style={thTdStyle}>{receipt.cash}</td>
                <td style={thTdStyle}>{receipt.total}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" style={noDataStyle}>
                No data available or invalid data format.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CashReceiptJournalTable;
