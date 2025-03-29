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

        const response = await fetch('https://church.boogiecoin.com/budget-vs-actuals', {
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

  const aggregateData = (data) => {
    const aggregated = {};
    data.forEach((item) => {
      const {
        parent_account,
        original_budget = 0,
        adjusted_budget = 0,
        final_budget = 0,
        actual_amount = 0,
      } = item;

      if (!aggregated[parent_account]) {
        aggregated[parent_account] = {
          parent_account,
          original_budget: 0,
          adjusted_budget: 0,
          final_budget: 0,
          actual_amount: 0,
          performance_difference: 0,
          utilization_difference: 0,
        };
      }

      aggregated[parent_account].original_budget += original_budget;
      aggregated[parent_account].adjusted_budget += adjusted_budget;
      aggregated[parent_account].final_budget += final_budget;

      // Pick the actual amount from the first entry
      if (aggregated[parent_account].actual_amount === 0) {
        aggregated[parent_account].actual_amount = actual_amount;
      }
    });

    // Calculate performance difference and utilization difference after aggregation
    for (const key in aggregated) {
      aggregated[key].performance_difference =
        aggregated[key].final_budget - aggregated[key].actual_amount;

      if (aggregated[key].final_budget !== 0) {
        aggregated[key].utilization_difference =
          (aggregated[key].performance_difference / aggregated[key].final_budget) * 100;
      }
    }

    return Object.values(aggregated);
  };

  const aggregatedData = aggregateData(data);

  const formatToKSH = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

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
          {aggregatedData.length > 0 ? (
            aggregatedData.map((item, index) => (
              <tr key={index}>
                <td>{item.parent_account || 'N/A'}</td>
                <td>{formatToKSH(item.original_budget || 0)}</td>
                <td>{formatToKSH(item.adjusted_budget || 0)}</td>
                <td>{formatToKSH(item.final_budget || 0)}</td>
                <td>{formatToKSH(item.actual_amount || 0)}</td>
                <td>{formatToKSH(item.performance_difference || 0)}</td>
                <td>{Math.abs(item.utilization_difference || 0).toFixed(2)}%</td>
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
