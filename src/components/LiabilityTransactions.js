import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const LiabilityTransactions = ({ startDate, endDate }) => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`https://backend.youmingtechnologies.co.ke/liabilitytransactions?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();

        const normalizedData = [
          ...data.cash_disbursements.map((cd) => {
            const accountNameWithCode = cd.account_debited?.trim() || 'N/A';

            return {
              type: 'Cash Disbursement',
              date: cd.disbursement_date,
              reference: cd.cheque_no || 'N/A',
              from: cd.to_whom_paid || 'N/A',
              description: cd.description || 'No description',
              debited_amount: Number(cd.total) || 0,
              credited_amount: 0,
              parent_account: cd.parent_account?.trim() || 'N/A',
              account_name: accountNameWithCode,
            };
          }),
          ...data.invoices_received.flatMap((inv) =>
            inv.account_debited?.map((account) => ({
              type: 'Invoice Received',
              date: inv.date_issued,
              reference: inv.invoice_number || 'N/A',
              from: inv.name || 'N/A',
              description: inv.description || 'No description',
              debited_amount: Number(account.amount) || 0,
              credited_amount: 0,
              parent_account: inv.parent_account?.trim() || 'N/A',
              account_name: account.name || 'N/A',
            })) || []
          ),
          ...data.transactions.map((txn) => {
            const isLiabilityAccount =
              txn.credited_account_name && /^2[0-9]\d{2}/.test(txn.credited_account_name.split('-')[0].trim());

            return {
              type: 'Transaction',
              date: txn.date_issued,
              reference: txn.id || 'N/A',
              from: txn.credited_account_name || 'N/A',
              description: txn.description || 'No description',
              debited_amount: 0,
              credited_amount: isLiabilityAccount ? Number(txn.amount_credited) || 0 : 0,
              parent_account: txn.parent_account?.trim() || 'N/A',
              account_name: txn.credited_account_name || 'N/A',
            };
          }),
        ];

        setCombinedData(normalizedData);
        setFilteredData(normalizedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term) {
      const filtered = combinedData.filter((item) =>
        item.type.toLowerCase().includes(term) ||
        String(item.reference).toLowerCase().includes(term) ||
        item.from.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.parent_account.toLowerCase().includes(term) ||
        item.account_name.toLowerCase().includes(term)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      Type: item.type,
      Date: item.date,
      Reference: item.reference,
      From: item.from,
      Description: item.description,
      'DR Amount': item.debited_amount,
      'CR Amount': item.credited_amount,
      'Parent Account': item.parent_account,
      'Account Name': item.account_name,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LiabilityTransactions");
    XLSX.writeFile(workbook, "LiabilityTransactions.xlsx");
  };

  const totalDR = filteredData.reduce((sum, item) => sum + (Number(item.debited_amount) || 0), 0);
  const totalCR = filteredData.reduce((sum, item) => sum + (Number(item.credited_amount) || 0), 0);
  const closingBalance = totalCR - totalDR;

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Liability Transactions</h1>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by type, reference, description, or account..."
          value={searchTerm}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>
      <button onClick={exportToExcel} style={styles.exportButton}>
        Export to Excel
      </button>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>From</th>
            <th>Description</th>
            <th>DR Amount</th>
            <th>CR Amount</th>
            <th>Parent Account</th>
            <th>Account Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
              <td>{item.type}</td>
              <td>{item.date}</td>
              <td>{item.reference}</td>
              <td>{item.from}</td>
              <td>{item.description}</td>
              <td>{formatNumber(item.debited_amount)}</td>
              <td>{formatNumber(item.credited_amount)}</td>
              <td>{item.parent_account}</td>
              <td>{item.account_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.totalAmount}>
        <div>Total DR: {formatNumber(totalDR)}</div>
        <div>Total CR: {formatNumber(totalCR)}</div>
        <div>Closing Balance: {formatNumber(closingBalance)}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f4f6f9',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    fontFamily: 'Georgia, serif',
    color: '#003366',
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '10px',
    width: '300px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  exportButton: {
    padding: '10px 15px',
    backgroundColor: '#003366',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#003366',
    color: 'white',
    textAlign: 'left',
    fontWeight: 'bold',
    padding: '12px 15px',
  },
  evenRow: {
    backgroundColor: '#f7f7f7',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  totalAmount: {
    marginTop: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textAlign: 'right',
    color: '#003366',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#007BFF',
  },
  error: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#FF0000',
  },
};

export default LiabilityTransactions;
