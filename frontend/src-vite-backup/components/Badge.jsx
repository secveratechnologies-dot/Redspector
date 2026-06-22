import React from 'react';

const Badge = ({ children, color, variant, label }) => {
  const finalColor = color || variant || 'blue';
  const finalContent = children || label;

  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-orange-100 text-orange-800 border border-orange-200',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        colorClasses[finalColor] || colorClasses.blue
      }`}
    >
      {finalContent}
    </span>
  );
};

export default Badge;
