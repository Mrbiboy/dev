import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const AlertsList = () => {
  const [alerts, setAlerts] = useState([]);
  const socket = io("http://127.0.0.1:5000"); // Adresse du backend Flask

  useEffect(() => {
    socket.on("new_alert", (alert) => {
      setAlerts((prevAlerts) => [alert, ...prevAlerts]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="alerts-list">
      {alerts.length > 0 ? (
        alerts.map((alert, index) => <div key={index}>⚠️ {alert.message}</div>)
      ) : (
        <p>Aucune alerte</p>
      )}
    </div>
  );
};

export default AlertsList;
