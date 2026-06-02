import React from 'react';
import './Input.css';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  fullWidth = true,
  id,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'input-container',
    fullWidth ? 'input-full-width' : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input-field',
    error ? 'input-error' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={inputClasses}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
