import React, { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { getProducts, getTables, updateTable, getOrders } from '../data_access/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, DollarSign, Package, History } from 'lucide-react';

export default function PaymentDashboard() {
  const { savedOrders, checkoutTable, downloadInvoice } = useOrders();
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [billMode, setBillMode] = useState('pending'); // 'pending' | 'history'
  const [firebaseOrders, setFirebaseOrders] = useState([]); // Orders from Firebase
  const [loading, setLoading] = useState(true);

  // Load danh sách sản phẩm để lấy giá tiền & danh sách bàn để cập nhật trạng thái & orders từ Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [prods, tabs, orders] = await Promise.all([getProducts(), getTables(), getOrders()]);
        setProducts(prods || []);
        setTables(tabs || []);
        const normalizedOrders = (orders || []).map(o => ({
          id: o.id,
          tableNumber: o.table_number ?? o.tableNumber,
          table_number: o.table_number,
          items: o.items || [],
          totalAmount: o.total_amount ?? o.totalAmount,
          total_amount: o.total_amount,
          timestamp: o.timestamp
        }))
        setFirebaseOrders(normalizedOrders)
      } catch (err) {
        console.error('Lỗi load dữ liệu PaymentDashboard:', err);
      } finally {
        setLoading(false)
      }
    };
    fetchData();
  }, []);

  // Tính toán doanh thu tổng từ Firebase orders
  const totalRevenue = firebaseOrders?.reduce((sum, t) => sum + (t.total_amount ?? t.totalAmount ?? 0), 0) || 0;
  const totalBills = firebaseOrders?.length || 0;

  // --- Tính toán dữ liệu cho đồ thị ngày / tháng từ Firebase orders ---
  const dailyStats = React.useMemo(() => {
    const map = {};
    (firebaseOrders || []).forEach((t) => {
      if (!t.timestamp) return;
      const d = new Date(t.timestamp);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = { date: key, revenue: 0, count: 0 };
      map[key].revenue += t.total_amount ?? t.totalAmount ?? 0;
      map[key].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-7); // 7 ngày gần nhất
  }, [firebaseOrders]);

  const monthlyStats = React.useMemo(() => {
    const map = {};
    (firebaseOrders || []).forEach((t) => {
      if (!t.timestamp) return;
      const d = new Date(t.timestamp);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      if (!map[key]) map[key] = { month: key, revenue: 0, count: 0 };
      map[key].revenue += t.total_amount ?? t.totalAmount ?? 0;
      map[key].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => (a.month < b.month ? -1 : 1))
      .slice(-6); // 6 tháng gần nhất
  }, [firebaseOrders]);

  const currentOrder =
    billMode === 'pending'
      ? savedOrders.find((o) => o.tableNumber === selectedTable)
      : null;

  const currentHistory =
    billMode === 'history'
      ? firebaseOrders.find((t) => String(t.id) === String(selectedHistoryId))
      : null;

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.name === item.dishName);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handlePayment = async () => {
    if (!currentOrder) return;
    const total = calculateTotal(currentOrder.items);

    try {
      // 1. Cập nhật trạng thái bàn trên Firebase -> Available
      const currentTable = tables.find(
        (t) => (t.name || `Bàn ${t.id}`) === currentOrder.tableNumber,
      );

      if (currentTable) {
        await updateTable(currentTable.id, {
          status: 'Available',
          reservation_time: '',
        });
        setTables((prev) =>
          prev.map((t) =>
            t.id === currentTable.id ? { ...t, status: 'Available' } : t,
          ),
        );
      }

      // 2. Tải hóa đơn về máy (.txt)
      const invoiceForPrint = {
        tableNumber: currentOrder.tableNumber,
        items: currentOrder.items.map((item) => {
          const product = products.find((p) => p.name === item.dishName);
          return {
            ...item,
            price: product ? product.price : 0,
          };
        }),
        totalAmount: total,
        date: new Date().toLocaleString('vi-VN'),
      };
      downloadInvoice(invoiceForPrint);

      // 3. Ghi nhận giao dịch & xóa đơn hàng khỏi hệ thống
      checkoutTable(selectedTable, total);

      alert(`Thanh toán thành công bàn ${selectedTable}. Số tiền: ${total.toLocaleString()}đ`);
      setSelectedTable('');
    } catch (error) {
      console.error('Lỗi thanh toán từ PaymentDashboard:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái bàn hoặc lưu hóa đơn.');
    }
  };

  return (
    <div className="p-10 w-full bg-slate-50 overflow-y-auto h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          Payment & Dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-2 max-w-2xl mx-auto">
          Track revenue, print invoices for active tables, and review past paid invoices.
        </p>
      </div>

      {/* Stats Cards (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 text-white shadow-lg rounded-2xl">
          <CardContent className="pt-6 pb-6 flex items-center justify-between">
            <div className="flex-1 text-center md:text-left">
              <p className="opacity-90 text-xs md:text-sm font-medium uppercase tracking-wider">
                Total Revenue
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold mt-2">
                {totalRevenue.toLocaleString()}
              </h2>
              <p className="text-[11px] md:text-xs opacity-75 mt-1">
                Total of all paid invoices
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-16 w-16 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <DollarSign size={40} className="opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-2xl border border-slate-100 bg-white">
          <CardContent className="pt-6 pb-6 flex items-center justify-between">
            <div className="flex-1 text-center md:text-left">
              <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">
                Paid Invoices
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 mt-2">
                {totalBills}
              </h2>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1">Number of successful checkouts</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-100">
                <Package size={36} className="text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section: doanh thu theo ngày / số lượng đơn theo tháng (biểu đồ cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Biểu đồ cột doanh thu theo ngày */}
        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-800">
              Revenue in the Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {dailyStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No data available to display.
              </p>
            ) : (
              <div className="h-52 flex gap-3 md:gap-4">
                {dailyStats.map((d) => {
                  const maxRevenue = Math.max(...dailyStats.map((x) => x.revenue || 0)) || 1;
                  const height = `${Math.max(
                    8,
                    Math.round((d.revenue / maxRevenue) * 100),
                  )}%`;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end h-full text-[10px] md:text-xs"
                    >
                      <div className="flex-1 flex items-end w-full">
                        <div
                          className="w-full mx-auto rounded-t-lg bg-gradient-to-t from-emerald-400 to-blue-500 shadow-sm"
                          style={{ height }}
                        />
                      </div>
                      <span className="mt-1 text-slate-500">
                        {new Date(d.date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-700 font-semibold">
                        {d.revenue.toLocaleString()}$
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biểu đồ cột số lượng hóa đơn theo tháng */}
        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-800">
              Number of Invoices by Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {monthlyStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No data available to display.
              </p>
            ) : (
              <div className="h-52 flex gap-3 md:gap-4">
                {monthlyStats.map((m) => {
                  const maxCount = Math.max(...monthlyStats.map((x) => x.count || 0)) || 1;
                  const height = `${Math.max(
                    8,
                    Math.round((m.count / maxCount) * 100),
                  )}%`;
                  const [year, month] = m.month.split('-');
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center justify-end h-full text-[10px] md:text-xs"
                    >
                      <div className="flex-1 flex items-end w-full">
                        <div
                          className="w-full mx-auto rounded-t-lg bg-gradient-to-t from-indigo-400 to-purple-500 shadow-sm"
                          style={{ height }}
                        />
                      </div>
                      <span className="mt-1 text-slate-500">
                        {`${Number(month)}-${year.slice(2)}`}
                      </span>
                      <span className="text-[10px] text-slate-700 font-semibold">
                        {m.count} invoices
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Section (Thanh toán / Xem lại) */}
        <Card className="shadow-md border border-slate-100 rounded-2xl bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Receipt className="text-emerald-600 h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Print Table Invoice</span>
                  <span className="text-[11px] text-slate-400">
                    Pay for active tables or review past invoices
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Tabs chế độ xem */}
            <div className="inline-flex mb-4 rounded-full bg-slate-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setBillMode('pending');
                  setSelectedHistoryId('');
                }}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billMode === 'pending' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                }`}
              >
                Pending Orders
              </button>
              <button
                type="button"
                onClick={() => {
                  setBillMode('history');
                  setSelectedTable('');
                }}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billMode === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                }`}
              >
                Paid Invoices
              </button>
            </div>

            {/* Bộ chọn đối tượng */}
            {billMode === 'pending' ? (
              <select
                className="w-full p-2.5 border rounded-xl mb-4 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">-- Select pending table --</option>
                {savedOrders?.map((o) => (
                  <option key={o.tableNumber} value={o.tableNumber}>
                    Table: {o.tableNumber}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="w-full p-2.5 border rounded-xl mb-4 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={selectedHistoryId}
                onChange={(e) => setSelectedHistoryId(e.target.value)}
              >
                <option value="">-- Select paid invoice --</option>
                {firebaseOrders &&
                  firebaseOrders.length > 0 &&
                  firebaseOrders
                    .slice()
                    .reverse()
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {`Table ${t.table_number ?? t.tableNumber} - ${new Date(t.timestamp).toLocaleString('vi-VN')}`}
                      </option>
                    ))}
              </select>
            )}

            {/* Hiển thị nội dung hóa đơn */}
            {billMode === 'pending' ? (
              currentOrder ? (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-dashed border-slate-300 p-6 rounded-2xl shadow-inner">
                  <div className="text-center mb-4">
                    <h3 className="font-black text-xl tracking-wide text-slate-900">RESTAURANT BILL</h3>
                    <p className="text-[11px] text-slate-500 uppercase mt-1">
                      Table: <span className="font-semibold text-slate-700">{selectedTable}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date().toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {currentOrder?.items?.map((item, i) => {
                      const p = products.find((x) => x.name === item.dishName);
                      const lineTotal = p ? p.price * item.quantity : 0;
                      return (
                        <div key={i} className="flex justify-between items-center py-1">
                          <span className="text-slate-700">
                            {item.dishName}
                            <span className="text-xs text-slate-400"> x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-slate-800">
                            {lineTotal.toLocaleString()}$
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-300 mt-4 pt-4 flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-700">TOTAL</span>
                    <span className="font-extrabold text-2xl text-blue-600">
                      {calculateTotal(currentOrder.items).toLocaleString()}$
                    </span>
                  </div>

                  <Button
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide"
                    onClick={handlePayment}
                  >
                    CONFIRM PAYMENT
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-2xl bg-slate-50/60 text-sm">
                  Please select a pending table to display the invoice details
                </div>
              )
            ) : currentHistory ? (
              <div className="bg-white border border-indigo-100 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-indigo-500 tracking-wider">
                      PAID INVOICES
                    </p>
                    <h3 className="font-black text-xl text-slate-900 mt-1">
                      Table {currentHistory.tableNumber}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    PAID
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  {new Date(currentHistory.timestamp).toLocaleString('vi-VN')}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  {currentHistory.items?.map((item, i) => {
                    const p = products.find((x) => x.name === item.dishName);
                    const lineTotal = p ? p.price * item.quantity : 0;
                    return (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-slate-700">
                          {item.dishName}
                          <span className="text-xs text-slate-400"> x{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-slate-800">
                          {lineTotal.toLocaleString()}$
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-700">TOTAL</span>
                  <span className="font-extrabold text-2xl text-indigo-600">
                    {currentHistory.totalAmount.toLocaleString()}$
                  </span>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <p className="text-[11px] text-slate-400 text-center">
                    This is a review of the invoice. You can reprint the invoice using the button below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs md:text-sm px-4 py-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => {
                      const total =
                        currentHistory.totalAmount ||
                        calculateTotal(currentHistory.items || []);
                      const invoiceForPrint = {
                        tableNumber: currentHistory.tableNumber,
                        items: (currentHistory.items || []).map((item) => {
                          const p = products.find((x) => x.name === item.dishName);
                          return {
                            ...item,
                            price: p ? p.price : 0,
                          };
                        }),
                        totalAmount: total,
                        date: new Date(currentHistory.timestamp).toLocaleString('en-US'),
                      };
                      downloadInvoice(invoiceForPrint);
                    }}
                  >
                    Reprint Invoice
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-2xl bg-slate-50/60 text-sm">
                Please select an invoice from the history to review the details.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History (Lịch sử) */}
        <Card className="shadow-md rounded-2xl border border-slate-100 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <History className="text-blue-600 h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Recent Transaction History</span>
                <span className="text-[11px] text-slate-400">List of the latest invoices</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1.5">
              {firebaseOrders && firebaseOrders.length > 0 ? (
                firebaseOrders
                  .slice()
                  .reverse()
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setBillMode('history');
                        setSelectedHistoryId(String(t.id));
                      }}
                      className="w-full text-left flex justify-between items-center p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Table {t.table_number ?? t.tableNumber}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {new Date(t.timestamp).toLocaleString('en-US')}
                        </p>
                      </div>
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                        +{(t.total_amount ?? t.totalAmount ?? 0).toLocaleString()}$
                      </span>
                    </button>
                  ))
              ) : (
                <p className="text-center text-slate-400 py-10 italic text-sm">
                  No transactions have been made yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}