import React from 'react';
import { CheckCircle } from 'lucide-react';

const Notification = ({ show, message }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50">
      <CheckCircle className="text-orange-400" />
      <span>{message}</span>
    </div>
  );
};

export default Notification;
