import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Minus, X, Lock } from 'lucide-react';
import { useOrders } from '../contexts/OrderContext';
import { Link } from 'react-router-dom';

import { getProducts, getTables, getReservations, updateTable, deleteReservation } from '../data_access/api';

export default function OrderPage() {
  const [tableNumber, setTableNumber] = useState('');
  const [isTableConfirmed, setIsTableConfirmed] = useState(false);
  const [orderItems, setOrderItems] = useState([
    { id: '1', dishName: '', quantity: 1 }
  ]);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]); // State lưu lịch đặt
  const [loadingTables, setLoadingTables] = useState(true);

  const { saveOrder, getOrderByTable } = useOrders();

  // 2. Lấy dữ liệu (Products, Tables, Reservations)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, tablesData, reservationsData] = await Promise.all([
          getProducts(),
          getTables(),
          getReservations()
        ]);

        setProducts(productsData || []);
        setTables(tablesData || []);
        setReservations(reservationsData || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoadingProducts(false);
        setLoadingTables(false);
      }
    };
    fetchData();
  }, []);

  const addOrderItem = () => {
    const newItem = {
      id: Date.now().toString(),
      dishName: '',
      quantity: 1
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (id) => {
    const itemToRemove = orderItems.find(item => item.id === id);
    
    if (itemToRemove && itemToRemove.completed) {
      alert("Món này đã được Bếp chế biến, không thể xóa!");
      return;
    }

    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const updateDishName = (id, name) => {
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, dishName: name } : item
    ));
  };

  const updateQuantity = (id, delta) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // --- HÀM TIỆN ÍCH XỬ LÝ THỜI GIAN ---
  // Input: dateStr ("2025-12-29"), timeStr ("03:00 PM")
  const parseDateTime = (dateStr, timeStr) => {
    try {
      if (!dateStr || !timeStr) return null;

      // 1. Xử lý ngày: "2025-12-29" -> [2025, 12, 29]
      const [year, month, day] = dateStr.split('-').map(Number);

      // 2. Xử lý giờ: "03:00 PM"
      const [timePart, modifier] = timeStr.split(' '); // Tách "03:00" và "PM"
      let [hours, minutes] = timePart.split(':').map(Number);

      // 3. Chuyển đổi sang định dạng 24h
      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }

      // 4. Tạo đối tượng Date (Lưu ý: tháng trong JS bắt đầu từ 0)
      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch (e) {
      console.error("Lỗi parse thời gian:", e);
      return null;
    }
  };

  const checkReservationConflict = (selectedTableId) => {
    const now = new Date();
    // Tạo mốc thời gian 4 tiếng sau
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const oneHourBefore = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    // Tìm các đơn đặt của bàn này
    const tableReservations = reservations.filter(res => 
      String(res.table_id) === String(selectedTableId)
    );

    // Tìm đơn đặt nào nằm trong khoảng (Now -> Now + 4h)
    const conflict = tableReservations.find(res => {
      // Truyền cả res.date và res.time vào hàm mới
      const resTime = parseDateTime(res.date, res.time); 
      return resTime && (resTime >= now && resTime <= fourHoursLater) || (resTime >= oneHourBefore && resTime <= now);
    }); 

    return conflict;
  };

// --- XỬ LÝ XÁC NHẬN BÀN (Đã cập nhật logic xóa lịch đặt) ---
  // Lưu ý: Thêm từ khóa 'async' vào trước hàm
  const handleTableConfirm = async () => {
    if (!tableNumber.trim()) {
      alert('Vui lòng chọn số bàn!');
      return;
    }

    const currentTable = tables.find(t => (t.name || `Bàn ${t.id}`) === tableNumber);

    if (!currentTable) {
      alert("Không tìm thấy thông tin bàn!");
      return;
    }
    // Kiểm tra lịch đặt
    const conflictReservation = checkReservationConflict(currentTable.id);
    
    if (conflictReservation) {
      const inputPhone = window.prompt(
        `Bàn này có lịch đặt lúc ${conflictReservation.time} ngày ${conflictReservation.date}.\n` +
        `Vui lòng nhập SỐ ĐIỆN THOẠI khách đặt để xác nhận:`
      );

      if (inputPhone === null) return; 

      if (inputPhone.trim() !== conflictReservation.phone) {
        alert("Sai số điện thoại! Bạn không có quyền mở bàn này.");
        return; 
      }

      // --- LOGIC MỚI: XÓA LỊCH ĐẶT SAU KHI XÁC THỰC THÀNH CÔNG ---
      try {
        // 1. Gọi API xóa trong Database
        // Giả sử conflictReservation có trường 'id' là khóa chính
        await deleteReservation(conflictReservation.id);

        // 2. Cập nhật State local để giao diện phản hồi ngay (không cần reload trang)
        // Loại bỏ lịch đặt vừa xóa ra khỏi danh sách reservations đang lưu ở máy
        setReservations(prevReservations => 
          prevReservations.filter(res => res.id !== conflictReservation.id)
        );

        alert("Xác thực thành công! Lịch đặt đã được xóa khỏi hệ thống.");
      } catch (error) {
        console.error("Lỗi khi xóa lịch đặt:", error);
        alert("Lỗi hệ thống: Không thể xóa lịch đặt. Vui lòng thử lại!");
        return; // Nếu lỗi server thì dừng lại, không cho mở bàn để tránh lỗi dữ liệu
      }
      // -----------------------------------------------------------
    }

    // Logic tải đơn hàng cũ (giữ nguyên)
    const existingOrder = getOrderByTable(tableNumber);
    if (existingOrder) {
      setOrderItems(existingOrder.items.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random()
      })));
      alert(`Đã tải đơn hàng có sẵn cho ${tableNumber}`);
    } else {
      setOrderItems([{ id: Date.now().toString(), dishName: '', quantity: 1 }]);
    }

    setIsTableConfirmed(true);
  };
  
  // --- XỬ LÝ XÁC NHẬN ĐƠN HÀNG ---
  const handleConfirmOrder = async () => {
    if (!tableNumber.trim()) {
      alert('Vui lòng chọn số bàn!');
      return;
    }
    const validItems = orderItems.filter(item => item.dishName.trim());
    
    if (validItems.length > 0) {
      // 1. Lưu đơn hàng (Local Context)
      const result = saveOrder(tableNumber, validItems);

      // 2. Cập nhật trạng thái bàn trên Server thành "Occupied" (In use)
      const currentTable = tables.find(t => (t.name || `Bàn ${t.id}`) === tableNumber);
      if (currentTable) {
        try {
          // Gọi API cập nhật
          await updateTable(currentTable.id, { status: 'Occupied' });
          
          // Cập nhật State local để giao diện phản hồi ngay lập tức (Optional nhưng recommended)
          setTables(prevTables => prevTables.map(t => 
            t.id === currentTable.id ? { ...t, status: 'Occupied' } : t
          ));
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái bàn:", error);
        }
      }

      if (result === 'updated') {
        alert(`Đã cập nhật đơn hàng cho ${tableNumber}!`);
      } else {
        alert(`Đã lưu đơn hàng mới cho ${tableNumber}!`);
      }

      handleReset();
    } else {
      alert('Vui lòng thêm ít nhất một món!');
    }
  };

  const handleReset = () => {
    setTableNumber('');
    setIsTableConfirmed(false);
    setOrderItems([{ id: Date.now().toString(), dishName: '', quantity: 1 }]);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm py-3 px-4 sticky top-0 z-10 border-b border-slate-200">
        <div className="relative flex items-center justify-center max-w-2xl mx-auto">
          <h1 className="text-blue-600 text-lg font-bold">Order Management</h1>
          <div className="absolute right-0">
            <Link to="/kitchen">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                View Kitchen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Table Number Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-4">
          <label className="text-slate-700 text-sm block mb-2">
            Select Table
          </label>
          
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isTableConfirmed || loadingTables}
          >
            <option value="" disabled>
              {loadingTables ? "Loading tables..." : "Select a table"}
            </option>
            {tables.map((table) => (
              <option 
                key={table.id} 
                value={table.name || `Table ${table.id}`}
                // Hiển thị thêm trạng thái trong dropdown để dễ nhìn
                className={table.status !== 'Available' ? 'text-red-500' : 'text-green-600'}
              >
                {table.name || `Table ${table.id}`} ({table.status === 'Available' ? 'Available' : 'Occupied'})
              </option>
            ))}
          </select>

          {!isTableConfirmed ? (
            <Button
              onClick={handleTableConfirm}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-sm mt-3"
            >
              Confirm Table
            </Button>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-blue-600 text-sm">✓ Confirmed: {tableNumber}</span>
              <Button
                onClick={() => setIsTableConfirmed(false)}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 text-xs h-7"
              >
                Change Table
              </Button>
            </div>
          )}
        </div>

        {/* Order Items Section */}
        {isTableConfirmed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-700 text-sm">Order Items</h2>
              <Button
                onClick={addOrderItem}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>

            {orderItems.map((item, index) => {
              const isLocked = item.completed; 

              return (
                <div key={item.id} className={`rounded-lg p-3 shadow-sm border ${isLocked ? 'bg-gray-100 border-gray-300' : 'bg-white border-slate-200'}`}>
                  <div className="space-y-2">
                    {/* Hàng 1: Tên món + Nút xóa */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <select
                          value={item.dishName}
                          onChange={(e) => updateDishName(item.id, e.target.value)}
                          className={`flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 ${isLocked ? 'bg-gray-200 text-gray-600' : 'bg-white'}`}
                          disabled={loadingProducts || isLocked} // Khóa nếu đã hoàn thành
                        >
                          <option value="" disabled>
                            {loadingProducts ? "Loading menu..." : "Select a dish"}
                          </option>
                          {products.map((product) => (
                            <option key={product.id} value={product.name}>
                              {product.name}
                              {product.price ? ` - ${product.price.toLocaleString()}$` : ''}
                            </option>
                          ))}
                        </select>
                        
                        {/* Hiển thị icon khóa nếu đã xong */}
                        {isLocked && (
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-bold pointer-events-none">
                             <Lock className="h-3 w-3" /> Completed
                          </div>
                        )}
                      </div>

                      {/* Nút Xóa: Chỉ hiện khi chưa bị khóa */}
                      {!isLocked && orderItems.length > 1 && (
                        <Button
                          onClick={() => removeOrderItem(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Nếu đã khóa thì hiện placeholder để căn chỉnh hoặc ẩn luôn */}
                      {isLocked && orderItems.length > 1 && (
                         <div className="h-9 w-9"></div> 
                      )}
                    </div>

                    {/* Hàng 2: Số lượng */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs flex-shrink-0 w-16">Quantity:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          onClick={() => updateQuantity(item.id, -1)}
                          variant="outline"
                          size="icon"
                          disabled={isLocked} // Khóa nút giảm
                          className={`h-8 w-8 rounded-full border-2 flex-shrink-0 ${isLocked ? 'border-gray-300 text-gray-400' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <div className={`flex-1 text-center rounded-lg py-1.5 px-3 border min-w-0 ${isLocked ? 'bg-gray-200 border-gray-300' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-sm ${isLocked ? 'text-gray-600 font-bold' : 'text-slate-800'}`}>{item.quantity}</span>
                        </div>

                        <Button
                          onClick={() => updateQuantity(item.id, 1)}
                          variant="outline"
                          size="icon"
                          disabled={isLocked} // Khóa nút tăng
                          className={`h-8 w-8 rounded-full border-2 flex-shrink-0 ${isLocked ? 'border-gray-300 text-gray-400' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2 pt-2">
              <Button
                onClick={handleConfirmOrder}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Confirm Order
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-10 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}