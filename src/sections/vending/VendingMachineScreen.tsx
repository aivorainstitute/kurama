import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Plus, Minus, ShoppingCart, Trash2,
  QrCode, CheckCircle2, RotateCcw, ChevronRight,
  Loader2, User, Coffee
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMenuItems } from '@/hooks/useMenuItems';
import type { MenuItem } from '@/App';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VMCartItem {
  id: number;
  menu_item: MenuItem;
  quantity: number;
  subtotal: number;
}

type Step = 'name' | 'menu' | 'checkout';

// ─── Constants ────────────────────────────────────────────────────────────────
const TAX_RATE = 0.1;
// Ganti dengan URL QR QRIS aktual kamu. Bisa juga pakai gambar lokal di /public
const QRIS_IMAGE_URL = '/qris.png';

// Fallback: generate QR via API (opsional, jika file tidak ada)
const QRIS_FALLBACK = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=00020101021226660014ID.CO.QRIS.WWW011893600914000000000102150000000001234520303UMI51440014ID.CO.QRIS.WWW0215ID0000000000030303UMI5204481153033605802ID5920KURAMA COFFEE6015TANJUNG TABALONG61051714663040CBC';

// Shadow utils
const shadow3D = '0 6px 0 0 #C2410C, 0 8px 24px rgba(249,115,22,0.35)';
const shadowCard = '0 4px 20px rgba(0,0,0,0.08)';

// ─── Subcomponents ────────────────────────────────────────────────────────────

/** Step 1: Input Nama */
function StepName({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length >= 2) onNext(trimmed.toUpperCase());
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-br from-orange-50 via-white to-amber-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* BG Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div
        className="mb-10 flex flex-col items-center relative z-10"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src="/kuramalogo.png" alt="Kurama" className="w-28 h-28 object-contain drop-shadow-xl" />
        </motion.div>
        <h1 className="text-4xl font-black mt-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
          kur𝛂ma
        </h1>
        <p className="text-xs tracking-[0.3em] uppercase text-orange-400/80 mt-1">Self Order Machine</p>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm bg-white rounded-3xl p-8 relative z-10"
        style={{ boxShadow: shadowCard }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Halo! 👋</p>
            <p className="text-sm text-gray-400">Siapa nama kamu?</p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Masukkan nama kamu"
          value={name}
          onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && handleSubmit()}
          className="w-full h-14 text-center text-lg font-bold bg-orange-50 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 text-gray-700 placeholder:text-orange-300 mb-5"
          style={{ boxShadow: '0 4px 0 0 #FED7AA' }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />

        <motion.button
          onClick={handleSubmit}
          disabled={name.trim().length < 2}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: name.trim().length >= 2 ? shadow3D : '0 2px 0 0 #C2410C' }}
          whileHover={name.trim().length >= 2 ? { scale: 1.02 } : {}}
          whileTap={name.trim().length >= 2 ? { scale: 0.97, y: 4 } : {}}
        >
          Mulai Pesan <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <p className="mt-8 text-xs text-gray-300 relative z-10">Brewed with passion, served with love ☕</p>
    </motion.div>
  );
}

/** Step 2: Pilih Menu */
function StepMenu({
  customerName,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onNext,
  onBack,
}: {
  customerName: string;
  cartItems: VMCartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { menuItems, loading } = useMenuItems();
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = useMemo(() => {
    const unique = [...new Set(menuItems.map(i => i.category_name).filter(Boolean))] as string[];
    return ['Semua', ...unique];
  }, [menuItems]);

  const filtered = useMemo(() => {
    const available = menuItems.filter(i => i.is_available);
    if (selectedCategory === 'Semua') return available;
    return available.filter(i => i.category_name === selectedCategory);
  }, [menuItems, selectedCategory]);

  const getQty = (id: number) => cartItems.find(c => c.menu_item.id === id)?.quantity || 0;

  const totalItems = cartItems.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cartItems.reduce((s, c) => s + c.subtotal, 0);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-32"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Sticky Header: Navbar + Categories */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-orange-500 font-bold text-lg">←</span>
            </motion.button>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Halo, <span className="font-bold text-orange-500">{customerName}</span></p>
              <h2 className="font-black text-gray-800 text-lg">Pilih Menu</h2>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-500 border border-orange-100'
                }`}
                whileTap={{ scale: 0.95 }}
                style={selectedCategory === cat ? { boxShadow: '0 3px 0 0 #C2410C' } : {}}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <main className="px-5 pt-4 grid grid-cols-3 gap-4 pb-8">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-orange-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Memuat menu...</p>
          </div>
        ) : (
          filtered.map(item => {
            const qty = getQty(item.id);
            return (
              <motion.div
                key={item.id}
                className="bg-white rounded-2xl p-4 flex flex-col h-full"
                style={{ boxShadow: shadowCard }}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <div className="relative w-full aspect-square mb-3">
                  <img
                    src={item.image_url || 'https://placehold.co/400x400/FED7AA/C2410C?text=☕'}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/FED7AA/C2410C?text=☕'; }}
                  />
                  {item.is_popular && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">
                      Popular
                    </span>
                  )}
                </div>

                <div className="flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 mb-2 flex-grow">{item.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <p className="font-black text-orange-600 text-lg">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-3 bg-gray-50 p-1.5 rounded-2xl">
                    <motion.button
                      onClick={() => onRemoveFromCart(item.id)}
                      disabled={qty === 0}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        qty > 0 ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-300'
                      }`}
                      whileTap={qty > 0 ? { scale: 0.9 } : {}}
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>

                    <motion.span
                      key={qty}
                      className="font-black text-lg flex-1 text-center"
                      initial={{ scale: 1.4, color: '#F97316' }}
                      animate={{ scale: 1, color: '#1F2937' }}
                    >
                      {qty}
                    </motion.span>

                    <motion.button
                      onClick={() => onAddToCart(item)}
                      className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center flex-shrink-0"
                      whileTap={{ scale: 0.9, y: 2 }}
                      style={{ boxShadow: '0 3px 0 0 #C2410C' }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Cart Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-orange-100 z-50"
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
          >
            <motion.button
              onClick={onNext}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-between px-6"
              style={{ boxShadow: shadow3D }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, y: 4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-orange-100">{totalItems} item dipilih</p>
                  <p className="font-black text-base">Rp {totalPrice.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">Checkout</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Step 3: Checkout + QR QRIS */
function StepCheckout({
  customerName,
  cartItems,
  onRemoveItem,
  onPlaceOrder,
  onReset,
  isOrdering,
  orderSuccess,
  orderNumber,
  queueNumber,
  activeOrderId,
}: {
  customerName: string;
  cartItems: VMCartItem[];
  onRemoveItem: (id: number) => void;
  onPlaceOrder: () => void;
  onReset: () => void;
  isOrdering: boolean;
  orderSuccess: boolean;
  orderNumber: string;
  queueNumber: number;
  activeOrderId?: number | null;
}) {
  const subtotal = cartItems.reduce((s, c) => s + c.subtotal, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const [qrisError, setQrisError] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>('BARU');

  // Real-time listener for order status
  useEffect(() => {
    if (!orderSuccess || !activeOrderId) return;
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`vm_order_${activeOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrderId}` },
        (payload) => {
          const newStatus = payload.new.status;
          setOrderStatus(newStatus);
          
          // Auto reset IF Admin marks as SELESAI
          if (newStatus === 'SELESAI') {
            onReset();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderSuccess, activeOrderId, onReset]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Navbar */}
      {!orderSuccess && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 px-5 py-4 flex items-center gap-3">
          <h2 className="font-black text-gray-800 text-lg flex-1">Checkout</h2>
          <span className="text-sm text-orange-500 font-semibold">{customerName}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Order Success View ── */}
        {orderSuccess ? (
          <motion.div
            key="success"
            className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </motion.div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">Pesanan Masuk! 🎉</h2>
            <p className="text-gray-500 mb-6">Silakan scan QR di bawah untuk bayar via QRIS</p>

            {/* Nomor Antrian */}
            <div className="bg-orange-500 text-white rounded-3xl px-8 py-4 mb-6" style={{ boxShadow: shadow3D }}>
              <p className="text-orange-100 text-sm uppercase tracking-wider">Nomor Antrian</p>
              <p className="text-6xl font-black">#{queueNumber}</p>
              <p className="text-orange-100 text-xs mt-1 font-mono">{orderNumber}</p>
            </div>

            {/* Total */}
            <div className="bg-white rounded-2xl px-6 py-4 mb-6 w-full max-w-xs text-center" style={{ boxShadow: shadowCard }}>
              <p className="text-gray-400 text-sm">Total Pembayaran</p>
              <p className="text-3xl font-black text-orange-600">Rp {total.toLocaleString('id-ID')}</p>
            </div>

            {/* Conditional Display berdasarkan Status */}
            {orderStatus === 'BARU' || orderStatus === 'BELUM_BAYAR' ? (
              <div className="bg-white rounded-3xl p-6 mb-6 w-full max-w-xs" style={{ boxShadow: shadowCard }}>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <p className="font-bold text-gray-800">Scan QRIS untuk Bayar</p>
                </div>
                <img
                  src={qrisError ? QRIS_FALLBACK : QRIS_IMAGE_URL}
                  alt="QRIS Payment"
                  className="w-full aspect-square object-contain rounded-2xl"
                  onError={() => setQrisError(true)}
                />
                <p className="text-center text-sm font-bold text-orange-500 animate-pulse mt-4">
                  Menunggu Pembayaran...
                </p>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Gopay · OVO · Dana · LinkAja · ShopeePay · M-Banking
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 mb-6 w-full max-w-xs text-center border-2 border-orange-100 relative overflow-hidden" style={{ boxShadow: shadowCard }}>
                {/* Animated Background Pulse */}
                <div className="absolute inset-0 bg-orange-50/50 flex items-center justify-center pointer-events-none">
                  <motion.div
                    className="w-full h-full bg-orange-100/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(249,115,22,0.4)]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Coffee className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="font-black text-gray-800 mb-1">Status Mesin</h3>
                  <p className="text-orange-500 font-bold text-sm mb-3 flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sedang Disiapkan...
                  </p>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      Keterangan: <span className="text-gray-800 font-bold">Pembayaran Diterima!</span> Produk otomatis keluar sebentar lagi.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <motion.button
              onClick={onReset}
              className="flex items-center gap-2 text-orange-500 font-semibold text-sm py-3 px-6 rounded-2xl bg-orange-50 border border-orange-200"
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-4 h-4" />
              Pesan Lagi (reset)
            </motion.button>
            <p className="text-xs text-gray-300 mt-4">Halaman otomatis reset dalam 60 detik</p>
          </motion.div>
        ) : (
          /* ── Normal Checkout View ── */
          <motion.div key="checkout" className="px-5 py-4 pb-40 space-y-4">
            {/* Item List */}
            <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: shadowCard }}>
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-800">Pesanan <span className="text-orange-500">{customerName}</span></h3>
              </div>
              {cartItems.map((c, idx) => (
                <motion.div
                  key={c.id}
                  className={`flex items-center px-5 py-4 gap-3 ${idx < cartItems.length - 1 ? 'border-b border-gray-50' : ''}`}
                  layout
                >
                  <img
                    src={c.menu_item.image_url || 'https://placehold.co/60x60/FED7AA/C2410C?text=☕'}
                    alt={c.menu_item.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/FED7AA/C2410C?text=☕'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{c.menu_item.name}</p>
                    <p className="text-sm text-gray-400">{c.quantity} × Rp {c.menu_item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-orange-600 text-sm whitespace-nowrap">
                      Rp {c.subtotal.toLocaleString('id-ID')}
                    </p>
                    <motion.button
                      onClick={() => onRemoveItem(c.menu_item.id)}
                      className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rincian Harga */}
            <div className="bg-white rounded-3xl p-5 space-y-3" style={{ boxShadow: shadowCard }}>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Pajak (10%)</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-dashed border-orange-100 pt-3 flex justify-between">
                <span className="font-black text-gray-800 text-lg">Total</span>
                <span className="font-black text-orange-600 text-xl">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar — hanya tampil saat belum success */}
      {!orderSuccess && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-orange-100 z-50 space-y-3"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <motion.button
            onClick={onPlaceOrder}
            disabled={isOrdering || cartItems.length === 0}
            className="w-full h-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center gap-3 text-lg font-black disabled:opacity-50"
            style={{ boxShadow: shadow3D }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 4 }}
          >
            {isOrdering ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
            ) : (
              <><QrCode className="w-5 h-5" /> Buat Pesanan & Bayar QRIS</>
            )}
          </motion.button>
          <motion.button
            onClick={onReset}
            className="w-full h-11 bg-gray-100 rounded-2xl text-gray-500 font-semibold text-sm"
            whileTap={{ scale: 0.97 }}
          >
            ← Mulai Ulang
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VendingMachineScreen() {
  const [step, setStep] = useState<Step>('name');
  const [customerName, setCustomerName] = useState('');
  const [cartItems, setCartItems] = useState<VMCartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [queueNumber, setQueueNumber] = useState(0);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // ── Cart Actions
  const addToCart = useCallback((item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.menu_item.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.menu_item.id === item.id
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.menu_item.price }
            : c
        );
      }
      return [...prev, { id: Date.now(), menu_item: item, quantity: 1, subtotal: item.price }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.menu_item.id === itemId);
      if (!existing || existing.quantity <= 1) {
        return prev.filter(c => c.menu_item.id !== itemId);
      }
      return prev.map(c =>
        c.menu_item.id === itemId
          ? { ...c, quantity: c.quantity - 1, subtotal: (c.quantity - 1) * c.menu_item.price }
          : c
      );
    });
  }, []);

  const removeItemCompletely = useCallback((itemId: number) => {
    setCartItems(prev => prev.filter(c => c.menu_item.id !== itemId));
  }, []);

  // ── Create Order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || isOrdering) return;
    setIsOrdering(true);
    try {
      const subtotal = cartItems.reduce((s, c) => s + c.subtotal, 0);
      const taxAmount = Math.round(subtotal * TAX_RATE);
      const totalAmount = subtotal + taxAmount;

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNum = `VM-${date}-${rand}`;

      // Get queue number
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const { data: qData } = await supabase
        .from('orders')
        .select('queue_number')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${tomorrow}T00:00:00`)
        .order('queue_number', { ascending: false })
        .limit(1);
      const qNum = qData && qData.length > 0 ? (qData[0].queue_number || 0) + 1 : 1;

      // Insert order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNum,
          queue_number: qNum,
          customer_name: customerName,
          status: 'BARU',
          payment_method: 'QRIS',
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        }])
        .select()
        .single();
      if (orderErr) throw orderErr;

      // Insert order items
      const itemsToInsert = cartItems.map(c => ({
        order_id: orderData.id,
        menu_item_id: c.menu_item.id,
        name: c.menu_item.name,
        quantity: c.quantity,
        unit_price: c.menu_item.price,
        notes: null,
        subtotal: c.subtotal,
        image_url: c.menu_item.image_url || null,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      setOrderNumber(orderNum);
      setQueueNumber(qNum);
      setActiveOrderId(orderData.id);
      setOrderSuccess(true);
    } catch (err) {
      console.error('Order error:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsOrdering(false);
    }
  };

  // ── Reset all
  const handleReset = useCallback(() => {
    setStep('name');
    setCustomerName('');
    setCartItems([]);
    setOrderSuccess(false);
    setOrderNumber('');
    setQueueNumber(0);
    setActiveOrderId(null);
    setIsOrdering(false);
  }, []);

  // ── Render step
  return (
    <AnimatePresence mode="wait">
      {step === 'name' && (
        <motion.div key="name">
          <StepName onNext={name => { setCustomerName(name); setStep('menu'); }} />
        </motion.div>
      )}
      {step === 'menu' && (
        <motion.div key="menu">
          <StepMenu
            customerName={customerName}
            cartItems={cartItems}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onNext={() => setStep('checkout')}
            onBack={handleReset}
          />
        </motion.div>
      )}
      {step === 'checkout' && (
        <motion.div key="checkout">
          <StepCheckout
            customerName={customerName}
            cartItems={cartItems}
            onRemoveItem={removeItemCompletely}
            onPlaceOrder={handlePlaceOrder}
            onReset={handleReset}
            isOrdering={isOrdering}
            orderSuccess={orderSuccess}
            orderNumber={orderNumber}
            queueNumber={queueNumber}
            activeOrderId={activeOrderId}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
