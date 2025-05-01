import React, { useState, useEffect } from 'react';

const API = 'https://yoming.boogiecoin.com';

const Creditors = () => {
  const [customerName, setCustomerName] = useState(null);
  const [journal, setJournal] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [error, setError] = useState(null);
  const [accountBalances, setAccountBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'outstanding', 'overpaid'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCustomerName('ExampleCustomer');
      setJournal({ total: 1000 });
    } else {
      setError("User is not authenticated");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesResponse, disbursementsResponse] = await Promise.all([
          fetch(`${API}/invoice-received`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${API}/cash-disbursement-journals`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (!invoicesResponse.ok) {
          throw new Error('Failed to fetch invoices');
        }
        if (!disbursementsResponse.ok) {
          throw new Error('Failed to fetch disbursements');
        }

        const invoicesData = await invoicesResponse.json();
        const disbursementsData = await disbursementsResponse.json();

        setInvoices(invoicesData);
        setDisbursements(disbursementsData);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!invoices.length && !disbursements.length) return;

    // Calculate total disbursements per supplier (to_whom_paid)
    const disbursementsBySupplier = disbursements.reduce((acc, disbursement) => {
      const supplier = disbursement.to_whom_paid || disbursement.name || 'Unknown';
      if (!acc[supplier]) {
        acc[supplier] = 0;
      }
      // Use cash + bank amounts from disbursement
      const disbursementAmount = (parseFloat(disbursement.cash) || 0) + (parseFloat(disbursement.bank) || 0);
      acc[supplier] += disbursementAmount;
      return acc;
    }, {});

    // Calculate total invoice amounts per supplier (name)
    const invoicesBySupplier = invoices.reduce((acc, invoice) => {
      const supplier = invoice.name || 'Unknown';
      if (!acc[supplier]) {
        acc[supplier] = 0;
      }
      // Use amount from invoice
      const invoiceAmount = parseFloat(invoice.amount) || 0;
      acc[supplier] += invoiceAmount;
      return acc;
    }, {});

    // Combine all unique suppliers from both invoices and disbursements
    const allSuppliers = new Set([
      ...invoices.map(inv => inv.name),
      ...disbursements.map(disb => disb.to_whom_paid || disb.name)
    ].filter(Boolean));

    // Create account balances for each supplier
    const accountData = Array.from(allSuppliers).map(supplier => {
      const invoiceAmount = invoicesBySupplier[supplier] || 0;
      const disbursementAmount = disbursementsBySupplier[supplier] || 0;
      
      return {
        supplierName: supplier,
        invoiceAmount,
        disbursementAmount,
        clearedAmount: Math.min(invoiceAmount, disbursementAmount),
        remainingBalance: Math.max(0, invoiceAmount - disbursementAmount),
        overpayment: Math.max(0, disbursementAmount - invoiceAmount),
        hasInvoice: invoiceAmount > 0,
        hasDisbursement: disbursementAmount > 0
      };
    });

    // Add suppliers who only have disbursements (no invoices)
    const disbursementOnlySuppliers = Object.keys(disbursementsBySupplier)
      .filter(supplier => !invoicesBySupplier[supplier])
      .map(supplier => ({
        supplierName: supplier,
        invoiceAmount: 0,
        disbursementAmount: disbursementsBySupplier[supplier],
        clearedAmount: 0,
        remainingBalance: 0,
        overpayment: disbursementsBySupplier[supplier],
        hasInvoice: false,
        hasDisbursement: true
      }));

    const combinedData = [...accountData, ...disbursementOnlySuppliers];
    setAccountBalances(combinedData);
    setLoading(false);

  }, [invoices, disbursements]);

  const filteredBalances = accountBalances.filter(account => {
    // Apply search filter
    const matchesSearch = account.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'outstanding') {
      matchesFilter = account.remainingBalance > 0;
    } else if (filter === 'overpaid') {
      matchesFilter = account.overpayment > 0;
    } else if (filter === 'disbursementOnly') {
      matchesFilter = !account.hasInvoice && account.hasDisbursement;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Creditors Reconciliation</h2>
      
      <div style={{ margin: '20px 0' }}>
        <p>Journal Total: KES {journal?.total?.toFixed(2) || '0.00'}</p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label htmlFor="search" style={{ marginRight: '10px' }}>Search:</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        
        <div>
          <label htmlFor="filter" style={{ marginRight: '10px' }}>Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="all">All Suppliers</option>
            <option value="outstanding">With Outstanding Balances</option>
            <option value="overpaid">With Overpayments</option>
            <option value="disbursementOnly">Disbursements Without Invoices</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Supplier Name</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Invoice Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Payment Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Cleared Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Balance</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Overpayment</th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.map((account, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '12px' }}>{account.supplierName}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.invoiceAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.disbursementAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.clearedAmount.toFixed(2)}</td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right',
                  color: account.remainingBalance > 0 ? 'red' : 'inherit'
                }}>
                  KES {account.remainingBalance.toFixed(2)}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right',
                  color: account.overpayment > 0 ? 'blue' : 'inherit'
                }}>
                  KES {account.overpayment.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: 'black', color: 'white', borderRadius: '5px' }}>
        <h3>Summary</h3>
        <p>Total Invoices: KES {accountBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0).toFixed(2)}</p>
        <p>Total Payments: KES {accountBalances.reduce((sum, acc) => sum + acc.disbursementAmount, 0).toFixed(2)}</p>
        <p>Total Cleared: KES {accountBalances.reduce((sum, acc) => sum + acc.clearedAmount, 0).toFixed(2)}</p>
        <p>Total Outstanding: KES {accountBalances.reduce((sum, acc) => sum + acc.remainingBalance, 0).toFixed(2)}</p>
        <p style={{ fontWeight: 'bold' }}>
          Total Overpayment: KES {accountBalances.reduce((sum, acc) => sum + acc.overpayment, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Creditors;