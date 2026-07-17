// frontend/src/pages/TableReservation.jsx
// Đã refactor: bỏ fetch Firebase trực tiếp → dùng tableService + reservationService
import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FieldLabel, FieldContent, FieldSet } from "@/components/ui/field";

import { fetchAvailableTables, createReservation } from "@/services/TableReservationService";

// ─────────────────────────────────────────────────────────────
export default function TableReservation() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber:  "",
    tableId:      "",   // lưu ID số thực của bàn (gửi lên API)
    tableName:    "",   // chỉ để hiển thị trong <Select>
    guestCount:   "",
    date:         "",
    time:         "",
  });

  const [error,           setError]           = useState("");
  const [minDate,         setMinDate]         = useState("");
  const [availableTables, setAvailableTables] = useState([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  // 1. Tính minDate (hôm nay)
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // 2. Tải danh sách bàn trống từ REST API
  useEffect(() => {
    const loadTables = async () => {
      setIsLoading(true);
      try {
        const tables = await fetchAvailableTables();
        setAvailableTables(tables);
      } catch (err) {
        console.error("[TableReservation] loadTables:", err);
        setError("Could not load available tables. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTables();
  }, []);

  // 3. Xử lý input
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tableSelect") {
      // value là id bàn (string từ <option>)
      const selected = availableTables.find(t => String(t.id) === value);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          tableId:    selected.id,
          tableName:  selected.name,
          guestCount: selected.seats,
        }));
      } else {
        setFormData(prev => ({ ...prev, tableId: "", tableName: "", guestCount: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (error) setError("");
  };

  // 4. Submit → gọi createReservation service
  const handleSubmit = async () => {
    const { customerName, phoneNumber, tableId, guestCount, date, time } = formData;

    // Validate frontend cơ bản
    if (!customerName || !phoneNumber || !tableId || !guestCount || !date || !time) {
      setError("Please fill in all fields!");
      return;
    }

    // Kiểm tra ngày giờ không là quá khứ
    const selectedDateTime = new Date(`${date}T${time}`);
    if (selectedDateTime < new Date()) {
      setError("Cannot select a past date or time!");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Gửi time dạng "HH:mm" (24h) — backend lo format & conflict check
      await createReservation({
        table_id:      tableId,
        customer_name: customerName.trim(),
        phone:         phoneNumber.trim(),
        guests:        Number(guestCount),
        date,
        time,          // "HH:mm"
        status:        "Confirmed",
      });

      navigate("/table-info");
    } catch (err) {
      console.error("[TableReservation] submit error:", err);

      if (err.isConflict) {
        // 409 từ backend — bàn trùng lịch
        setError("This table is already booked at the selected time. Please choose a different time or table.");
      } else {
        setError(err.message || "Failed to create reservation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      customerName: "", phoneNumber: "", tableId: "",
      tableName: "", guestCount: "", date: "", time: "",
    });
    setError("");
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="w-full h-full min-h-screen bg-gray-50 flex items-center justify-center p-10">
      <Card className="w-full max-w-3xl bg-white shadow-xl border border-gray-200">
        <CardHeader className="flex flex-col items-center justify-center pb-2 pt-8">
          <CardTitle className="text-4xl font-serif text-gray-800 tracking-wide uppercase">
            Create Reservation
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8 py-6">
          <FieldSet>
            {/* Row 1 — Customer info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-2">
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Customer Name</FieldLabel>
                <FieldContent>
                  <Input
                    name="customerName"
                    className="h-12 text-lg bg-gray-100/50"
                    value={formData.customerName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Phone Number</FieldLabel>
                <FieldContent>
                  <Input
                    name="phoneNumber"
                    className="h-12 text-lg bg-gray-100/50"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FieldContent>
              </Field>
            </div>

            {/* Row 2 — Table + Guests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Table Number</FieldLabel>
                <FieldContent>
                  <Select
                    name="tableSelect"
                    value={formData.tableId ? String(formData.tableId) : ""}
                    onChange={handleChange}
                    className="h-12 text-lg bg-gray-100/50 border-gray-300 focus-visible:ring-gray-400"
                    disabled={isLoading || isSubmitting}
                  >
                    <option value="" disabled>
                      {isLoading ? "Loading tables..." : "Select a table..."}
                    </option>
                    {availableTables.length > 0 ? (
                      availableTables.map((table) => (
                        <option key={table.id} value={String(table.id)}>
                          {table.name} — {table.areaName} (seats: {table.seats})
                        </option>
                      ))
                    ) : (
                      !isLoading && <option value="" disabled>No available tables</option>
                    )}
                  </Select>
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Number of Guests</FieldLabel>
                <FieldContent>
                  <Input
                    name="guestCount"
                    type="number"
                    min="1"
                    className="h-12 text-lg bg-gray-100/50"
                    value={formData.guestCount}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FieldContent>
              </Field>
            </div>

            {/* Row 3 — Date + Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Date</FieldLabel>
                <FieldContent>
                  <Input
                    name="date"
                    type="date"
                    min={minDate}
                    className="h-12 text-lg bg-gray-100/50 block w-full"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FieldContent>
              </Field>
              <Field orientation="vertical">
                <FieldLabel className="text-lg font-serif text-gray-700 font-medium">Time</FieldLabel>
                <FieldContent>
                  <Input
                    name="time"
                    type="time"
                    className="h-12 text-lg bg-gray-100/50 block w-full"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldSet>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-4 pb-8 pt-0">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200 w-full justify-center">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}
          <Button
            className="w-40 h-12 text-lg uppercase tracking-wider font-semibold bg-[#6d4c41] hover:bg-[#5d4037] text-white transition-all mt-2 flex gap-2 items-center justify-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </Button>
          <Button
            variant="link"
            className="text-gray-500 hover:text-black"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}