import React, { useEffect, useState } from 'react';

const BudgetVsActuals = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found in local storage');
        }

        const response = await fetch('http://127.0.0.1:5000/budget-vs-actuals', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Backend Response:', result); // Log the response for debugging
        setData(result);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching budget vs actuals data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Budget vs Actuals</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Parent Account</th>
            <th>Original Budget</th>
            <th>Adjusted Budget</th>
            <th>Final Budget</th>
            <th>Actual Amount</th>
            <th>Performance Difference</th>
            <th>Utilization Difference (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={index}>
                <td>{item.parent_account || 'N/A'}</td>
                <td>{(item.original_budget || 0).toFixed(2)}</td>
                <td>{(item.adjusted_budget || 0).toFixed(2)}</td>
                <td>{(item.final_budget || 0).toFixed(2)}</td>
                <td>{(item.actual_amount || 0).toFixed(2)}</td>
                <td>{(item.performance_difference || 0).toFixed(2)}</td>
                <td>{(item.utilization_difference || 0)}%</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetVsActuals;