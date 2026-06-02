import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  glass = false,
  ...props 
}) => {
  const classes = [
    'card',
    `card-p-${padding}`,
    glass ? 'glass-panel' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
