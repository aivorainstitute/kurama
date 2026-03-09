import { useState, useEffect } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';

// Customer App Screens
import WelcomeScreen from '@/sections/customer/WelcomeScreen';
import MenuScreen from '@/sections/customer/MenuScreen';
import CartSheet from '@/sections/customer/CartSheet';
import OrderDetailScreen from '@/sections/customer/OrderDetailScreen';
import PaymentScreen from '@/sections/customer/PaymentScreen';
import QueueScreen from '@/sections/customer/QueueScreen';
import OrderHistoryScreen from '@/sections/customer/OrderHistoryScreen';
import CheckOrderScreen from '@/sections/customer/CheckOrderScreen';
import EditOrderScreen from '@/sections/customer/EditOrderScreen';
import EditOrderMenu from '@/sections/customer/EditOrderMenu';

// Admin Dashboard Screens
import AdminLogin from '@/sections/admin/AdminLogin';
import DashboardOverview from '@/sections/admin/DashboardOverview';
import StockManagement from '@/sections/admin/StockManagement';
import EditItem from '@/sections/admin/EditItem';
import CategoryManagement from '@/sections/admin/CategoryManagement';
import OrderManagement from '@/sections/admin/OrderManagement';
import SupabaseTest from '@/components/SupabaseTest';

// Types
export type OrderStatus = 'BARU' | 'DIPROSES' | 'SIAP' | 'SELESAI' | 'DIBATALKAN';
export type PaymentStatus = 'BELUM_BAYAR' | 'SUDAH_BAYAR';
export type PaymentMethod = 'CASH' | 'QRIS';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  category_name: string;
  stock: number;
  is_available: boolean;
  is_popular?: boolean;
}

export interface CartItem {
  id: number;
  menu_item: MenuItem;
  quantity: number;
  notes: string;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  queue_number: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  customer_name: string;
  queue_number: number;
  status: OrderStatus;
  customer_name: string;
  table_number?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string;
  subtotal: number;
  image_url?: string;
}

// Types for Supabase
export interface OrderSummary {
  id: number;
  order_number: string;
  queue_number: number;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  item_count: number;
}

export interface Category {
  id: number;
  name: string;
  item_count: number;
}

// Mock Data
export const mockCategories: Category[] = [
  { id: 1, name: 'Semua', item_count: 50 },
  { id: 2, name: 'Signatures', item_count: 12 },
  { id: 3, name: 'Coffee', item_count: 8 },
  { id: 4, name: 'Minuman', item_count: 15 },
  { id: 5, name: 'Makanan', item_count: 20 },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Matcha Latte',
    description: 'Premium ceremonial grade matcha whisked with oat milk and honey.',
    price: 35000,
    image_url: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3114?w=400&h=400&fit=crop',
    category_id: 2,
    category_name: 'Signatures',
    stock: 50,
    is_available: true,
    is_popular: true,
  },
  {
    id: 2,
    name: 'Smashed Avo Toast',
    description: 'Sourdough bread topped with seasoned avocado, feta cheese, and chili flakes.',
    price: 45000,
    image_url: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400&h=400&fit=crop',
    category_id: 2,
    category_name: 'Signatures',
    stock: 30,
    is_available: true,
    is_popular: true,
  },
  {
    id: 3,
    name: 'Caffe Latte',
    description: 'Double shot espresso with steamed milk and a thin layer of foam.',
    price: 30000,
    image_url: 'https://images.unsplash.com/photo-1570968992193-fd6dc66989ae?w=400&h=400&fit=crop',
    category_id: 3,
    category_name: 'Coffee',
    stock: 100,
    is_available: true,
  },
  {
    id: 4,
    name: 'Iced Americano',
    description: 'Double shot espresso poured over ice with cold water.',
    price: 22000,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop',
    category_id: 3,
    category_name: 'Coffee',
    stock: 80,
    is_available: true,
  },
  {
    id: 5,
    name: 'Truffle Fries',
    description: 'Crispy fries tossed with truffle oil and parmesan cheese.',
    price: 35000,
    image_url: 'https://images.unsplash.com/photo-1573080496987-a199f8cd2e9a?w=400&h=400&fit=crop',
    category_id: 5,
    category_name: 'Makanan',
    stock: 40,
    is_available: true,
  },
  {
    id: 6,
    name: 'Beef Burger',
    description: 'Juicy beef patty with cheddar, lettuce, tomato, and special sauce.',
    price: 55000,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    category_id: 5,
    category_name: 'Makanan',
    stock: 25,
    is_available: true,
  },
];

export const mockOrders: Order[] = [
  {
    id: 3,
    order_number: 'CZ-20240115-0003',
    queue_number: 3,
    status: 'DIPROSES',
    customer_name: 'Budi',
    table_number: '04',
    items: [
      { menu_item_id: 1, name: 'Matcha Latte', quantity: 1, unit_price: 28000, notes: 'Oat milk, Less sugar', subtotal: 28000 },
      { menu_item_id: 5, name: 'Truffle Fries', quantity: 2, unit_price: 35000, notes: '', subtotal: 70000 },
    ],
    subtotal: 98000,
    tax_amount: 9800,
    total_amount: 107800,
    created_at: '2024-01-15T14:20:00Z',
  },
  {
    id: 2,
    order_number: 'CZ-20240115-0002',
    queue_number: 2,
    status: 'SIAP',
    customer_name: 'Budi',
    table_number: '12',
    items: [
      { menu_item_id: 2, name: 'Smashed Avo Toast', quantity: 1, unit_price: 45000, notes: 'Tanpa Bawang Merah', subtotal: 45000 },
    ],
    subtotal: 45000,
    tax_amount: 4500,
    total_amount: 49500,
    created_at: '2024-01-15T12:45:00Z',
  },
  {
    id: 1,
    order_number: 'CZ-20240114-0001',
    queue_number: 1,
    status: 'SELESAI',
    customer_name: 'Budi',
    table_number: '07',
    items: [
      { menu_item_id: 3, name: 'Caffe Latte', quantity: 1, unit_price: 30000, notes: 'Regular Size', subtotal: 30000 },
    ],
    subtotal: 30000,
    tax_amount: 3000,
    total_amount: 33000,
    created_at: '2024-01-14T09:15:00Z',
  },
];

function App() {
  // Load from localStorage on init
  const [customerName, setCustomerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customerName') || '';
    }
    return '';
  });
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cartItems');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validasi: pastikan semua items punya image_url
          const isValid = parsed.every((item: CartItem) => 
            item.menu_item && item.menu_item.image_url
          );
          if (isValid) return parsed;
          // Kalau tidak valid, hapus localStorage
          localStorage.removeItem('cartItems');
        } catch {
          localStorage.removeItem('cartItems');
        }
      }
    }
    return [];
  });
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeOrder');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  // Ambil orders dari Supabase (real-time)
  const { orderSummaries: orders, refetch: refetchOrders } = useOrders();
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isAdmin');
      return saved === 'true';
    }
    return false;
  });

  // Clear old localStorage data on app start
  useEffect(() => {
    localStorage.removeItem('customerOrders');
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('customerName', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin.toString());
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('activeOrder', JSON.stringify(activeOrder));
  }, [activeOrder]);

  // Tidak perlu simpan orders ke localStorage lagi - data dari Supabase

  const addToCart = (menuItem: MenuItem, quantity: number = 1, notes: string = '') => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.menu_item.price }
            : item
        );
      }
      return [...prev, {
        id: Date.now(),
        menu_item: menuItem,
        quantity,
        notes,
        subtotal: quantity * menuItem.price
      }];
    });
  };

  const updateCartItem = (id: number, quantity: number, notes?: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity, notes: notes ?? item.notes, subtotal: quantity * item.menu_item.price }
          : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Generate order number and queue number locally
  const generateOrderNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CZ-${date}-${random}`;
  };

  // Generate queue number (incremental per day)
  const generateQueueNumber = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Get max queue_number for today
    const { data, error } = await supabase
      .from('orders')
      .select('queue_number')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${tomorrow}T00:00:00`)
      .order('queue_number', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return 1; // First order of the day
    }
    
    return (data[0].queue_number || 0) + 1;
  };

  const createOrder = async (customerName: string): Promise<Order> => {
    console.log('Creating order for:', customerName);
    console.log('Cart items:', cartItems);
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = Math.round(subtotal * 0.1);
    const totalAmount = subtotal + taxAmount;
    
    const orderNumber = generateOrderNumber();
    const queueNumber = await generateQueueNumber();
    console.log('Generated order number:', orderNumber, 'queue number:', queueNumber);
    
    try {
      // 1. Create order in Supabase (status BELUM_BAYAR default)
      // Note: Kolom payment_status perlu ditambahkan via SQL dulu
      const orderDataToInsert: any = {
        order_number: orderNumber,
        queue_number: queueNumber,
        customer_name: customerName,
        status: 'BARU' as OrderStatus,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount
      };
      
      // Coba dengan payment_status, kalau error berarti kolom belum ada
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderDataToInsert])
        .select()
        .single();

      if (orderError) {
        console.error('Order insert error:', orderError);
        throw new Error(`Order insert failed: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error('No data returned from order insert');
      }

      console.log('Order created:', orderData);

      // 2. Create order items in Supabase
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item.id,
        name: item.menu_item.name,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        notes: item.notes || null,
        subtotal: item.subtotal,
        image_url: item.menu_item.image_url || null
      }));

      console.log('Inserting order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
        // Rollback order if items fail
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new Error(`Order items insert failed: ${itemsError.message}`);
      }

      console.log('Order items created successfully');

      // 3. Create local order object for UI
      const newOrder: Order = {
        id: orderData.id,
        order_number: orderData.order_number,
        queue_number: orderData.queue_number,
        status: orderData.status,
        payment_status: orderData.payment_status || 'BELUM_BAYAR',
        customer_name: orderData.customer_name,
        items: cartItems.map(item => ({
          menu_item_id: item.menu_item.id,
          name: item.menu_item.name,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          notes: item.notes,
          subtotal: item.subtotal,
          image_url: item.menu_item.image_url
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        created_at: orderData.created_at,
      };
      
      // 4. Refresh orders dari Supabase
      refetchOrders();
      setActiveOrder(newOrder);
      clearCart();
      
      return newOrder;
    } catch (error: any) {
      console.error('Create order failed:', error);
      throw error;
    }
  };

  const updateOrderStatus = (orderId: number, status: OrderStatus) => {
    // Status diupdate via Supabase realtime, tidak perlu update manual
    // Tapi update activeOrder jika ini pesanan customer
    if (activeOrder?.id === orderId) {
      setActiveOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  // Clear customer session (for testing)
  const clearCustomerSession = () => {
    setCustomerName('');
    setActiveOrder(null);
    setCartItems([]);
    localStorage.removeItem('customerName');
    localStorage.removeItem('activeOrder');
    localStorage.removeItem('cartItems');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Customer Routes */}
          <Route 
            path="/" 
            element={
              <WelcomeScreen 
                customerName={customerName} 
                setCustomerName={setCustomerName}
                hasActiveOrder={!!activeOrder}
                orders={orders}
              />
            } 
          />
          <Route 
            path="/menu" 
            element={
              customerName ? (
                <MenuScreen 
                  customerName={customerName}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  activeOrder={activeOrder}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/cart" 
            element={
              customerName ? (
                <CartSheet 
                  cartItems={cartItems}
                  updateCartItem={updateCartItem}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  customerName={customerName}
                  createOrder={createOrder}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/order/:orderId" 
            element={
              <OrderDetailScreen 
                orders={orders}
              />
            } 
          />
          <Route 
            path="/payment" 
            element={
              customerName ? (
                <PaymentScreen 
                  order={activeOrder}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/queue" 
            element={
              customerName ? (
                <QueueScreen 
                  customerName={customerName}
                  activeOrder={activeOrder}
                  orders={orders}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/history" 
            element={
              customerName ? (
                <OrderHistoryScreen 
                  customerName={customerName}
                  orders={orders}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/check-order" 
            element={
              <CheckOrderScreen 
                orders={orders}
                customerName={customerName}
              />
            } 
          />
          <Route 
            path="/edit-order" 
            element={
              customerName ? (
                <EditOrderMenu customerName={customerName} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={
              <AdminLogin 
                setIsAdmin={setIsAdmin}
              />
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              isAdmin ? (
                <DashboardOverview onLogout={handleLogout} />
              ) : (
                <Navigate to="/admin/login" />
              )
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              isAdmin ? (
                <OrderManagement />
              ) : (
                <Navigate to="/admin/login" />
              )
            } 
          />
          <Route 
            path="/admin/stock" 
            element={
              isAdmin ? (
                <StockManagement />
              ) : (
                <Navigate to="/admin/login" />
              )
            } 
          />
          <Route 
            path="/admin/edit-item/:itemId" 
            element={
              isAdmin ? (
                <EditItem />
              ) : (
                <Navigate to="/admin/login" />
              )
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              isAdmin ? (
                <CategoryManagement />
              ) : (
                <Navigate to="/admin/login" />
              )
            } 
          />
          <Route path="/test/supabase" element={<SupabaseTest />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
