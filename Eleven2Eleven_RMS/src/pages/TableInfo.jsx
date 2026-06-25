// frontend/src/pages/TableInfo.jsx
// Đã refactor: bỏ fetch trực tiếp → dùng reservationService
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Clock, Calendar, Users, Trash2, User, Phone, Loader2, List, AlertCircle } from "lucide-react";

import {
  fetchReservations,
  cancelReservation,
} from "@/services/TableInfoService";

// ─────────────────────────────────────────────────────────────
export default function TableInfo() {
  const [reservations, setReservations]   = useState([]);
  const [isLoading,    setIsLoading]      = useState(true);
  const [error,        setError]          = useState(null);
  const [filterDate,   setFilterDate]     = useState("");
  const [deletingId,   setDeletingId]     = useState(null); // loading per-card

  // ── Fetch ──────────────────────────────────────────────────
  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Nếu đang lọc theo ngày, truyền date để server lọc luôn
      // (vẫn giữ client-side filter bên dưới làm safety net)
      const data = await fetchReservations();
      setReservations(data);
    } catch (err) {
      console.error("[TableInfo] loadReservations:", err);
      setError(err.message || "Failed to load reservations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // ── Delete ─────────────────────────────────────────────────
  const handleRemoveReservation = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setDeletingId(id);
    try {
      await cancelReservation(id);
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("[TableInfo] delete error:", err);
      alert(`Error cancelling reservation: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Client-side filter (instant UX, no extra request) ─────
  const filteredReservations = reservations.filter((item) => {
    if (!filterDate) return true;
    return item.date === filterDate;
  });

  // ── Render states ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="mt-2 text-gray-500">Loading reservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50 text-red-500 gap-3">
        <AlertCircle className="w-10 h-10" />
        <p className="text-lg font-semibold">Failed to load reservations</p>
        <p className="text-sm text-gray-500">{error}</p>
        <Button variant="outline" onClick={loadReservations}>Retry</Button>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50 text-gray-500">
        <p className="text-xl font-medium">No reservations found.</p>
        <p className="text-sm mt-2">Please go to "Table Reservation" to create a new one.</p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">

      {/* HEADER + FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
            Reservation List
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredReservations.length} / {reservations.length} reservations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {/* Show All */}
            <Button
              variant={!filterDate ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setFilterDate("")}
              title="Show All Reservations"
            >
              <List className="w-5 h-5 text-gray-700" />
            </Button>

            {/* Date filter */}
            <Input
              type="date"
              className="border-0 focus-visible:ring-0 w-auto h-9 bg-transparent"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <Button variant="outline" onClick={loadReservations} className="gap-2 ml-2">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReservations.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <Calendar className="w-12 h-12 mb-2 opacity-20" />
            <p>No reservations found for date: <strong>{filterDate}</strong></p>
            <Button variant="link" onClick={() => setFilterDate("")}>
              Show all reservations
            </Button>
          </div>
        ) : (
          filteredReservations.map((item) => (
            <Card
              key={item.id}
              className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500 flex flex-col"
            >
              <CardHeader className="pb-3 border-b border-gray-100 bg-white rounded-t-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-emerald-700">
                      {item.tableNumber}
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">ID: #{item.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                    {item.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="py-4 space-y-3 flex-1 bg-white">
                <div className="bg-gray-50 p-3 rounded-md space-y-2 mb-2">
                  <div className="flex items-center text-gray-800 font-semibold">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="truncate">{item.customerName}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Phone className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{item.phoneNumber}</span>
                  </div>
                </div>

                <div className="space-y-2 pl-1">
                  <div className="flex items-center text-gray-700 text-sm">
                    <Users className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Guests: <strong>{item.guestCount}</strong></span>
                  </div>
                  <div className="flex items-center text-gray-700 text-sm">
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    <span className={filterDate ? "font-bold text-emerald-600" : ""}>
                      Date: {item.date}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 text-sm">
                    <Clock className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Time: <span className="text-emerald-600 font-bold">{item.time}</span></span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 pb-4 border-t bg-gray-50 flex justify-end rounded-b-xl">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 shadow-sm"
                  disabled={deletingId === item.id}
                  onClick={() => handleRemoveReservation(item.id)}
                >
                  {deletingId === item.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}