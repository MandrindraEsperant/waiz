import React from 'react';
import './AuthLayout.css';
import logo from '../logo.svg';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <img src={logo} alt="Waiz Logo" className="auth-logo" />
          {title && <h2 className="auth-title">{title}</h2>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        <div className="auth-content glass-panel">
          {children}
        </div>
      </div>
      <div className="auth-background">
        <div className="auth-shape shape-1"></div>
        <div className="auth-shape shape-2"></div>
      </div>
    </div>
  );
};

export default AuthLayout;
