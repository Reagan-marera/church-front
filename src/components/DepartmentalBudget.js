import React, { useState, useEffect } from 'react';

const DepartmentalBudget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    account: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        const response = await fetch('https://backend.youmingtechnologies.co.ke/departmental-budget', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const filterData = (data) => {
    if (!data) return { receipts: [], disbursements: [], estimates: [] };
    const filteredReceipts = data.receipts.filter(item =>
      item.department.toLowerCase().includes(filters.department.toLowerCase()) &&
      item.account_credited.toLowerCase().includes(filters.account.toLowerCase())
    );
    const filteredDisbursements = data.disbursements.filter(item =>
      item.department.toLowerCase().includes(filters.department.toLowerCase()) &&
      item.account_debited.toLowerCase().includes(filters.account.toLowerCase())
    );
    const filteredEstimates = data.estimates.filter(item =>
      item.department.toLowerCase().includes(filters.department.toLowerCase()) &&
      item.sub_account.toLowerCase().includes(filters.account.toLowerCase())
    );
    return {
      receipts: filteredReceipts,
      disbursements: filteredDisbursements,
      estimates: filteredEstimates,
    };
  };

  const calculateDepartmentTotals = (filteredData) => {
    const departmentTotals = {};

    filteredData.receipts.forEach(item => {
      if (!departmentTotals[item.department]) {
        departmentTotals[item.department] = { receipts: 0, disbursements: 0, estimates: 0 };
      }
      departmentTotals[item.department].receipts += item.total;
    });

    filteredData.disbursements.forEach(item => {
      if (!departmentTotals[item.department]) {
        departmentTotals[item.department] = { receipts: 0, disbursements: 0, estimates: 0 };
      }
      departmentTotals[item.department].disbursements += item.total;
    });

    filteredData.estimates.forEach(item => {
      if (!departmentTotals[item.department]) {
        departmentTotals[item.department] = { receipts: 0, disbursements: 0, estimates: 0 };
      }
      departmentTotals[item.department].estimates += item.total;
    });

    // Calculate actual, performance difference, and utilization difference
    Object.keys(departmentTotals).forEach(department => {
      const actual = departmentTotals[department].receipts + departmentTotals[department].disbursements;
      const performanceDifference = departmentTotals[department].estimates - actual;
      const utilizationDifference = (performanceDifference / departmentTotals[department].estimates) * 100;

      departmentTotals[department].actual = actual;
      departmentTotals[department].performanceDifference = performanceDifference;
      departmentTotals[department].utilizationDifference = utilizationDifference;
    });

    return departmentTotals;
  };

  const filteredData = filterData(data);
  const departmentTotals = calculateDepartmentTotals(filteredData);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Departmental Budget</h1>
      <div>
        <label>
          Filter by Department:
          <input type="text" name="department" value={filters.department} onChange={handleFilterChange} />
        </label>
        <label>
          Filter by Account:
          <input type="text" name="account" value={filters.account} onChange={handleFilterChange} />
        </label>
      </div>
      <div>
        <h2>Department Totals</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Estimates</th>
              <th>Actual</th>
              <th>Performance Difference</th>
              <th>Utilization Difference (%)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(departmentTotals).map(([department, totals], index) => (
              <tr key={index}>
                <td>{department}</td>
                <td>{totals.estimates.toFixed(2)}</td>
                <td>{totals.actual.toFixed(2)}</td>
                <td>{totals.performanceDifference.toFixed(2)}</td>
                <td>{totals.utilizationDifference.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Estimates</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Sub Account</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.estimates.map((item, index) => (
              <tr key={index}>
                <td>{item.department}</td>
                <td>{item.sub_account}</td>
                <td>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Receipts</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Account Credited</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.receipts.map((item, index) => (
              <tr key={index}>
                <td>{item.department}</td>
                <td>{item.account_credited}</td>
                <td>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Disbursements</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Account Debited</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.disbursements.map((item, index) => (
              <tr key={index}>
                <td>{item.department}</td>
                <td>{item.account_debited}</td>
                <td>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    
     
    </div>
  );
};

export default DepartmentalBudget;
