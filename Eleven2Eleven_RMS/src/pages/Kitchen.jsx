import React, { useState, useEffect } from 'react';
import { useOrders } from '../contexts/OrderContext';
import { Button } from '../components/ui/button';
import { CheckCircle2, Clock, DollarSign, Receipt, X } from 'lucide-react';
import { Link } from 'react-router-dom';
// Import API để lấy giá tiền và cập nhật trạng thái bàn
import { getProducts, getTables, updateTable, getIngredients } from '../data_access/api';

export default function KitchenPage() {
  // Lấy thêm removeOrder, checkoutTable và downloadInvoice từ Context
  const { savedOrders, markPendingItemsAsCompleted, checkoutTable, downloadInvoice } = useOrders();
  
  const [selectedTable, setSelectedTable] = useState(null);

  // State quản lý Hóa đơn
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Dữ liệu từ Server (để tra cứu giá và ID bàn)
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  // 1. Tải danh sách Sản phẩm (lấy giá) và Bàn (lấy ID)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, tabs, ings] = await Promise.all([getProducts(), getTables(), getIngredients()]);
        setProducts(prods || []);
        setTables(tabs || []);
        setIngredients(ings || [])
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  // --- CÁC HÀM XỬ LÝ LOGIC ---

  const handleTableClick = (tableNumber) => {
    setSelectedTable(selectedTable === tableNumber ? null : tableNumber);
  };

  const handleCompleteOrder = async (tableNumber) => {
    try {
      await markPendingItemsAsCompleted(tableNumber)
      // refresh ingredient list after inventory update
      const newIngs = await getIngredients()
      setIngredients(newIngs || [])
    } catch (err) {
      console.error('Error completing order:', err)
      alert('Có lỗi khi cập nhật nguyên liệu')
    }
  };

  const getPendingItems = (items) => items.filter(item => !item.completed);
  const allItemsCompleted = (items) => items.every(item => item.completed);

  // Tìm giá tiền của món ăn
  const getPrice = (dishName) => {
    const product = products.find(p => p.name === dishName);
    return product ? product.price : 0;
  };

  // Tính tổng tiền đơn hàng
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      return total + (getPrice(item.dishName) * item.quantity);
    }, 0);
  };

  // Mở Modal Hóa đơn
  const handleOpenInvoice = (order) => {
    const total = calculateTotal(order.items);
    setInvoiceData({
      ...order,
      totalAmount: total
    });
    setShowInvoice(true);
  };

  // --- XỬ LÝ THANH TOÁN (QUAN TRỌNG) ---
  const handleConfirmPayment = async () => {
    if (!invoiceData) return;

    try {
      // 1. Cập nhật trạng thái bàn trên Firebase -> Available
      const currentTable = tables.find(t => 
        (t.name || `Bàn ${t.id}`) === invoiceData.tableNumber
      );

      if (currentTable) {
        await updateTable(currentTable.id, { 
            status: 'Available',
            reservation_time: '' // Xóa giờ đặt (nếu muốn reset sạch)
        });
        
        // Cập nhật state local để đồng bộ
        setTables(prev => prev.map(t => 
            t.id === currentTable.id ? { ...t, status: 'Available' } : t
        ));
      }

      // 2. Tải hóa đơn về máy (.txt)
      const invoiceForPrint = {
          tableNumber: invoiceData.tableNumber,
          // Map thêm giá vào item để in ra cho đẹp
          items: invoiceData.items.map(item => ({
              ...item,
              price: getPrice(item.dishName)
          })),
          totalAmount: invoiceData.totalAmount,
          date: new Date().toLocaleString('vi-VN')
      };
      downloadInvoice(invoiceForPrint);

      // 3. Ghi nhận giao dịch & xóa đơn hàng khỏi hệ thống (đồng bộ với Dashboard)
      checkoutTable(invoiceData.tableNumber, invoiceData.totalAmount);

      // 4. Reset giao diện
      alert(`Thanh toán thành công bàn ${invoiceData.tableNumber}!`);
      setShowInvoice(false);
      setInvoiceData(null);
      setSelectedTable(null);

    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái bàn.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10 border-b border-slate-200">
        <div className="relative flex items-center justify-center max-w-2xl mx-auto">
          <h1 className="text-blue-600 text-lg font-bold">Kitchen Management</h1>
          <div className="absolute right-0">
            <Link to="/ingredients">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                View Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {savedOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders currently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedOrders.map((order) => {
              const pendingItems = getPendingItems(order.items);
              const isAllCompleted = allItemsCompleted(order.items);
              const isSelected = selectedTable === order.tableNumber;

              return (
                <div key={order.tableNumber} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  {/* Table Header Row */}
                  <button
                    onClick={() => handleTableClick(order.tableNumber)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${isAllCompleted ? 'bg-green-500' : 'bg-blue-600'}`}>
                        {isAllCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm">{order.tableNumber}</span>}
                      </div>
                      <div className="text-left">
                        <h3 className="text-slate-800 text-sm">{order.tableNumber}</h3>
                        <p className="text-xs text-slate-500">
                          {isAllCompleted ? 'Ready to Pay' : `${pendingItems.length} items pending`}
                        </p>
                      </div>
                    </div>
                    <div className={`transform transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable Order Details */}
                  {isSelected && (
                    <div className="border-t border-slate-200 bg-slate-50">
                      <div className="p-4 space-y-2">
                        {isAllCompleted ? (
                           <div className="text-center py-2 text-green-600 text-sm flex items-center justify-center gap-2">
                             <CheckCircle2 className="h-4 w-4"/> All items completed
                           </div>
                        ) : (
                          <h4 className="text-xs text-slate-500 mb-3">Order Items:</h4>
                        )}
                        
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-slate-800 text-sm font-medium">{item.dishName}</p>
                              <p className="text-xs text-slate-500">
                                {item.completed ? <span className="text-green-600">Completed</span> : <span className="text-amber-600">Pending</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                        {!isAllCompleted && (
                          <Button
                            onClick={() => handleCompleteOrder(order.tableNumber)}
                            className="col-span-2 h-10 bg-green-600 hover:bg-green-700 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            
                          </Button>
                        )}
                        
                        {/* Nút Thanh Toán */}
                        <Button
                          onClick={() => handleOpenInvoice(order)}
                          className={`h-10 text-sm ${!isAllCompleted ? 'col-span-2 bg-slate-400' : 'col-span-2 bg-blue-600 hover:bg-blue-700'}`}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Pay & Clear Table
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL HÓA ĐƠN --- */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Temporary Invoice
              </h2>
              <button onClick={() => setShowInvoice(false)} className="hover:bg-blue-700 p-1 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{invoiceData.tableNumber}</h3>
                <p className="text-sm text-slate-500">{new Date().toLocaleString('vi-VN')}</p>
              </div>

              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2 mb-2">
                  <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 text-right">Total</div>
                  </div>
                </div>

                {invoiceData.items.map((item, idx) => {
                  const price = getPrice(item.dishName);
                  return (
                    <div key={idx} className="grid grid-cols-12 text-sm py-1">
                      <div className="col-span-6 font-medium text-slate-700">{item.dishName}</div>
                      <div className="col-span-2 text-center text-slate-500">x{item.quantity}</div>
                      <div className="col-span-4 text-right text-slate-700">
                        {(price * item.quantity).toLocaleString()}$
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-800">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {invoiceData.totalAmount.toLocaleString()}$
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <Button 
                onClick={() => setShowInvoice(false)}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}