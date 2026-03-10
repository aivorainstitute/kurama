import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ChevronRight, ClipboardList, ShoppingBag, User, Loader2, RefreshCw, Clock, AlertCircle, Users, X, ChevronLeft } from 'lucide-react';
import { useMenuItems, clearMenuCache } from '@/hooks/useMenuItems';
import { useOrders } from '@/hooks/useOrders';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { MenuItem, CartItem, Order } from '@/App';

interface MenuScreenProps {
  customerName: string;
  cartItems: CartItem[];
  addToCart: (menuItem: MenuItem, quantity: number, notes: string) => void;
  activeOrder?: import('@/App').Order | null;
}

// 3D Shadow style
const cardShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)';
const button3D = '0 4px 0 0 #C2410C, 0 4px 8px rgba(249, 115, 22, 0.4)';

export default function MenuScreen({ customerName, cartItems, addToCart, activeOrder }: MenuScreenProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  
  const { menuItems, loading, error, refetch: _refetch } = useMenuItems();
  const { orderSummaries } = useOrders();
  const _activeOrder = activeOrder;
  
  // Timeout - kalau loading lebih dari 8 detik, anggap timeout
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Format relative time helper function
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };
  
  // Filter pesanan customer yang masih aktif (tidak SELESAI/DIBATALKAN)
  const customerOrders = useMemo(() => {
    return orderSummaries.filter(o => 
      o.customer_name.toLowerCase() === customerName.toLowerCase() &&
      o.status !== 'SELESAI' && 
      o.status !== 'DIBATALKAN'
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orderSummaries, customerName]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(
      menuItems
        .map(item => item.category_name)
        .filter((cat): cat is string => !!cat)
    )];
    return ['Semua', ...uniqueCategories];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') {
      return menuItems.filter(item => item.is_available);
    }
    return menuItems.filter(item => 
      item.is_available && item.category_name === selectedCategory
    );
  }, [menuItems, selectedCategory]);

  const getItemQuantity = (itemId: number) => {
    const cartItem = cartItems.find(item => item.menu_item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleQuantityChange = (item: import('@/App').MenuItem, delta: number) => {
    const currentQty = getItemQuantity(item.id);
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty > 0 || delta > 0) {
      addToCart(item, delta, '');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const RightIconButton = (
    <button onClick={() => navigate('/check-order')}>
      <User className="w-5 h-5 text-white" />
    </button>
  );

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Menu" showBack={false} rightIcon={RightIconButton} />
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Memuat menu...</p>
        </div>
      </div>
    );
  }
  
  // Jika timeout, tampilkan error
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Menu" showBack={false} rightIcon={RightIconButton} />
        <div className="flex flex-col items-center justify-center h-96 px-4">
          <p className="text-red-500 mb-2 font-medium">Waktu habis</p>
          <p className="text-sm text-gray-500 mb-4 text-center">Tidak dapat memuat menu. Periksa koneksi internet Anda.</p>
          <motion.button 
            onClick={() => {
              clearMenuCache();
              window.location.reload();
            }}
            className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 2 }}
            style={{ boxShadow: button3D }}
          >
            Coba Lagi
          </motion.button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Menu" showBack={false} rightIcon={RightIconButton} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center px-4">
            <p className="text-red-500 mb-2 font-medium">Gagal memuat menu</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <motion.button 
              onClick={() => {
                clearMenuCache();
                window.location.reload();
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 2 }}
              style={{ boxShadow: button3D }}
            >
              Muat Ulang
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-24">
      <CustomerNavbar3D 
        title="Menu"
        showBack={false}
        rightIcon={RightIconButton}
      />
      
      <div className="px-5 pt-2 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center"
               style={{ boxShadow: '0 4px 0 0 #C2410C, 0 6px 12px rgba(249, 115, 22, 0.4)' }}>
            <span className="text-white font-bold text-lg">AN</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Hai {customerName || 'Guest'},</p>
            <h1 className="text-lg font-bold text-gray-800">mau pesan apa?</h1>
            {/* Tombol Riwayat Pesanan */}
            <motion.button
              onClick={() => navigate('/check-order')}
              className="mt-1 text-xs text-orange-600 font-medium flex items-center gap-1 hover:text-orange-700"
              whileHover={{ x: 2 }}
            >
              <ClipboardList className="w-3 h-3" />
              Riwayat Pesanan
            </motion.button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Tombol Cek Antrian */}
            <motion.button 
              onClick={() => setShowQueueModal(true)}
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Users className="w-5 h-5 text-blue-600" />
            </motion.button>
            <motion.button 
              onClick={() => {
                clearMenuCache();
                window.location.reload();
              }}
              className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </motion.button>
          </div>
        </div>

        {/* Tombol Cek Pesanan */}
        {customerOrders.length > 0 && (
          <motion.button 
            onClick={() => navigate('/check-order')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 flex items-center justify-between mb-4 text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, y: 2 }}
            style={{ boxShadow: button3D }}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-orange-100">
                  {customerOrders.length} PESANAN AKTIF
                </p>
                <p className="text-sm font-semibold">Cek Pesanan</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}

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

      <main className="px-5 py-2">
        <p className="text-xs text-gray-400 mb-3">{filteredItems.length} menu tersedia</p>
        
        <div className="space-y-3">
          {filteredItems.map((item: import('@/App').MenuItem) => {
            const quantity = getItemQuantity(item.id);
            return (
              <motion.div 
                key={item.id} 
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: cardShadow }}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <motion.img 
                      src={item.image_url || 'https://placehold.co/100x100/orange/white?text=No+Image'} 
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/orange/white?text=No+Image';
                      }}
                      whileHover={{ scale: 1.05 }}
                    />
                    {item.is_popular && (
                      <span className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-1 rounded-full font-medium"
                            style={{ boxShadow: '0 2px 4px rgba(249, 115, 22, 0.4)' }}>
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
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
                      </div>
                      <p className="font-bold text-orange-600 text-sm whitespace-nowrap">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <motion.button
                        onClick={() => handleQuantityChange(item, -1)}
                        disabled={quantity === 0}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          quantity > 0 ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400'
                        }`}
                        whileHover={quantity > 0 ? { scale: 1.1 } : {}}
                        whileTap={quantity > 0 ? { scale: 0.9, y: 2 } : {}}
                        style={quantity > 0 ? { boxShadow: '0 2px 0 0 #9CA3AF, 0 2px 4px rgba(0,0,0,0.1)' } : {}}
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.span 
                        className="w-10 text-center font-bold text-lg"
                        key={quantity}
                        initial={{ scale: 1.3, color: '#F97316' }}
                        animate={{ scale: 1, color: '#1F2937' }}
                      >
                        {quantity}
                      </motion.span>
                      
                      <motion.button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9, y: 2 }}
                        style={{ boxShadow: button3D }}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-4 z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <motion.button
              onClick={() => navigate('/cart')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-4 flex items-center justify-between"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 2 }}
              style={{ boxShadow: button3D }}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-xs text-orange-100">{totalItems} item</p>
                  <p className="font-bold">Rp {totalPrice.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Cek Antrian */}
      <AnimatePresence>
        {showQueueModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowQueueModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '80vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setShowQueueModal(false)}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </motion.button>
                  <div>
                    <h2 className="text-lg font-bold text-white">Antrian Live</h2>
                    <p className="text-xs text-orange-100">
                      {orderSummaries.filter(o => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN').length} pesanan aktif
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Queue List */}
              <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                {(() => {
                  // Filter semua pesanan yang belum selesai/dibatalkan
                  const activeOrders = orderSummaries
                    .filter(o => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN')
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                  
                  // Pisahkan berdasarkan status pembayaran
                  const paidOrders = activeOrders.filter(o => o.payment_status === 'SUDAH_BAYAR');
                  const unpaidOrders = activeOrders.filter(o => o.payment_status !== 'SUDAH_BAYAR');
                  
                  // Paid orders: dikelompokkan berdasarkan status pesanan
                  const paidReady = paidOrders.filter(o => o.status === 'SIAP');
                  const paidProcessing = paidOrders.filter(o => o.status === 'DIPROSES');
                  const paidPending = paidOrders.filter(o => o.status === 'BARU');
                  
                  // Unpaid orders: dikelompokkan berdasarkan status pesanan
                  const unpaidReady = unpaidOrders.filter(o => o.status === 'SIAP');
                  const unpaidProcessing = unpaidOrders.filter(o => o.status === 'DIPROSES');
                  const unpaidPending = unpaidOrders.filter(o => o.status === 'BARU');

                  if (activeOrders.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Tidak ada antrian saat ini</p>
                      </div>
                    );
                  }

                  // Helper function untuk render order item
                  const renderOrderItem = (order: typeof activeOrders[0], idx: number, isPaid: boolean) => {
                    const isReady = order.status === 'SIAP';
                    const isProcessing = order.status === 'DIPROSES';
                    
                    // Warna berdasarkan status pesanan
                    const bgColor = isReady ? 'bg-green-50' : isProcessing ? 'bg-orange-50' : 'bg-blue-50';
                    const borderColor = isReady ? 'border-green-200' : isProcessing ? 'border-orange-200' : 'border-blue-200';
                    const numberBg = isReady ? 'bg-green-500' : isProcessing ? 'bg-orange-500' : 'bg-blue-500';
                    const numberShadow = isReady ? '#16A34A' : isProcessing ? '#C2410C' : '#1E40AF';
                    const textColor = isReady ? 'text-green-600' : isProcessing ? 'text-orange-600' : 'text-blue-600';
                    
                    return (
                      <motion.div
                        key={order.id}
                        className={`${bgColor} border ${borderColor} rounded-2xl p-4`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${numberBg} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                               style={{ boxShadow: `0 4px 0 0 ${numberShadow}` }}>
                            {order.queue_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{order.customer_name}</p>
                            <p className={`text-xs ${textColor} font-medium`}>
                              {order.item_count || 0} item • Rp {order.total_amount?.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Status Pesanan - GEDE */}
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                              isReady 
                                ? 'bg-green-500 text-white' 
                                : isProcessing 
                                  ? 'bg-orange-500 text-white' 
                                  : 'bg-blue-500 text-white'
                            }`}>
                              {isReady ? 'SIAP DIAMBIL' : isProcessing ? 'DIPROSES' : 'MENUNGGU'}
                            </span>
                            {/* Status Pembayaran - KECIL */}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isPaid ? '✓ Sudah Bayar' : 'Belum Bayar'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      {/* === SUDAH BAYAR === */}
                      {paidOrders.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            SUDAH BAYAR ({paidOrders.length})
                          </h3>
                          <div className="space-y-2">
                            {/* Siap Diambil */}
                            {paidReady.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-medium text-green-600 uppercase mb-2 ml-1">Siap Diambil ({paidReady.length})</p>
                                <div className="space-y-2">
                                  {paidReady.map((order, idx) => renderOrderItem(order, idx, true))}
                                </div>
                              </div>
                            )}
                            {/* Diproses */}
                            {paidProcessing.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-medium text-orange-600 uppercase mb-2 ml-1">Diproses ({paidProcessing.length})</p>
                                <div className="space-y-2">
                                  {paidProcessing.map((order, idx) => renderOrderItem(order, idx, true))}
                                </div>
                              </div>
                            )}
                            {/* Menunggu */}
                            {paidPending.length > 0 && (
                              <div>
                                <p className="text-[10px] font-medium text-blue-600 uppercase mb-2 ml-1">Menunggu ({paidPending.length})</p>
                                <div className="space-y-2">
                                  {paidPending.map((order, idx) => renderOrderItem(order, idx, true))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* === BELUM BAYAR === */}
                      {unpaidOrders.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2 bg-red-100 px-3 py-2 rounded-lg">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                            BELUM BAYAR ({unpaidOrders.length})
                          </h3>
                          <div className="space-y-2">
                            {/* Siap Diambil */}
                            {unpaidReady.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-medium text-green-600 uppercase mb-2 ml-1">Siap Diambil ({unpaidReady.length})</p>
                                <div className="space-y-2">
                                  {unpaidReady.map((order, idx) => renderOrderItem(order, idx, false))}
                                </div>
                              </div>
                            )}
                            {/* Diproses */}
                            {unpaidProcessing.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-medium text-orange-600 uppercase mb-2 ml-1">Diproses ({unpaidProcessing.length})</p>
                                <div className="space-y-2">
                                  {unpaidProcessing.map((order, idx) => renderOrderItem(order, idx, false))}
                                </div>
                              </div>
                            )}
                            {/* Menunggu */}
                            {unpaidPending.length > 0 && (
                              <div>
                                <p className="text-[10px] font-medium text-blue-600 uppercase mb-2 ml-1">Menunggu ({unpaidPending.length})</p>
                                <div className="space-y-2">
                                  {unpaidPending.map((order, idx) => renderOrderItem(order, idx, false))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
