import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ChevronRight, ClipboardList, ShoppingBag, User, Loader2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useMenuItems, clearMenuCache } from '@/hooks/useMenuItems';
import { useOrders } from '@/hooks/useOrders';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { MenuItem, CartItem, Order } from '@/App';

interface MenuScreenProps {
  customerName: string;
  cartItems: CartItem[];
  addToCart: (menuItem: MenuItem, quantity: number, notes: string) => void;
  activeOrder: Order | null;
}

// Helper untuk format waktu relatif
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// 3D Shadow style
const cardShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)';
const button3D = '0 4px 0 0 #C2410C, 0 4px 8px rgba(249, 115, 22, 0.4)';

export default function MenuScreen({ customerName, cartItems, addToCart, activeOrder }: MenuScreenProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const { menuItems, loading, error, refetch } = useMenuItems();
  const { orderSummaries } = useOrders();
  
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

  const handleQuantityChange = (item: MenuItem, delta: number) => {
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
          <div>
            <p className="text-sm text-gray-500">Hai {customerName || 'Guest'},</p>
            <h1 className="text-lg font-bold text-gray-800">mau pesan apa?</h1>
          </div>
          <motion.button 
            onClick={() => {
              clearMenuCache();
              window.location.reload();
            }}
            className="ml-auto w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className="w-5 h-5 text-orange-600" />
          </motion.button>
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
          {filteredItems.map((item) => {
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
    </div>
  );
}
