import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [allTransactions, setAllTransactions] = useState({
    invoices_issued: [],
    invoices_received: [],
    cash_receipts: [],
    cash_disbursements: [],
    transactions: [],
    chart_of_accounts: [],
    payees: [],
    customers: []
  });
  const [filteredTransactions, setFilteredTransactions] = useState({
    invoices_issued: [],
    invoices_received: [],
    cash_receipts: [],
    cash_disbursements: [],
    transactions: [],
    chart_of_accounts: [],
    payees: [],
    customers: []
  });
  const [loading, setLoading] = useState({
    users: false,
    transactions: false
  });
  const [error, setError] = useState({
    users: '',
    transactions: ''
  });

  const api = 'https://yoming.boogiecoin.com';

  const getUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    setError(prev => ({ ...prev, users: '' }));
    try {
      const response = await fetch(`${api}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(prev => ({ ...prev, users: 'Failed to fetch users' }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const getTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    setError(prev => ({ ...prev, transactions: '' }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('JWT token is missing');
      }
  
      const response = await fetch(`${api}/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Transactions Data:', data); // Log the data to check the structure
      setAllTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(prev => ({ ...prev, transactions: 'Failed to fetch transactions' }));
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };
  
  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${api}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await getUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);

    if (!userId) {
      setFilteredTransactions(allTransactions);
      return;
    }

    const userIdNum = Number(userId);

    const filterByUser = (items) => {
      return items.filter(item => {
        if (item.user) {
          return item.user.id === userIdNum || item.user.id === userId;
        }
        return false;
      });
    };

    setFilteredTransactions({
      invoices_issued: filterByUser(allTransactions.invoices_issued),
      invoices_received: filterByUser(allTransactions.invoices_received),
      cash_receipts: filterByUser(allTransactions.cash_receipts),
      cash_disbursements: filterByUser(allTransactions.cash_disbursements),
      transactions: filterByUser(allTransactions.transactions),
      chart_of_accounts: filterByUser(allTransactions.chart_of_accounts),
      payees: filterByUser(allTransactions.payees),
      customers: filterByUser(allTransactions.customers)
    });
  };

  useEffect(() => {
    getUsers();
    getTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderTransactionTable = (title, data, columns) => {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">{title}</h3>
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id}>
                    {columns.map((column) => (
                      <td
                        key={`${item.id}-${column.key}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {column.render ? column.render(item) : (
                          Array.isArray(item[column.key]) ? (
                            item[column.key].map((subItem, index) => (
                              <div key={index}>
                                {subItem.name}: {subItem.amount}
                              </div>
                            ))
                          ) : (
                            String(item[column.key])
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No {title.toLowerCase()} found for selected user</p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* User Selection Dropdown */}
      <div className="mb-8">
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by User:
        </label>
        <select
          id="user-select"
          value={selectedUserId}
          onChange={handleUserChange}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Users Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Users</h2>
        {loading.users ? (
          <div className="text-center py-4">Loading users...</div>
        ) : error.users ? (
          <div className="text-red-500">{error.users}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'CEO'}
                        title={user.role === 'CEO' ? "Cannot delete CEO" : ""}
                        className={`px-3 py-1 rounded-md text-white ${user.role === 'CEO' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Transactions</h2>
        {loading.transactions ? (
          <div className="text-center py-4">Loading transactions...</div>
        ) : error.transactions ? (
          <div className="text-red-500">{error.transactions}</div>
        ) : (
          <div className="space-y-12">
            {/* Invoices Issued */}
            {renderTransactionTable(
              "Invoices Issued",
              filteredTransactions.invoices_issued,
              [
                { key: 'invoice_number', header: 'Invoice #', render: (item) => `#${item.invoice_number}` },
                { key: 'amount', header: 'Amount', render: (item) => formatCurrency(item.amount) },
                { key: 'date_issued', header: 'Date', render: (item) => formatDate(item.date_issued) },
                { key: 'account_debited', header: 'Account Debited' },
                { key: 'account_credited', header: 'Account Credited' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Invoices Received */}
            {renderTransactionTable(
              "Invoices Received",
              filteredTransactions.invoices_received,
              [
                { key: 'invoice_number', header: 'Invoice #', render: (item) => `#${item.invoice_number}` },
                { key: 'amount', header: 'Amount', render: (item) => formatCurrency(item.amount) },
                { key: 'date_issued', header: 'Date', render: (item) => formatDate(item.date_issued) },
                { key: 'name', header: 'Name' },
                { key: 'grn_number', header: 'GRN #' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Cash Receipts */}
            {renderTransactionTable(
              "Cash Receipts",
              filteredTransactions.cash_receipts,
              [
                { key: 'receipt_no', header: 'Receipt #' },
                { key: 'total', header: 'Total', render: (item) => formatCurrency(item.total) },
                { key: 'receipt_date', header: 'Date', render: (item) => formatDate(item.receipt_date) },
                { key: 'from_whom_received', header: 'From' },
                { key: 'receipt_type', header: 'Receipt Type' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Cash Disbursements */}
            {renderTransactionTable(
              "Cash Disbursements",
              filteredTransactions.cash_disbursements,
              [
                { key: 'cheque_no', header: 'Cheque #' },
                { key: 'cash', header: 'Amount', render: (item) => formatCurrency(item.cash) },
                { key: 'disbursement_date', header: 'Date', render: (item) => formatDate(item.disbursement_date) },
                { key: 'to_whom_paid', header: 'To' },
                { key: 'payment_type', header: 'Payment Type' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* General Transactions */}
            {renderTransactionTable(
              "Transactions",
              filteredTransactions.transactions,
              [
                { key: 'description', header: 'Description' },
                { key: 'amount_credited', header: 'Amount Credited', render: (item) => formatCurrency(item.amount_credited) },
                { key: 'amount_debited', header: 'Amount Debited', render: (item) => formatCurrency(item.amount_debited) },
                { key: 'date_issued', header: 'Date', render: (item) => formatDate(item.date_issued) },
                { key: 'credited_account_name', header: 'Credited Account' },
                { key: 'debited_account_name', header: 'Debited Account' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Chart of Accounts */}
            {renderTransactionTable(
              "Chart of Accounts",
              filteredTransactions.chart_of_accounts,
              [
                { key: 'account_name', header: 'Account Name' },
                { key: 'account_type', header: 'Account Type' },
                { key: 'parent_account', header: 'Parent Account' },
                { key: 'note_number', header: 'Note Number' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Payees */}
            {renderTransactionTable(
              "Payees",
              filteredTransactions.payees,
              [
                { key: 'account_name', header: 'Account Name' },
                { key: 'account_type', header: 'Account Type' },
                { key: 'parent_account', header: 'Parent Account' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}

            {/* Customers */}
            {renderTransactionTable(
              "Customers",
              filteredTransactions.customers,
              [
                { key: 'account_name', header: 'Account Name' },
                { key: 'account_type', header: 'Account Type' },
                { key: 'user', header: 'User', render: (item) => item.user ? item.user.username : 'N/A' }
              ]
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
