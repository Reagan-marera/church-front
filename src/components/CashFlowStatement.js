import React, { useState } from "react";

const CashFlowStatement = () => {
  // State variables
  const [cashFlowData, setCashFlowData] = useState(null); // To store the fetched cash flow data
  const [loading, setLoading] = useState(false); // To track loading state
  const [error, setError] = useState(null); // To handle errors
  const [startDate, setStartDate] = useState(""); // Start date input
  const [endDate, setEndDate] = useState(""); // End date input

  // Function to fetch cash flow statement data with authentication
  const fetchCashFlowStatement = async () => {
    if (!startDate || !endDate) {
      setError("Both start date and end date are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User is not authenticated. Please log in.");
      }

      // Fetch data from the backend with the Bearer token
      const response = await fetch(
        `http://127.0.0.1:5000/cash_flow_statement?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request headers
          },
        }
      );

      // Check if the response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred while fetching data.");
      }

      // Parse and store the fetched data
      const data = await response.json();
      setCashFlowData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCashFlowStatement();
  };

  return (
    <div className="cash-flow-statement-container">
      <h1>Cash Flow Statement</h1>

      {/* Date Input Form */}
      <form onSubmit={handleSubmit} className="date-form">
        <label htmlFor="start-date">Start Date:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label htmlFor="end-date">End Date:</label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Fetching..." : "Generate Report"}
        </button>
      </form>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading && <div className="loading-message">Loading...</div>}

      {/* Display Cash Flow Data */}
      {cashFlowData && (
        <div className="cash-flow-data">
          <h2>Cash Flow Summary</h2>
          <table className="cash-flow-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Receipts</td>
                <td>{cashFlowData.total_receipts.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Total Disbursements</td>
                <td>{cashFlowData.total_disbursements.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Net Cash Flow</strong></td>
                <td><strong>{cashFlowData.net_cash_flow.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>

          {/* Account Groups */}
          {Object.keys(cashFlowData.account_groups).length > 0 && (
            <div className="account-groups">
              <h3>Account Groups</h3>
              {Object.entries(cashFlowData.account_groups).map(([groupName, groupDetails]) => (
                <div key={groupName} className="account-group">
                  <h4>{groupName}</h4>
                  <table className="account-group-table">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupDetails.relevant_accounts.map((account, index) => (
                        <tr key={index}>
                          <td>{account}</td>
                          <td>{groupDetails.total_amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashFlowStatement;
