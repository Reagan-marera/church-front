import React, { useEffect, useState } from 'react';

const BudgetVsActuals = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/budget-vs-actuals', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch budget vs actuals data');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching budget vs actuals data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Budget vs Actuals</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Item Specifications</th>
            <th>Estimated Budget</th>
            <th>Actual Expenditure</th>
            <th>Variance</th>
            <th>Percentage Variance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.department}</td>
              <td>{item.item_specifications}</td>
              <td>{item.estimated_budget.toFixed(2)}</td>
              <td>{item.actual_expenditure.toFixed(2)}</td>
              <td>{item.variance.toFixed(2)}</td>
              <td>{item.percentage_variance}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetVsActuals;