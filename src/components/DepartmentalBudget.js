import React, { useEffect, useState } from 'react';

const DepartmentalBudget = () => {
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://yoming.boogiecoin.com/departmental-budget', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch departmental budgets');
        }

        const data = await response.json();
        setBudgets(data);
      } catch (error) {
        console.error('Error fetching departmental budgets:', error);
      }
    };

    fetchBudgets();
  }, []);

  return (
    <div>
      <h2>Departmental Budget Estimates</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Original Budget</th>
            <th>Adjusted  Budget</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((item, index) => (
            <tr key={index}>
              <td>{item.department}</td>
              <td>{item.total_budget ? item.total_budget.toFixed(2) : 'N/A'}</td>
              <td>{item.adjusted_total_budget ? item.adjusted_total_budget.toFixed(2) : '0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentalBudget;
