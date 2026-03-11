import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ShoppingCart, User, Search, Plus, Minus, 
  Trash2, Receipt, Printer, X, Check, ArrowRight, 
  ClipboardList, CreditCard, ChefHat, Package, CheckCircle,
  Clock, AlertCircle, RefreshCw, Loader2, Bell, ChevronRight, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { MenuItem, CartItem, Order, OrderStatus, PaymentStatus } from '@/App';
import { Badge } from '@/components/ui/badge';

// 3D Shadow styles (sama dengan MenuScreen)
const cardShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)';
const button3D = '0 4px 0 0 #C2410C, 0 4px 8px rgba(249, 115, 22, 0.4)';

interface CashierScreenProps {
  onLogout: () => void;
}

type ViewMode = 'menu' | 'orders';

// Generate order number
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CZ-${date}-${random}`;
};

// Generate queue number
const generateQueueNumber = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('orders')
    .select('queue_number')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${tomorrow}T00:00:00`)
    .order('queue_number', { ascending: false })
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return 1;
  }
  
  return (data[0].queue_number || 0) + 1;
};

// Tabs sama dengan admin
const tabs = ['Semua', 'Belum Bayar', 'Baru', 'Diproses', 'Siap'];

// Status helpers (sama dengan admin)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'BARU': return 'bg-blue-500';
    case 'DIPROSES': return 'bg-orange-500';
    case 'SIAP': return 'bg-green-500';
    case 'SELESAI': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'BARU': return 'BARU';
    case 'DIPROSES': return 'DIPROSES';
    case 'SIAP': return 'SIAP';
    case 'SELESAI': return 'SELESAI';
    default: return status;
  }
};

const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
  switch (currentStatus) {
    case 'BARU': return 'DIPROSES';
    case 'DIPROSES': return 'SIAP';
    case 'SIAP': return 'SELESAI';
    default: return null;
  }
};

const getActionButtonLabel = (status: string) => {
  switch (status) {
    case 'BARU': return 'Proses Pesanan';
    case 'DIPROSES': return 'Siap Diambil';
    case 'SIAP': return 'Selesaikan';
    default: return '-';
  }
};

const getActionButtonColor = (status: string) => {
  switch (status) {
    case 'BARU': return 'bg-blue-500';
    case 'DIPROSES': return 'bg-orange-500';
    case 'SIAP': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

export default function CashierScreen({ onLogout }: CashierScreenProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  
  // Menu state (sama dengan MenuScreen)
  const [customerName, setCustomerName] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  
  // Orders state (sama dengan admin)
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('Semua');
  const [orderItems, setOrderItems] = useState<Record<number, any[]>>({});
  const [updatingOrders, setUpdatingOrders] = useState<Record<number, boolean>>({});
  const [confirmingPayment, setConfirmingPayment] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadMenuItems();
    loadOrders();
    
    // Subscribe to realtime orders
    const subscription = supabase
      .channel('cashier-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        loadOrders();
        if (payload.eventType === 'INSERT') {
          toast.info('Pesanan baru masuk!', { icon: <Bell className="w-4 h-4" /> });
        }
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch items for visible orders
  useEffect(() => {
    const fetchItems = async () => {
      for (const order of filteredOrders) {
        if (!orderItems[order.id]) {
          const items = await getOrderItems(order.id);
          setOrderItems(prev => ({ ...prev, [order.id]: items }));
        }
      }
    };
    fetchItems();
  }, [orders, activeTab]);

  const loadMenuItems = async () => {
    setMenuLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name');
    
    if (error) {
      toast.error('Gagal memuat menu');
      setMenuLoading(false);
      return;
    }
    
    setMenuItems(data || []);
    setMenuLoading(false);
  };

  // Categories dari menu items (sama dengan MenuScreen)
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(
      menuItems
        .map(item => item.category_name)
        .filter((cat): cat is string => !!cat)
    )];
    return ['Semua', ...uniqueCategories];
  }, [menuItems]);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat pesanan');
      setLoading(false);
      return;
    }
    
    setOrders(data || []);
    setLoading(false);
  };

  // Fetch items for orders
  const getOrderItems = async (orderId: number) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) return [];
    return data || [];
  };

  // Filter items (sama dengan MenuScreen)
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') {
      return menuItems.filter(item => item.is_available);
    }
    return menuItems.filter(item => 
      item.is_available && item.category_name === selectedCategory
    );
  }, [menuItems, selectedCategory]);

  // Get quantity in cart
  const getItemQuantity = (itemId: number) => {
    const cartItem = cartItems.find(item => item.menu_item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Filter orders sama dengan admin
  const filteredOrders = (activeTab === 'Semua' 
    ? orders 
    : orders.filter(order => {
        const isPaid = order.payment_status === 'SUDAH_BAYAR';
        const isUnpaid = order.payment_status === 'BELUM_BAYAR' || 
                         (order.payment_status === undefined && order.status === 'BARU');
        switch (activeTab) {
          case 'Belum Bayar': return isUnpaid && order.status !== 'SELESAI' && order.status !== 'DIBATALKAN';
          case 'Baru': return order.status === 'BARU' && isPaid;
          case 'Diproses': return order.status === 'DIPROSES';
          case 'Siap': return order.status === 'SIAP';
          default: return true;
        }
      })
  ).sort((a, b) => {
    const aIsDone = a.status === 'SELESAI' || a.status === 'DIBATALKAN';
    const bIsDone = b.status === 'SELESAI' || b.status === 'DIBATALKAN';
    if (aIsDone && !bIsDone) return 1;
    if (!aIsDone && bIsDone) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const addToCart = (menuItem: MenuItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.menu_item.price }
            : item
        );
      }
      return [...prev, {
        id: Date.now(),
        menu_item: menuItem,
        quantity: 1,
        notes: '',
        subtotal: menuItem.price
      }];
    });
    // Notifikasi dihapus - tidak perlu toast
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity, subtotal: newQuantity * item.menu_item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateNotes = (id: number, notes: string) => {
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, notes } : item)
    );
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = Math.round(cartTotal * 0.1);
  const finalTotal = cartTotal + taxAmount;

  const handleCheckout = async (paymentMethod: 'CASH' | 'QRIS') => {
    if (!customerName.trim()) {
      toast.error('Masukkan nama pelanggan terlebih dahulu');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderNumber = generateOrderNumber();
      const queueNumber = await generateQueueNumber();
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          queue_number: queueNumber,
          customer_name: customerName.toUpperCase(),
          status: 'BARU' as OrderStatus,
          payment_status: 'SUDAH_BAYAR',
          payment_method: paymentMethod,
          subtotal: cartTotal,
          tax_amount: taxAmount,
          total_amount: finalTotal
        }])
        .select()
        .single();

      if (orderError) throw orderError;

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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const order: Order = {
        id: orderData.id,
        order_number: orderData.order_number,
        queue_number: orderData.queue_number,
        customer_name: orderData.customer_name,
        status: orderData.status,
        payment_status: 'SUDAH_BAYAR',
        payment_method: paymentMethod,
        subtotal: cartTotal,
        tax_amount: taxAmount,
        total_amount: finalTotal,
        created_at: orderData.created_at,
        items: cartItems.map(item => ({
          menu_item_id: item.menu_item.id,
          name: item.menu_item.name,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          notes: item.notes,
          subtotal: item.subtotal,
          image_url: item.menu_item.image_url || undefined
        }))
      };

      setCompletedOrder(order);
      setShowReceipt(true);
      setCartItems([]);
      setCustomerName('');
      setShowCart(false);
      
      toast.success('Pesanan berhasil dibuat!');
      loadOrders();
    } catch (error: any) {
      toast.error('Gagal membuat pesanan: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;
    
    setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success(`Status pesanan diupdate ke ${getStatusLabel(nextStatus)}`);
      loadOrders();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePaymentConfirm = async (orderId: number) => {
    setConfirmingPayment(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'SUDAH_BAYAR',
          payment_method: 'CASH'
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Pembayaran dikonfirmasi!');
      loadOrders();
    } catch (error: any) {
      toast.error('Gagal konfirmasi pembayaran: ' + error.message);
    } finally {
      setConfirmingPayment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewOrder = () => {
    setShowReceipt(false);
    setCompletedOrder(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/kuramalogo.png" alt="kur𝛂ma" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800">kur𝛂ma</h1>
              <p className="text-xs text-gray-500">Kasir Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('menu')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'menu' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setViewMode('orders')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'orders' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
              >
                Pesanan
              </button>
            </div>
            
            {/* Cart Button (only in menu mode) */}
            {viewMode === 'menu' && (
              <motion.button
                onClick={() => setShowCart(true)}
                className="relative p-3 bg-blue-500 text-white rounded-xl"
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </motion.button>
            )}
            
            {/* Logout */}
            <motion.button
              onClick={onLogout}
              className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl"
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* MENU VIEW - Sama persis dengan MenuScreen */}
      {viewMode === 'menu' && (
        <div className="flex-1 bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-24">
          {/* Customer Name Input */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center"
                   style={{ boxShadow: '0 4px 0 0 #C2410C, 0 6px 12px rgba(249, 115, 22, 0.4)' }}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Pesanan untuk:</p>
                <input
                  type="text"
                  placeholder="Nama Pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 bg-white border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 text-gray-800 font-bold"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-orange-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                  style={selectedCategory === category ? { boxShadow: button3D } : {}}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Menu List - Card Kotak-Kotak Grid */}
          <main className="px-5 py-2 pb-28">
            <p className="text-xs text-gray-400 mb-3">{filteredItems.length} menu tersedia</p>
            
            {menuLoading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Memuat menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <motion.div 
                      key={item.id} 
                      className="bg-white rounded-2xl overflow-hidden"
                      style={{ boxShadow: cardShadow }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Image - Aspect ratio 1:1.25 portrait */}
                      <div className="relative" style={{ paddingBottom: '125%' }}>
                        <motion.img 
                          src={item.image_url || 'https://placehold.co/300x600/orange/white?text=No+Image'} 
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/orange/white?text=No+Image';
                          }}
                        />
                        {item.is_popular && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-1 rounded-full font-medium"
                                style={{ boxShadow: '0 2px 4px rgba(249, 115, 22, 0.4)' }}>
                            Popular
                          </span>
                        )}
                        
                        {/* Tombol Tambah di pojok kanan bawah gambar */}
                        <motion.button
                          onClick={() => addToCart(item)}
                          className="absolute bottom-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ boxShadow: '0 3px 0 0 #C2410C' }}
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                        
                        {/* Quantity Badge */}
                        {quantity > 0 && (
                          <motion.div 
                            className="absolute top-2 right-2 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                          >
                            {quantity}
                          </motion.div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                        <p className={`text-xs uppercase font-medium mt-1 ${
                          item.category_name === 'Minuman' ? 'text-blue-500' : 
                          item.category_name === 'Coffee' ? 'text-amber-600' :
                          item.category_name === 'Signatures' ? 'text-pink-500' :
                          item.category_name === 'Makanan' ? 'text-green-500' : 
                          item.category_name === 'Camilan' ? 'text-purple-500' : 
                          'text-orange-500'
                        }`}>
                          {item.category_name}
                        </p>
                        <p className="font-bold text-orange-600 text-sm mt-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Bottom Cart Bar */}
          <AnimatePresence>
            {cartTotal > 0 && (
              <motion.div 
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-4 z-50"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
              >
                <motion.button
                  onClick={() => setShowCart(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-4 flex items-center justify-between"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 2 }}
                  style={{ boxShadow: button3D }}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-xs text-orange-100">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} item</p>
                      <p className="font-bold">Rp {cartTotal.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Lihat Keranjang</span>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ORDERS VIEW - Sama persis dengan admin OrderManagement */}
      {viewMode === 'orders' && (
        <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-blue-50">
          {/* Active Orders Badge */}
          <motion.div 
            className="flex items-center gap-2 px-4 py-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-600">
              {orders.filter(o => ['BARU', 'DIPROSES', 'SIAP'].includes(o.status)).length} Pesanan Aktif
            </span>
            <span className="text-xs text-gray-400">({orders.length} hari ini)</span>
            
            {/* Refresh Button */}
            <motion.button 
              onClick={loadOrders}
              disabled={loading}
              className="ml-auto w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.1, rotate: loading ? 0 : 180 }}
              whileTap={{ scale: loading ? 1 : 0.9 }}
            >
              <RefreshCw className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </motion.div>

          {/* Filter Tabs - Sama dengan admin */}
          <motion.div 
            className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab}
              </motion.button>
            ))}
          </motion.div>

          {/* Orders List - Sama persis dengan admin */}
          <div className="px-4 py-4 space-y-4 pb-24">
            {loading ? (
              // Skeleton loading
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
                  <div className="h-20 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))
            ) : filteredOrders.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400">Tidak ada pesanan</p>
                <motion.button
                  onClick={loadOrders}
                  className="mt-4 text-blue-600 font-medium flex items-center justify-center gap-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </motion.button>
              </motion.div>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div 
                  key={order.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-card"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(59, 130, 246, 0.1)'
                  }}
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-700">{order.order_number}</span>
                      <Badge className={`${getStatusColor(order.status)} text-white text-xs px-2 py-0.5`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{order.customer_name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                            <span className="text-blue-600 font-medium">Antrian #{order.queue_number}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-4 space-y-2 mb-3">
                    {orderItems[order.id]?.map((item, idx) => (
                      <motion.div 
                        key={idx} 
                        className="flex items-center justify-between text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {item.quantity}x
                          </span>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-gray-600">
                          Rp{item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </motion.div>
                    ))}
                    {!orderItems[order.id] && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Memuat item...</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mx-4 flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                    <span className="text-sm text-gray-500">Total ({order.item_count || orderItems[order.id]?.length || 0} item)</span>
                    <span className="font-semibold text-blue-600">
                      Rp{order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Payment Status Badge */}
                  {order.payment_status !== undefined && (
                    <div className="mx-4 flex items-center justify-between mb-3">
                      <Badge className={`${
                        order.payment_status === 'SUDAH_BAYAR'
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      } text-white`}>
                        {order.payment_status === 'SUDAH_BAYAR' ? '✓ SUDAH BAYAR' : 'BELUM BAYAR'}
                      </Badge>
                      {order.payment_method && (
                        <span className="text-xs text-gray-500">
                          {order.payment_method}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Sama dengan admin */}
                  <div className="px-4 pb-4 space-y-2">
                    {/* Tombol Konfirmasi Pembayaran */}
                    {(order.payment_status === 'BELUM_BAYAR' || 
                      (order.payment_status === undefined && order.status === 'BARU')) && (
                      <motion.button
                        onClick={() => handlePaymentConfirm(order.id)}
                        disabled={confirmingPayment[order.id]}
                        className="w-full h-12 bg-red-500 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                        whileHover={{ scale: confirmingPayment[order.id] ? 1 : 1.02, y: confirmingPayment[order.id] ? 0 : -2 }}
                        whileTap={{ scale: confirmingPayment[order.id] ? 1 : 0.98 }}
                        style={{
                          boxShadow: confirmingPayment[order.id]
                            ? '0 2px 0 0 #DC2626'
                            : '0 6px 0 0 #DC2626, 0 8px 16px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        {confirmingPayment[order.id] ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Mengkonfirmasi...</span>
                          </>
                        ) : (
                          '✓ Konfirmasi Pembayaran'
                        )}
                      </motion.button>
                    )}
                    
                    {/* Tombol Update Status */}
                    {order.payment_status === 'SUDAH_BAYAR' && 
                     order.status !== 'SELESAI' && 
                     order.status !== 'DIBATALKAN' && (
                      <motion.button
                        onClick={() => handleStatusUpdate(order.id, order.status)}
                        disabled={updatingOrders[order.id]}
                        className={`w-full h-12 ${getActionButtonColor(order.status)} text-white rounded-2xl font-semibold shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2`}
                        whileHover={{ scale: updatingOrders[order.id] ? 1 : 1.02, y: updatingOrders[order.id] ? 0 : -2 }}
                        whileTap={{ scale: updatingOrders[order.id] ? 1 : 0.98 }}
                        style={{
                          boxShadow: updatingOrders[order.id]
                            ? order.status === 'DIPROSES' 
                              ? '0 2px 0 0 #C2410C'
                              : order.status === 'BARU'
                              ? '0 2px 0 0 #1D4ED8'
                              : '0 2px 0 0 #15803D'
                            : order.status === 'DIPROSES' 
                              ? '0 6px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)'
                              : order.status === 'BARU'
                              ? '0 6px 0 0 #1D4ED8, 0 8px 16px rgba(59, 130, 246, 0.4)'
                              : '0 6px 0 0 #15803D, 0 8px 16px rgba(34, 197, 94, 0.4)'
                        }}
                      >
                        {updatingOrders[order.id] ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Mengupdate...</span>
                          </>
                        ) : (
                          getActionButtonLabel(order.status)
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cart Sidebar - Tema Oranye */}
      <AnimatePresence>
        {showCart && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-800">Keranjang</h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-orange-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      className="bg-orange-50 rounded-2xl p-4"
                      layout
                    >
                      <div className="flex gap-3">
                        <img 
                          src={item.menu_item.image_url || 'https://placehold.co/80x80/orange/white?text=No+Image'} 
                          alt={item.menu_item.name}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-800 truncate">{item.menu_item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-full">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-orange-600 font-medium">Rp {item.menu_item.price.toLocaleString('id-ID')}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <motion.button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
                              whileTap={{ scale: 0.9 }}
                              style={{ boxShadow: '0 2px 0 0 #D1D5DB' }}
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <motion.button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center"
                              whileTap={{ scale: 0.9 }}
                              style={{ boxShadow: '0 2px 0 0 #C2410C' }}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                            <span className="ml-auto font-bold text-orange-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                          
                          {/* Notes */}
                          <input
                            type="text"
                            placeholder="Catatan (opsional)"
                            value={item.notes}
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            className="w-full text-sm px-3 py-2 mt-2 bg-white rounded-lg border border-orange-200 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-orange-100 p-4 space-y-3 bg-gradient-to-t from-orange-50 to-white">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PPN (10%)</span>
                      <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-orange-200">
                      <span>Total</span>
                      <span className="text-orange-600">Rp {finalTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  {/* Checkout Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => handleCheckout('CASH')}
                      disabled={isProcessing}
                      className="h-14 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ boxShadow: '0 4px 0 0 #15803D, 0 4px 8px rgba(34, 197, 94, 0.4)' }}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                      CASH
                    </motion.button>
                    <motion.button
                      onClick={() => handleCheckout('QRIS')}
                      disabled={isProcessing}
                      className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ boxShadow: '0 4px 0 0 #1E40AF, 0 4px 8px rgba(59, 130, 246, 0.4)' }}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      QRIS
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && completedOrder && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowReceipt(false)} />
            <motion.div className="relative bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="p-6 font-mono text-sm">
                <div className="text-center mb-4">
                  <h2 className="font-bold text-lg">kur𝛂ma COFFEE</h2>
                  <p className="text-xs text-gray-500">Jl. A. Yani No. 45, Tanjung</p>
                  <p className="text-xs text-gray-500">Tabalong, Kalimantan Selatan</p>
                </div>
                <div className="border-t border-b border-dashed py-2 my-2 text-xs">
                  <p>No: {completedOrder.order_number}</p>
                  <p>Antrian: #{completedOrder.queue_number}</p>
                  <p>Pelanggan: {completedOrder.customer_name}</p>
                  <p>Kasir: KASIR</p>
                  <p>{new Date(completedOrder.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div className="py-2">
                  {completedOrder.items?.map((item, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between">
                        <span>{item.name}</span>
                        <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</span>
                      {item.notes && <p className="text-xs text-gray-400">*{item.notes}</p>}
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed py-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>Rp {completedOrder.subtotal.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span>PPN (10%)</span><span>Rp {completedOrder.tax_amount.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>TOTAL</span><span>Rp {completedOrder.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between mt-2"><span>Metode</span><span>{completedOrder.payment_method}</span></div>
                  <div className="flex justify-between"><span>Status</span><span className="text-green-600">LUNAS</span></div>
                </div>
                <div className="text-center mt-4 pt-4 border-t border-dashed">
                  <p className="text-xs text-gray-500">Terima kasih telah berkunjung!</p>
                </div>
              </div>
              <div className="p-4 border-t space-y-3">
                <motion.button onClick={handlePrint} className="w-full h-12 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                  <Printer className="w-5 h-5" /> Cetak Struk
                </motion.button>
                <motion.button onClick={handleNewOrder} className="w-full h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                  <ArrowRight className="w-5 h-5" /> Pesanan Baru
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
