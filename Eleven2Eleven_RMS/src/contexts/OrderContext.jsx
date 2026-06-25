import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../data_access/api'

const OrderContext = createContext();

export function OrderProvider({ children }) {
  // Orders currently being processed (local state, not persisted)
  const [savedOrders, setSavedOrders] = useState([]);

  // Transaction history (fetched from Firebase)
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Load transaction history from Firebase on mount
  useEffect(() => {
    const loadTransactionHistory = async () => {
      try {
        const orders = await api.getOrders()
        const transactions = (orders || []).map(order => ({
          id: order.id,
          tableNumber: order.table_number ?? order.tableNumber,
          table_number: order.table_number,
          items: order.items || [],
          totalAmount: order.total_amount ?? order.totalAmount,
          total_amount: order.total_amount,
          timestamp: order.timestamp
        }))
        setTransactionHistory(transactions)
      } catch (err) {
        console.error('[OrderContext] Error loading transactions:', err)
      }
    }
    loadTransactionHistory()
  }, []);

  // --- CÁC HÀM XỬ LÝ LOGIC ---

  const saveOrder = (tableNumber, items) => {
    const existingOrderIndex = savedOrders.findIndex(
      order => order.tableNumber === tableNumber
    );
    
    // Đảm bảo item có trạng thái completed (mặc định false nếu mới)
    const itemsWithStatus = items.map(item => ({
      ...item,
      completed: item.completed || false
    }));

    let newOrders;
    let status;

    if (existingOrderIndex !== -1) {
      newOrders = [...savedOrders];
      newOrders[existingOrderIndex] = {
        tableNumber,
        items: itemsWithStatus
      };
      status = 'updated';
    } else {
      newOrders = [...savedOrders, { tableNumber, items: itemsWithStatus }];
      status = 'added';
    }
    
    setSavedOrders(newOrders);
    return status;
  };

  // Hàm Thanh toán: Lưu vào lịch sử và xóa đơn hàng tại bàn
  const checkoutTable = async (tableNumber, totalAmount) => {
    const orderToClose = savedOrders.find(o => o.tableNumber === tableNumber);
    if (!orderToClose) return;

    // Build snake_case payload for DB
    const newTransactionSnake = {
      table_number: tableNumber,
      items: orderToClose.items,
      total_amount: totalAmount,
      timestamp: new Date().toISOString()
    };

    // local representation with both camelCase and snake_case
    const newTransactionLocal = {
      tableNumber: tableNumber,
      items: orderToClose.items,
      totalAmount: totalAmount,
      total_amount: totalAmount,
      table_number: tableNumber,
      timestamp: newTransactionSnake.timestamp
    }

    try {
      const created = await api.addOrder(newTransactionSnake)
      const savedTx = created && created.id ? { ...newTransactionLocal, id: created.id } : newTransactionLocal
      
      // Update local transaction history
      setTransactionHistory(prev => [...prev, savedTx]);
      // Remove from active orders
      setSavedOrders(prev => prev.filter(order => order.tableNumber !== tableNumber));
      return savedTx;
    } catch (err) {
      console.error('Error saving order to Firebase:', err)
      // still update local state as fallback
      const savedTx = { ...newTransactionLocal, id: Date.now() }
      setTransactionHistory(prev => [...prev, savedTx]);
      setSavedOrders(prev => prev.filter(order => order.tableNumber !== tableNumber));
      return savedTx;
    }
  };

  const getOrderByTable = (tableNumber) => {
    return savedOrders.find(order => order.tableNumber === tableNumber);
  };

  const markPendingItemsAsCompleted = async (tableNumber) => {
    try {
      // Build consumption map: ingredientId -> totalNeeded
      const consumption = new Map()

      const order = savedOrders.find(o => o.tableNumber === tableNumber)
      if (order) {
        const products = await api.getProducts()
        for (const item of order.items) {
          const targetName = String(item.dishName || '').trim().toLowerCase()
          const prod = (products || []).find(p => String(p.name || '').trim().toLowerCase() === targetName)
          if (!prod) {
            continue
          }
          const recs = await api.getRecipesForProduct(prod.id)
          for (const r of (recs || [])) {
            // determine ingredient id from possible fields
            const rawId = r.ingredient_id ?? r.ingredientId ?? null
            if (rawId === null || rawId === undefined || String(rawId).trim() === '') {
              continue
            }
            const ingId = rawId
            const perProductQty = Number(r.quantity ?? r.qty ?? r.amount ?? 0)
            const totalNeeded = perProductQty * (Number(item.quantity) || 0)
            const key = String(ingId)
            consumption.set(key, (consumption.get(key) || 0) + totalNeeded)
          }
        }

        // Apply consumption to Ingredient records
        for (const [ingIdStr, needed] of consumption.entries()) {
          const ingId = Number(ingIdStr).toString() === ingIdStr ? Number(ingIdStr) : ingIdStr
          try {
            const current = await api.getIngredient(ingId)
            const currentQty = Number(current?.quantity) || 0
            const newQty = Math.max(0, currentQty - needed)
            await api.updateIngredient(ingId, { quantity: newQty })
          } catch (err) {
            console.error('Error updating ingredient', ingIdStr, err)
          }
        }
      }

      // mark items completed in state
      setSavedOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.tableNumber === tableNumber) {
            return {
              ...order,
              items: order.items.map(item => ({ ...item, completed: true }))
            };
          }
          return order;
        });
      });

      return true
    } catch (err) {
      console.error('Error in markPendingItemsAsCompleted:', err)
      throw err
    }
  };

  // --- [MỚI] HÀM XÓA ĐƠN HÀNG (Dùng khi thanh toán xong) ---
  const removeOrder = (tableNumber) => {
    setSavedOrders(prevOrders => prevOrders.filter(order => order.tableNumber !== tableNumber));
  };

  // --- [MỚI] HÀM XUẤT HÓA ĐƠN RA FILE .TXT ---
  const downloadInvoice = (invoiceData) => {
    /* invoiceData cần có cấu trúc:
       {
         tableNumber: "Bàn 1",
         items: [...],
         totalAmount: 500000,
         date: "12:30 28/12/2025"
       }
    */
    
    // 1. Tạo nội dung hóa đơn
    let content = `================================\n`;
    content += `       HÓA ĐƠN THANH TOÁN       \n`;
    content += `================================\n\n`;
    content += `Bàn: ${invoiceData.tableNumber}\n`;
    content += `Thời gian: ${invoiceData.date || new Date().toLocaleString('vi-VN')}\n`;
    content += `--------------------------------\n`;
    content += `MÓN ĂN              SL    THÀNH TIỀN\n`;
    content += `--------------------------------\n`;

    invoiceData.items.forEach(item => {
        // Giả sử item có truyền thêm price vào lúc gọi hàm này
        const itemTotal = (item.price * item.quantity).toLocaleString('vi-VN');
        // Format đơn giản
        content += `${item.dishName.padEnd(20)} x${item.quantity.toString().padEnd(4)} ${itemTotal}đ\n`;
    });

    content += `--------------------------------\n`;
    const total = invoiceData.total_amount ?? invoiceData.totalAmount ?? 0
    content += `TỔNG CỘNG:          ${total.toLocaleString('vi-VN')} VNĐ\n`;
    content += `================================\n`;
    content += `    Cảm ơn và hẹn gặp lại!      \n`;

    // 2. Tạo Blob và tải xuống
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Tên file: HoaDon_Ban1_TIMESTAMP.txt
    const tableLabel = invoiceData.table_number ?? invoiceData.tableNumber ?? 'Unknown'
    link.download = `HoaDon_${String(tableLabel).replace(/\s/g, '')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    
    // Dọn dẹp
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <OrderContext.Provider value={{ 
        savedOrders,
        transactionHistory,
        saveOrder,
        getOrderByTable,
        markPendingItemsAsCompleted,
        checkoutTable,
        removeOrder,
        downloadInvoice,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}