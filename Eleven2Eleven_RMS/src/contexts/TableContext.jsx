import React, { createContext, useContext, useState, useEffect } from "react";

const TableContext = createContext();

export const useTableContext = () => useContext(TableContext);

export const TableProvider = ({ children }) => {
  const [reservations, setReservations] = useState(() => {
    const savedData = localStorage.getItem("table_reservations");
    return savedData ? JSON.parse(savedData) : [];
  });

  useEffect(() => {
    localStorage.setItem("table_reservations", JSON.stringify(reservations));
  }, [reservations]);

  const addReservation = (newReservation) => {
    const reservationWithId = {
      ...newReservation,
      id: Date.now(),
      status: "Confirmed", // Changed to English
      createdAt: new Date().toLocaleString()
    };
    
    setReservations((prev) => [...prev, reservationWithId]);
  };

  const removeReservation = (id) => {
    setReservations((prev) => prev.filter(item => item.id !== id));
  };

  return (
    <TableContext.Provider value={{ reservations, addReservation, removeReservation }}>
      {children}
    </TableContext.Provider>
  );
};