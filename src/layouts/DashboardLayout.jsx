import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './DashboardLayout.css';

const DashboardLayout = ({ children, sidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="dashboard-body">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
            {sidebar}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main">
          <div className="dashboard-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
