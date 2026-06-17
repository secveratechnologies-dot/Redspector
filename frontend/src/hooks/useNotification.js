import { useState } from 'react';

export const useNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');

  const triggerNotif = (msg) => {
    setNotifMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return {
    showNotification,
    notifMessage,
    triggerNotif,
  };
};
