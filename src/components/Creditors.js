import React, { useState, useEffect } from 'react';

const API = 'https://backend.youmingtechnologies.co.ke';

const Creditors = () => {
  const [customerName, setCustomerName] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [error, setError] = useState(null);
  const [accountBalances, setAccountBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountNames, setAccountNames] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [supplierToAccountMap, setSupplierToAccountMap] = useState({});
  const [unspecifiedDisbursements, setUnspecifiedDisbursements] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCustomerName('ExampleCustomer');
    } else {
      setError("User is not authenticated");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesResponse, disbursementsResponse, accountsResponse] = await Promise.all([
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
          }),
          fetch(`${API}/payee`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (!invoicesResponse.ok || !disbursementsResponse.ok || !accountsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const invoicesData = await invoicesResponse.json();
        const disbursementsData = await disbursementsResponse.json();
        const accountsData = await accountsResponse.json();

        setInvoices(invoicesData);
        setDisbursements(disbursementsData);
        setAccountNames(accountsData.map(account => account.account_name));

        const map = {};
        accountsData.forEach(account => {
          account.sub_account_details.forEach(subAccount => {
            map[subAccount.name] = account.account_name;
          });
        });
        setSupplierToAccountMap(map);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!invoices.length || !disbursements.length || !Object.keys(supplierToAccountMap).length) return;

    let unspecifiedAmount = 0;

    // Aggregate disbursements by supplier and payment type
    const disbursementsBySupplierAndType = disbursements.reduce((acc, disbursement) => {
      const supplier = disbursement.to_whom_paid || disbursement.name || 'Unknown';
      const paymentType = disbursement.payment_type;
      if (!paymentType) {
        unspecifiedAmount += (parseFloat(disbursement.cash) || 0) + (parseFloat(disbursement.bank) || 0);
        return acc;
      }

      if (!acc[supplier]) acc[supplier] = { invoiced: 0, cash: 0 };
      const disbursementAmount = (parseFloat(disbursement.cash) || 0) + (parseFloat(disbursement.bank) || 0);
      if (paymentType === 'Invoiced') {
        acc[supplier].invoiced += disbursementAmount;
      } else if (paymentType === 'Cash') {
        acc[supplier].cash += disbursementAmount;
      }
      return acc;
    }, {});

    setUnspecifiedDisbursements(unspecifiedAmount);

    // Aggregate invoices by supplier
    const invoicesBySupplier = invoices.reduce((acc, invoice) => {
      const supplier = invoice.name || 'Unknown';
      if (!acc[supplier]) acc[supplier] = 0;
      const invoiceAmount = parseFloat(invoice.amount) || 0;
      acc[supplier] += invoiceAmount;
      return acc;
    }, {});

    // Get unique suppliers from both invoices and disbursements
    const allSuppliers = new Set([
      ...Object.keys(invoicesBySupplier),
      ...Object.keys(disbursementsBySupplierAndType)
    ]);

    // Create account data for each unique supplier
    const accountData = Array.from(allSuppliers).map(supplier => {
      const invoiceAmount = invoicesBySupplier[supplier] || 0;
      const disbursements = disbursementsBySupplierAndType[supplier] || { invoiced: 0, cash: 0 };
      const totalDisbursements = disbursements.invoiced + disbursements.cash;
      return {
        supplierName: supplier,
        accountName: supplierToAccountMap[supplier] || 'Unknown',
        invoiceAmount,
        disbursementAmount: totalDisbursements,
        disbursementsInvoiced: disbursements.invoiced,
        disbursementsCash: disbursements.cash,
        remainingBalance: Math.max(0, invoiceAmount - disbursements.invoiced),
        overpayment: Math.max(0, disbursements.invoiced - invoiceAmount),
        hasInvoice: invoiceAmount > 0,
        hasDisbursement: totalDisbursements > 0
      };
    });

    // Add suppliers with only disbursements
    const disbursementOnlySuppliers = Object.keys(disbursementsBySupplierAndType)
      .filter(supplier => !invoicesBySupplier[supplier])
      .map(supplier => {
        const disbursements = disbursementsBySupplierAndType[supplier];
        return {
          supplierName: supplier,
          accountName: supplierToAccountMap[supplier] || 'Unknown',
          invoiceAmount: 0,
          disbursementAmount: disbursements.invoiced + disbursements.cash,
          disbursementsInvoiced: disbursements.invoiced,
          disbursementsCash: disbursements.cash,
          remainingBalance: 0,
          overpayment: disbursements.invoiced + disbursements.cash,
          hasInvoice: false,
          hasDisbursement: true
        };
      });

    // Combine data and remove duplicates
    const combinedData = [...accountData, ...disbursementOnlySuppliers];
    const uniqueData = combinedData.reduce((acc, current) => {
      const existingSupplier = acc.find(item => item.supplierName === current.supplierName);
      if (!existingSupplier) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    setAccountBalances(uniqueData);
    setLoading(false);
  }, [invoices, disbursements, supplierToAccountMap]);

  const filteredBalances = accountBalances.filter(account => {
    const matchesSearch = account.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount ? account.accountName === selectedAccount : true;
    let matchesFilter = true;
    if (filter === 'outstanding') {
      matchesFilter = account.remainingBalance > 0;
    } else if (filter === 'overpaid') {
      matchesFilter = account.overpayment > 0;
    } else if (filter === 'disbursementOnly') {
      matchesFilter = !account.hasInvoice && account.hasDisbursement;
    }
    return matchesSearch && matchesAccount && matchesFilter;
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
          <label htmlFor="account" style={{ marginRight: '10px' }}>Account:</label>
          <select
            id="account"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Accounts</option>
            {accountNames.map((name, index) => (
              <option key={index} value={name}>{name}</option>
            ))}
          </select>
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
              <th style={{ padding: '12px', textAlign: 'right' }}>Disbursements (Invoiced)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Disbursements (Cash)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Disbursements</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Balance</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Overpayment</th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.map((account, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '12px' }}>{account.supplierName}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.invoiceAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.disbursementsInvoiced.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.disbursementsCash.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.disbursementAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: account.remainingBalance > 0 ? 'red' : 'inherit' }}>
                  KES {account.remainingBalance.toFixed(2)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: account.overpayment > 0 ? 'blue' : 'inherit' }}>
                  KES {account.overpayment.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '30px', padding: '15px', background: 'black', color: 'white', borderRadius: '5px' }}>
        <h3>Summary</h3>
        <p>Total Invoices: KES {filteredBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0).toFixed(2)}</p>
        <p>Total Disbursements (Invoiced): KES {filteredBalances.reduce((sum, acc) => sum + acc.disbursementsInvoiced, 0).toFixed(2)}</p>
        <p>Total Disbursements (Cash): KES {filteredBalances.reduce((sum, acc) => sum + acc.disbursementsCash, 0).toFixed(2)}</p>
        <p>Total Disbursements: KES {filteredBalances.reduce((sum, acc) => sum + acc.disbursementAmount, 0).toFixed(2)}</p>
        <p>Total Unspecified Disbursements: KES {unspecifiedDisbursements.toFixed(2)}</p>
        <p>
          Total Outstanding: KES {
            (filteredBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0) -
             filteredBalances.reduce((sum, acc) => sum + acc.disbursementsInvoiced, 0))
            .toFixed(2)
          }
        </p>
        <p style={{ fontWeight: 'bold' }}>
          Total Overpayment: KES {filteredBalances.reduce((sum, acc) => sum + acc.overpayment, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Creditors;
