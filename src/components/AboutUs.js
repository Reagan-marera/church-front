import React from 'react';
import './AboutUs.css'; // Assuming you have a CSS file for styling
import ContactUs from './ContactUs'; // Import the ContactUs component

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <header className="about-us-header">
        <h1>About Us</h1>
      </header>
      <section className="about-us-section">
        <p>
          Hello and welcome to Youming Technologies, where we believe in bridging the gap between technology and real-world problems while delivering impactful results.
        </p>
        <p>
          At Youming Technologies, we’re not just providing software solutions; “we are building the future”. Driven by innovation, we are dedicated to pushing the boundaries of what's possible in the digital world.
        </p>
        <p>
          We are passionate about creating technology that simplifies, streamlines, and solves problems. With a team of seasoned experts, Youming Technologies brings deep industry knowledge and technical prowess to every project.
        </p>
      </section>
      <section className="commitment-section">
        <h2>Our Commitment</h2>
        <p>
          We are committed to the success of our clients, providing comprehensive ICT solutions and dedicated support to help them achieve their goals at a minimum cost. We intend to build strong, lasting partnerships with our clients, delivering solutions that empower them to thrive and grow.
        </p>
      </section>
      <section className="objectives-section">
        <h2>Objectives</h2>
        <ul>
          <li>Ensure accurate financial data entry and processing, minimizing errors and discrepancies.</li>
          <li>Automate all manual repetitive tasks such as reconciliations and reporting, saving time and resources.</li>
          <li>Streamline financial workflows, improving efficiency and production.</li>
          <li>Provide real-time access to accurate and comprehensive financial information, enabling informed decision-making.</li>
          <li>Generate customizable reports that provide clear insights into the clients' financial performance.</li>
          <li>Offer well-designed financial planning tools like budget modules and financial analysis tools.</li>
          <li>Provide an interactive and user-friendly system that is easy to learn and use.</li>
          <li>Offer excellent customer support and training resources.</li>
          <li>Customize based on user requirements and adjust for necessary changes.</li>
          <li>Provide post-implementation support services.</li>
        </ul>
      </section>
      <section className="toolkit-section">
        <h2>Youming Technologies Toolkit</h2>
        <p>
          Youming Technologies Toolkit is a custom-crafted application that hosts automated financial reporting systems tailored to meet the financial management needs of various non-profit organizations, including schools, churches, and Non-governmental organizations.
        </p>
      </section>
      <section className="features-section">
        <h2>Functional Features</h2>
        <h3>Financial Planning</h3>
        <p>
          Our clients are provided with comprehensive financial planning tools that aid in setting financial goals and creating strategies that guide in organizing an entity’s financial life to reach both short-term and long-term objectives.
        </p>
        <h4>Financial Planning Tools</h4>
        <ul>
          <li>
            <strong>Chart of Accounts:</strong> Provides a structural framework for categorizing all financial transactions into Assets, Liabilities, Equity, and Expenses.
          </li>
          <li>
            <strong>Budget Template:</strong> Allows clients to track income and expenses, facilitating goal achievements and informed decision-making.
          </li>
          <li>
            <strong>Customer Management:</strong> Maintains centralized customer data and integrates with sales and invoicing functions to streamline processes.
          </li>
          <li>
            <strong>Payee Management:</strong> Ensures accurate handling of payments to suppliers and vendors, improving payment processes.
          </li>
        </ul>
        <h3>Transactions Recording</h3>
        <p>
          Youming Financial Reporting System allows our clients to record daily transactions into various entry journals, including invoices issued journal, invoices received journal, cash receipt journal, and cash disbursement journal.
        </p>
        <h4>Transactions Recording Tools</h4>
        <ul>
          <li>
            <strong>Invoices Issued Journal:</strong> Records all data relating to invoices issued and manages accounts receivables.
          </li>
          <li>
            <strong>Invoices Received Journal:</strong> Manages entity’s obligations and expenditures by tracking all payments to be made.
          </li>
          <li>
            <strong>Cash Receipts Journal:</strong> Provides detailed records of all cash inflows, ensuring accurate accounting.
          </li>
          <li>
            <strong>Cash Disbursement Journal:</strong> Monitors all cash outflows and maintains control over cash disbursements.
          </li>
        </ul>
        <h3>Financial Reporting</h3>
        <p>
          Automates the creation of essential financial reports, including General Ledger, Trial Balance, Income and Expenditures, Balance Sheet, and Cash Flow Statement.
        </p>
        <h4>Financial Reports</h4>
        <ul>
          <li>
            <strong>General Ledger:</strong> Central repository of all financial transactions, ensuring accurate financial statements.
          </li>
          <li>
            <strong>Trial Balance:</strong> Enlists all ledger accounts and their balances, verifying the mathematical accuracy of the general ledger.
          </li>
          <li>
            <strong>Income Statement:</strong> Provides a clear and accurate report of income and expenditures.
          </li>
          <li>
            <strong>Balance Sheet:</strong> Offers a comprehensive view of the entity’s financial health.
          </li>
          <li>
            <strong>Statement of Cash Flows:</strong> Tracks all cash inflows and outflows using the Direct method.
          </li>
          <li>
            <strong>Statement of Change in Equity:</strong> Provides a clear picture of how the entity’s equity has changed over time.
          </li>
          <li>
            <strong>Statement of Budget Estimates against Actuals:</strong> Compares budget estimates with actual financial performance.
          </li>
        </ul>
      </section>
      <section className="schools-section">
        <h2>Youming Technologies System for Schools</h2>
        <p>
          Youming Technologies' Financial Reporting system for schools is designed to streamline and automate schools' financial management processes and generate financial reports at any given time, including monthly, quarterly, and end-year final reports to create a unified view of the entity’s financial health.
        </p>
        <p>
          The system is designed with the ability to consolidate data in adherence to generally accepted accounting principles (GAAP).
        </p>
      </section>
      <section className="public-schools-section">
        <h2>Youming Technologies System for Public Schools</h2>
        <p>
          According to PSASB Kenya, the current public schools' financial reporting framework has not provided disclosure of adequate financial information. Significant key weaknesses include lack of standardization and incomplete financial information.
        </p>
        <p>
          These challenges triggered financial management reforms in public schools, leading to the establishment of the Public Sector Accounting Standards Board (PSASB) and the adoption of International Public Sector Accounting Standards (IPSAS).
        </p>
      </section>
      <section className="fundamental-principles-section">
        <h2>Fundamental Principles and Concepts Applied</h2>
        <h3>Accounting Bases, Assumptions, and Concepts</h3>
        <ul>
          <li>
            <strong>Going-concern Assumption:</strong> Assumes the entity will remain in operation in the foreseeable future.
          </li>
          <li>
            <strong>Materiality Concept:</strong> Information is material if its omission could influence economic decisions.
          </li>
          <li>
            <strong>Prudence Concept:</strong> Ensures assets or income are not overstated, and liabilities or expenses are not understated.
          </li>
          <li>
            <strong>Identification of Financial Statements:</strong> Financial statements are clearly identified and distinguished from other information.
          </li>
          <li>
            <strong>Comparative Information:</strong> Comparative information is presented for all amounts reported in the financial statements.
          </li>
          <li>
            <strong>Offsetting:</strong> Assets and liabilities, receipts and payments are not offset unless required by accounting standards.
          </li>
        </ul>
        <h3>Elements of Financial Statements</h3>
        <ul>
          <li>
            <strong>Assets:</strong> Resources with economic benefits that the entity owns or controls.
          </li>
          <li>
            <strong>Liabilities:</strong> Present obligations of the school for an outflow of resources.
          </li>
          <li>
            <strong>Revenue:</strong> Inflow of economic benefits during the reporting period.
          </li>
          <li>
            <strong>Expenses:</strong> Costs incurred and expired by the school during the reporting period.
          </li>
          <li>
            <strong>Surplus/Deficit:</strong> The amount by which revenue exceeds or falls short of expenses.
          </li>
        </ul>
      </section>
      <section className="accounting-policies-section">
        <h2>Accounting Policies</h2>
        <h3>Statement of Compliance and Basis of Preparation</h3>
        <p>
          Financial statements are prepared on a historical cost basis, except for certain items measured at fair value or re-valued amounts. The statements comply with International Public Sector Accounting Standards (IPSAS) and relevant legislation.
        </p>
        <h3>Summary of Significant Accounting Policies</h3>
        <ul>
          <li>
            <strong>Revenue Recognition:</strong> Revenue is recognized when control of the asset is obtained, and it is probable that economic benefits will flow to the entity.
          </li>
          <li>
            <strong>Budget Information:</strong> The budget is prepared on a cash basis, while financial statements are prepared on an accrual basis.
          </li>
          <li>
            <strong>Taxes:</strong> Public schools are exempted from paying taxes. Sales tax is recognized net of the amount recoverable from the taxation authority.
          </li>
          <li>
            <strong>Investment Property:</strong> Measured initially at cost, including transaction costs, and derecognized when disposed of or withdrawn from use.
          </li>
          <li>
            <strong>Property, Plant, and Equipment:</strong> Stated at cost less accumulated depreciation and impairment losses.
          </li>
          <li>
            <strong>Leases:</strong> Finance leases are capitalized at the commencement of the lease, while operating leases are recognized as expenses.
          </li>
          <li>
            <strong>Intangible Assets:</strong> Recognized at cost and carried at cost less any accumulated amortization and impairment losses.
          </li>
          <li>
            <strong>Research and Development Costs:</strong> Research costs are expensed as incurred, while development costs are recognized as intangible assets when certain criteria are met.
          </li>
          <li>
            <strong>Financial Instruments:</strong> Measured at fair value plus transaction costs, classified based on the entity’s management model and cash flow characteristics.
          </li>
          <li>
            <strong>Inventories:</strong> Measured at cost upon initial recognition and subsequently at the lower of cost and net realizable value.
          </li>
          <li>
            <strong>Provisions:</strong> Recognized when there is a present obligation, it is probable that an outflow of resources will be required, and a reliable estimate can be made.
          </li>
          <li>
            <strong>Social Benefits:</strong> Recognized as an expense when a liability is incurred.
          </li>
          <li>
            <strong>Changes in Accounting Policies and Estimates:</strong> Effects of changes are recognized retrospectively, unless impractical.
          </li>
          <li>
            <strong>Employee Benefits:</strong> Defined contribution plans are recognized as expenses when contributions are due. Defined benefit plans are actuarially valued.
          </li>
          <li>
            <strong>Foreign Currency Transactions:</strong> Accounted for at the ruling rate of exchange on the date of the transaction.
          </li>
          <li>
            <strong>Borrowing Costs:</strong> Capitalized against qualifying assets during the period of acquisition or construction.
          </li>
          <li>
            <strong>Related Parties:</strong> Persons or entities with the ability to exert control or significant influence over the Entity.
          </li>
          <li>
            <strong>Service Concession Arrangements:</strong> Assets are recognized when control or regulation of services is achieved.
          </li>
          <li>
            <strong>Cash and Cash Equivalents:</strong> Comprise cash on hand, short-term deposits, and highly liquid investments with an original maturity of three months or less.
          </li>
        </ul>
      </section>
      <section className="significant-judgements-section">
        <h2>Significant Judgements and Sources of Estimation Uncertainty</h2>
        <p>
          The preparation of financial statements requires management to make judgments, estimates, and assumptions that affect the reported amounts. Uncertainty about these assumptions could result in material adjustments in future periods.
        </p>
        <h3>Useful Lives and Residual Values</h3>
        <p>
          The useful lives and residual values of assets are assessed using indicators such as the condition of the asset, susceptibility to changes in technology, and availability of funding for replacement.
        </p>
        <h3>Provisions</h3>
        <p>
          Provisions are raised based on the best estimate of the expenditure required to settle the obligation at the reporting date and are discounted to present value where the effect is material.
        </p>
      </section>
      <section className="cta-section">
      </section>
      <ContactUs /> {/* Include the ContactUs component here */}
    </div>
  );
};

export default AboutUs;
