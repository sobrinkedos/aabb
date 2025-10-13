import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardOverview } from './components/DashboardOverview';
import { CashReport } from './components/CashReport';
import { TransactionHistory } from './components/TransactionHistory';
import { CashTest } from './components/CashTest';
import { DailyCashMovement } from './components/DailyCashMovement';

const CashManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/reports" element={<CashReport />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/movement" element={<DailyCashMovement />} />
        <Route path="/test" element={<CashTest />} />
      </Routes>
    </div>
  );
};

export default CashManagement;