import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Loader2, Wallet, ArrowRight, QrCode, X, CheckCircle2, Utensils, User, ClipboardList } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import { supabase } from '@/lib/supabase';
import type { Order, OrderSummary, OrderItem } from '@/App';
import type { PaymentMethod } from '@/lib/supabase';

// 3D Shadow style
const card3D = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.15)';
const button3D = '0 4px 0 0 #C2410C, 0 4px 8px rgba(249, 115, 22, 0.4)';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 }
  }
};

interface QueueScreenProps {
  customerName: string;
  activeOrder: Order | null;
  orders: OrderSummary[];
}

export default function QueueScreen({ customerName, activeOrder: _localActiveOrder, orders: localOrders }: QueueScreenProps) {
  const navigate = useNavigate();
  
  // State untuk modal ganti metode pembayaran
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<import('@/lib/supabase').OrderSummary | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // State untuk modal detail pesanan (tanpa pindah halaman)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<import('@/lib/supabase').OrderSummary | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [loadingDetailItems, setLoadingDetailItems] = useState(false);
  
  // Ambil data real-time dari Supabase
  const { orderSummaries, loading, refetch } = useOrders();
  
  // Auto-refresh saat halaman aktif
  useEffect(() => {
    // Refresh saat halaman menjadi visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh setiap 3 detik
    const intervalId = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [refetch]);
  
  // Debug log
  useEffect(() => {
    console.log('[QueueScreen] orderSummaries updated:', orderSummaries.length, orderSummaries.map(o => ({id: o.id, name: o.customer_name, status: o.status})));
  }, [orderSummaries]);

  // Gunakan data dari Supabase (real-time), fallback ke localOrders
  const orders: import('@/App').Order[] = orderSummaries.length > 0 
    ? orderSummaries.map(summary => ({
        id: summary.id,
        order_number: summary.order_number,
        queue_number: summary.queue_number,
        status: summary.status,
        customer_name: summary.customer_name,
        payment_status: summary.payment_status,
        payment_method: summary.payment_method,
        items: (summary as any).items || [],
        subtotal: summary.subtotal,
        tax_amount: summary.tax_amount,
        total_amount: summary.total_amount,
        created_at: summary.created_at
      })) as import('@/App').Order[]
    : (localOrders as import('@/App').Order[]);

  // Normalize status untuk comparison (handle case sensitivity dan whitespace)
  const normalizeStatus = (status: string) => status?.toString().toUpperCase().trim();
  
  // Filter orders - SEMUA order aktif (SUDAH_BAYAR) yang BELUM SELESAI/DIBATALKAN
  const activeOrders = useMemo(() => orderSummaries.filter(o => 
    o.payment_status === 'SUDAH_BAYAR' && 
    o.status !== 'SELESAI' && 
    o.status !== 'DIBATALKAN'
  ), [orderSummaries]);
  
  // Orders yang BELUM_BAYAR milik customer ini
  const pendingPaymentOrders = useMemo(() => orderSummaries.filter(o => 
    o.customer_name.toLowerCase() === customerName.toLowerCase() &&
    (o.payment_status === 'BELUM_BAYAR' || o.payment_status === undefined || o.payment_status === null) && 
    o.status !== 'SELESAI' && 
    o.status !== 'DIBATALKAN'
  ), [orderSummaries, customerName]);
  
  // Hapus duplikat berdasarkan ID
  const uniqueActiveOrders = useMemo(() => activeOrders.filter((order, index, self) => 
    index === self.findIndex((o) => o.id === order.id)
  ), [activeOrders]);
  
  // Filter berdasarkan status - SIAP dan DIPROSES dari SUDAH_BAYAR
  const readyOrders = useMemo(() => uniqueActiveOrders.filter(o => normalizeStatus(o.status) === 'SIAP'), [uniqueActiveOrders]);
  const processingOrders = useMemo(() => uniqueActiveOrders.filter(o => normalizeStatus(o.status) === 'DIPROSES'), [uniqueActiveOrders]);
  // BARU (MENUNGGU) - bisa dari SUDAH_BAYAR yang belum diproses
  const pendingOrders = useMemo(() => uniqueActiveOrders.filter(o => normalizeStatus(o.status) === 'BARU'), [uniqueActiveOrders]);
  
  // Cek apakah customer punya pesanan dalam antrian pending (BARU)
  const customerPendingOrder = useMemo(() => pendingOrders.find(o => 
    o.customer_name.toLowerCase() === customerName.toLowerCase()
  ), [pendingOrders, customerName]);
  
  // Filter pending orders lainnya (tanpa pesanan customer)
  const otherPendingOrders = useMemo(() => pendingOrders.filter(o => 
    o.customer_name.toLowerCase() !== customerName.toLowerCase()
  ), [pendingOrders, customerName]);
  
  // Sort orders by created_at (terbaru dulu) - gunakan orderSummaries untuk real-time
  const sortedOrders = useMemo(() => [...orderSummaries].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ), [orderSummaries]);
  
  // Cek apakah customer punya pesanan BELUM_BAYAR
  const customerPendingPayments = useMemo(() => sortedOrders.filter(o => 
    o.customer_name.toLowerCase() === customerName.toLowerCase() &&
    (o.payment_status === 'BELUM_BAYAR' || o.payment_status === undefined || o.payment_status === null)
  ), [sortedOrders, customerName]);
  
  // Cari SEMUA pesanan customer yang SUDAH_BAYAR dan aktif
  const customerActiveOrders = useMemo(() => sortedOrders.filter(o => 
    o.customer_name.toLowerCase() === customerName.toLowerCase() &&
    o.payment_status === 'SUDAH_BAYAR' &&
    o.status !== 'SELESAI' && 
    o.status !== 'DIBATALKAN'
  ), [sortedOrders, customerName]);
  
  // Untuk backward compatibility - pesanan pertama yang akan ditampilkan di card utama
  const customerPendingPayment = customerPendingPayments[0];
  const customerActiveOrder = customerActiveOrders[0];

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'BARU': return 25;
      case 'DIPROSES': return 50;
      case 'SIAP': return 100;
      case 'SELESAI': return 100;
      default: return 0;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === 'BARU') return 'bg-blue-500';
    if (normalizedStatus === 'DIPROSES') return 'bg-orange-500';
    if (normalizedStatus === 'SIAP') return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === 'BARU') return 'MENUNGGU';
    if (normalizedStatus === 'DIPROSES') return 'DIPROSES';
    if (normalizedStatus === 'SIAP') return 'SIAP DIAMBIL';
    return normalizedStatus;
  };

  // Warna card berdasarkan status
  const getStatusColors = (status: string) => {
    // Normalize status - handle "SIAP" or "SIAP DIAMBIL"
    const normalizedStatus = status?.toUpperCase().trim();
    
    if (normalizedStatus === 'BARU') {
      return {
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        shadow: '0 6px 0 0 #1E40AF',
        badge: 'bg-blue-400/30 border-blue-300/50',
        text: 'text-blue-100',
        progress: 'bg-white'
      };
    } else if (normalizedStatus === 'DIPROSES') {
      return {
        bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
        shadow: '0 6px 0 0 #C2410C',
        badge: 'bg-orange-400/30 border-orange-300/50',
        text: 'text-orange-100',
        progress: 'bg-white'
      };
    } else if (normalizedStatus === 'SIAP' || normalizedStatus?.includes('SIAP')) {
      return {
        bg: 'bg-gradient-to-br from-green-500 to-green-600',
        shadow: '0 6px 0 0 #15803D',
        badge: 'bg-green-400/30 border-green-300/50',
        text: 'text-green-100',
        progress: 'bg-white'
      };
    } else {
      return {
        bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
        shadow: '0 6px 0 0 #374151',
        badge: 'bg-gray-400/30 border-gray-300/50',
        text: 'text-gray-100',
        progress: 'bg-white'
      };
    }
  };

  // Fungsi untuk update metode pembayaran dan ke halaman detail
  const handleUpdatePaymentMethod = async (method: PaymentMethod) => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: method })
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      
      // Simpan ke localStorage untuk recovery
      localStorage.setItem('lastOrderId', String(selectedOrder.id));
      localStorage.setItem('lastPaymentMethod', method);
      
      // Tutup modal dan navigate ke halaman payment dengan metode yang dipilih
      setShowPaymentModal(false);
      setSelectedOrder(null);
      
      // Navigate ke payment screen dengan order dan metode yang dipilih
      navigate('/payment', { 
        state: { 
          order: { ...selectedOrder, payment_method: method },
          paymentMethod: method
        } 
      });
    } catch (err) {
      console.error('Error updating payment method:', err);
      alert('Gagal mengubah metode pembayaran');
      setIsUpdating(false);
    }
  };
  
  // Fungsi untuk langsung ke halaman payment jika sudah punya metode
  const handleGoToPayment = (order: import('@/lib/supabase').OrderSummary) => {
    if (order.payment_method) {
      // Sudah punya metode, langsung ke payment screen
      localStorage.setItem('lastOrderId', String(order.id));
      localStorage.setItem('lastPaymentMethod', order.payment_method);
      
      navigate('/payment', { 
        state: { 
          order,
          paymentMethod: order.payment_method
        } 
      });
    } else {
      // Belum punya metode, buka modal pilih metode
      setSelectedOrder(order);
      setShowPaymentModal(true);
    }
  };

  const handleOpenOrderDetail = async (order: import('@/lib/supabase').OrderSummary) => {
    setDetailOrder(order);
    setShowDetailModal(true);
    setLoadingDetailItems(true);

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) throw error;
      setDetailItems((data as OrderItem[]) || []);
    } catch (err) {
      console.error('Error fetching order detail items:', err);
      setDetailItems([]);
    } finally {
      setLoadingDetailItems(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setShowDetailModal(false);
    setDetailOrder(null);
    setDetailItems([]);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Antrian" backTo="/menu" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CustomerNavbar3D 
        title="Antrian"
        backTo="/menu"
        rightIcon={
          <motion.button
            onClick={() => window.location.reload()}
            className="w-full h-full flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </motion.button>
        }
      />

      <main className="px-5 py-4">
        {/* Card untuk pesanan BELUM_BAYAR - bisa diklik untuk lanjut bayar */}
        <AnimatePresence>
          {customerPendingPayment && (
            <motion.div 
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-white mb-6 cursor-pointer"
              style={{ boxShadow: '0 4px 0 0 #DC2626, 0 8px 24px rgba(239, 68, 68, 0.4)' }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 2 }}
              onClick={() => handleGoToPayment(customerPendingPayment)}
            >
              {/* Credit Card Style Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Nama</p>
                  <p className="text-white font-bold text-lg">{customerPendingPayment.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">No. Pesanan</p>
                  <p className="text-white font-mono text-xs">{customerPendingPayment.order_number}</p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-white/20 my-3"></div>
              
              {/* Queue Number & Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-black/20 rounded-full px-4 py-1.5">
                  <span className="text-white text-xs font-bold">BELUM BAYAR</span>
                </div>
                <div 
                  className="bg-white rounded-xl flex items-center justify-center px-4 py-2"
                  style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.2)' }}
                >
                  <span className="text-base font-bold text-red-600">No. {customerPendingPayment.queue_number}</span>
                </div>
              </div>
              
              {/* Metode Pembayaran */}
              {customerPendingPayment.payment_method && (
                <div className="bg-white/10 rounded-xl p-3 mb-4">
                  <p className="text-white/60 text-xs mb-1.5">Metode Pembayaran</p>
                  <div className="flex items-center gap-2 text-white">
                    {customerPendingPayment.payment_method === 'CASH' ? (
                      <>
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">Bayar di Kasir</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">Scan QRIS</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div 
                className="bg-white rounded-xl p-3 flex items-center justify-between mb-4"
                style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.2)' }}
              >
                <div>
                  <p className="text-red-500 text-xs font-medium">Status</p>
                  <p className="text-base font-bold text-red-600">
                    {customerPendingPayment.payment_method ? 'Siap Bayar' : 'Pilih Metode'}
                  </p>
                </div>
                <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
              
              {/* Tombol Cek Detail Pesanan */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenOrderDetail(customerPendingPayment);
                }}
                className="w-full py-3 bg-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.1)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
              >
                <ClipboardList className="w-4 h-4" />
                Cek Detail Pesanan
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Progress Cards - untuk SEMUA pesanan SUDAH_BAYAR */}
        <AnimatePresence>
          {customerActiveOrders.length > 0 && customerPendingPayments.length === 0 && (
            <div className="space-y-4 mb-6">
              {customerActiveOrders.map((order, index) => (
                <motion.div 
                  key={order.id}
                  className={`${getStatusColors(order.status).bg} rounded-3xl p-6 text-white`}
                  style={{ boxShadow: getStatusColors(order.status).shadow }}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Credit Card Style Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Nama</p>
                      <p className="text-white font-bold text-lg">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">No. Pesanan</p>
                      <p className="text-white font-mono text-xs">{order.order_number}</p>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-white/20 my-3"></div>
                  
                  {/* Queue Number & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-black/20 rounded-full px-4 py-1.5">
                      <span className="text-white text-xs font-bold">✓ SUDAH BAYAR</span>
                    </div>
                    <div 
                      className="bg-white rounded-xl flex items-center justify-center px-4 py-2"
                      style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.2)' }}
                    >
                      <span className="text-base font-bold text-gray-800">No. {order.queue_number}</span>
                    </div>
                  </div>
                  
                  {/* Status Box */}
                  <div 
                    className="bg-white rounded-xl p-3 mb-4 flex items-center justify-between"
                    style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.1)' }}
                  >
                    <div>
                      <p className={`text-xs font-medium ${
                        order.status === 'BARU' ? 'text-blue-600' :
                        order.status === 'DIPROSES' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>Status</p>
                      <p className={`text-base font-bold ${
                        order.status === 'BARU' ? 'text-blue-600' :
                        order.status === 'DIPROSES' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {order.status === 'BARU' && 'Menunggu'}
                        {order.status === 'DIPROSES' && 'Diproses'}
                        {order.status === 'SIAP' && 'Siap Diambil'}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'BARU' ? 'bg-blue-500' :
                      order.status === 'DIPROSES' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}>
                      <span className="text-sm font-bold text-white">{getProgressValue(order.status)}%</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${getProgressValue(order.status)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Jika customer lain ada yang menunggu pembayaran (untuk info saja) */}
        {pendingPaymentOrders.length > 0 && !customerPendingPayment && (
          <motion.div 
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6"
            style={{ boxShadow: card3D }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800">Menunggu Pembayaran</h3>
                <p className="text-sm text-amber-600">{pendingPaymentOrders.length} pesanan belum dibayar</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Pesanan akan masuk antrian setelah pembayaran dikonfirmasi
            </p>
          </motion.div>
        )}

        {/* Jika tidak ada pesanan aktif dan tidak ada yang menunggu pembayaran */}
        {!customerActiveOrder && !customerPendingPayment && (
          <motion.div 
            className="bg-white rounded-2xl p-6 text-center mb-6"
            style={{ boxShadow: card3D }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Tidak Ada Pesanan Aktif</h3>
            <p className="text-sm text-gray-500 mb-4">Pesanan {customerName} sudah selesai atau belum ada</p>
            <motion.button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
              style={{ boxShadow: button3D }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 4 }}
            >
              Pesan Sekarang
            </motion.button>
          </motion.div>
        )}

        {/* Live Queue Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Antrian Live</h2>
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-gray-500">UPDATING</span>
              {/* Tombol Refresh */}
              <motion.button
                onClick={() => { console.log('[QueueScreen] Refresh clicked'); refetch(); }}
                disabled={loading}
                className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center disabled:opacity-50"
                whileHover={{ scale: loading ? 1 : 1.1 }}
                whileTap={{ scale: loading ? 1 : 0.9 }}
              >
                <RefreshCw className={`w-4 h-4 text-orange-600 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          <div>
            {/* Ready Section - SELALU RENDER tapi hidden jika kosong */}
            <div 
              className="mb-4"
              style={{ display: readyOrders.length > 0 ? 'block' : 'none' }}
            >
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                SIAP DIAMBIL ({readyOrders.length})
              </h3>
              <div className="space-y-2">
                {readyOrders.map((order, index) => (
                  <motion.div 
                    key={order.id}
                    className="flex items-center justify-between bg-white rounded-2xl p-4"
                    style={{ boxShadow: card3D }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600"
                        style={{ boxShadow: '0 2px 0 0 #16A34A' }}
                      >
                        {order.queue_number}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{order.customer_name}</span>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white border-0" style={{ boxShadow: '0 2px 0 0 #16A34A' }}>
                      READY
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Processing Section - SELALU RENDER tapi hidden jika kosong */}
            <div 
              className="mb-4"
              style={{ display: processingOrders.length > 0 ? 'block' : 'none' }}
            >
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                SEDANG DIPROSES ({processingOrders.length})
              </h3>
              <div className="space-y-2">
                {processingOrders.map((order, index) => (
                  <motion.div 
                    key={order.id}
                    className={`rounded-2xl p-4 ${
                      order.id === customerActiveOrder?.id 
                        ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300' 
                        : 'bg-white'
                    }`}
                    style={{ boxShadow: order.id === customerActiveOrder?.id ? button3D : card3D }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                order.id === customerActiveOrder?.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                              }`}
                              style={order.id === customerActiveOrder?.id ? { boxShadow: '0 2px 0 0 #C2410C' } : {}}
                            >
                              {order.queue_number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{order.customer_name}</span>
                                {order.id === customerActiveOrder?.id && (
                                  <Badge className="bg-orange-500 text-white text-xs border-0" style={{ boxShadow: '0 2px 0 0 #C2410C' }}>
                                    PESANAN KAMU
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-orange-500 text-white border-0" style={{ boxShadow: '0 2px 0 0 #C2410C' }}>
                            DIPROSES
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
            </div>

            {/* Pending Section - SELALU RENDER tapi hidden jika kosong */}
            <div 
              className="mb-4"
              style={{ display: pendingOrders.length > 0 ? 'block' : 'none' }}
            >
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    MENUNGGU ({pendingOrders.length})
                  </h3>
                  <div className="space-y-2">
                    {/* Pesanan customer selalu di atas jika ada */}
                    {customerPendingOrder && (
                      <motion.div 
                        key={customerPendingOrder.id}
                        className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-4"
                        style={{ boxShadow: button3D }}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ boxShadow: '0 2px 0 0 #C2410C' }}
                          >
                            {customerPendingOrder.queue_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{customerPendingOrder.customer_name}</span>
                              <Badge className="bg-orange-500 text-white text-xs border-0" style={{ boxShadow: '0 2px 0 0 #C2410C' }}>
                                KAMU
                              </Badge>
                            </div>
                            <p className="text-xs text-orange-600 font-medium">Posisi #{pendingOrders.findIndex(o => o.id === customerPendingOrder.id) + 1}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-500 text-white border-0" style={{ boxShadow: '0 2px 0 0 #C2410C' }}>
                          MENUNGGU
                        </Badge>
                      </motion.div>
                    )}
                    
                    {/* Pesanan lainnya */}
                    {otherPendingOrders.slice(0, customerPendingOrder ? 2 : 3).map((order, index) => (
                      <motion.div 
                        key={order.id}
                        className="flex items-center justify-between bg-white rounded-2xl p-4 opacity-60"
                        style={{ boxShadow: card3D }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.6, x: 0 }}
                        transition={{ delay: (customerPendingOrder ? index + 1 : index) * 0.1 }}
                        whileHover={{ scale: 1.02, opacity: 1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center" style={{ boxShadow: '0 2px 0 0 #9CA3AF' }}>
                            <span className="font-bold text-gray-500">{order.queue_number}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{order.customer_name}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-gray-400 border-gray-300">
                          #{order.queue_number}
                        </Badge>
                      </motion.div>
                    ))}
                    
                    {/* Info lebih banyak */}
                    {(customerPendingOrder ? otherPendingOrders.length > 2 : pendingOrders.length > 3) && (
                      <p className="text-center text-sm text-gray-400 py-2">
                        + {(customerPendingOrder ? otherPendingOrders.length - 2 : pendingOrders.length - 3)} LAINNYA DALAM ANTRIAN
                      </p>
                    )}
                  </div>
            </div>

            {/* Tidak ada antrian */}
            {readyOrders.length === 0 && processingOrders.length === 0 && pendingOrders.length === 0 && (
              <motion.div 
                className="text-center py-8"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Tidak ada antrian saat ini</p>
              </motion.div>
            )}
          </div>
      </main>

      {/* Modal Detail Pesanan (langsung di halaman antrian) */}
      <AnimatePresence>
        {showDetailModal && detailOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={handleCloseOrderDetail}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
                <div>
                  <p className="text-xs text-orange-500 font-medium">ORDER #{detailOrder.order_number}</p>
                  <h3 className="text-lg font-bold text-gray-800">Detail Pesanan</h3>
                </div>
                <button
                  onClick={handleCloseOrderDetail}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getStatusBadgeClass(detailOrder.status)} text-white px-3 py-1`}>
                    {getStatusLabel(detailOrder.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">Antrian #{detailOrder.queue_number}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Dipesan</h4>
                  {loadingDetailItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  ) : detailItems.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Tidak ada detail item</p>
                  ) : (
                    <div className="space-y-3">
                      {detailItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-bold text-sm">{item.quantity}x</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.notes && <p className="text-xs text-gray-500">Catatan: {item.notes}</p>}
                          </div>
                          <p className="text-sm font-medium text-gray-600">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl p-4 mb-4 ${
                    detailOrder.payment_status === 'SUDAH_BAYAR'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {detailOrder.payment_status === 'SUDAH_BAYAR' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        detailOrder.payment_status === 'SUDAH_BAYAR' ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {detailOrder.payment_status === 'SUDAH_BAYAR' ? 'SUDAH BAYAR' : 'BELUM BAYAR'}
                    </span>
                  </div>
                  {detailOrder.payment_method && (
                    <p className="text-sm text-gray-600 ml-7">Metode: {detailOrder.payment_method}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span>Rp {(detailOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Pajak (10%)</span>
                    <span>Rp {(detailOrder.tax_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-xl text-orange-600">
                      Rp {detailOrder.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseOrderDetail}
                  className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ganti Metode Pembayaran */}
      <AnimatePresence>
        {showPaymentModal && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => !isUpdating && setShowPaymentModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
            >
              {/* Close Button */}
              <button
                onClick={() => !isUpdating && setShowPaymentModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                disabled={isUpdating}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Pilih Metode Pembayaran</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No Antrian: #{selectedOrder.queue_number}
                </p>
              </div>

              <div className="space-y-3">
                {/* CASH Option */}
                <motion.button
                  onClick={() => handleUpdatePaymentMethod('CASH')}
                  disabled={isUpdating || selectedOrder.payment_method === 'CASH'}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedOrder.payment_method === 'CASH'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  } ${isUpdating ? 'opacity-50' : ''}`}
                  whileHover={!isUpdating ? { scale: 1.02 } : {}}
                  whileTap={!isUpdating ? { scale: 0.98 } : {}}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedOrder.payment_method === 'CASH' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      selectedOrder.payment_method === 'CASH' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold ${
                      selectedOrder.payment_method === 'CASH' ? 'text-orange-600' : 'text-gray-800'
                    }`}>Bayar di Kasir (Cash)</p>
                    <p className="text-xs text-gray-500">Tunai / Kartu / E-Wallet</p>
                  </div>
                  {selectedOrder.payment_method === 'CASH' && (
                    <CheckCircle2 className="w-6 h-6 text-orange-500" />
                  )}
                </motion.button>

                {/* QRIS Option */}
                <motion.button
                  onClick={() => handleUpdatePaymentMethod('QRIS')}
                  disabled={isUpdating || selectedOrder.payment_method === 'QRIS'}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedOrder.payment_method === 'QRIS'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  } ${isUpdating ? 'opacity-50' : ''}`}
                  whileHover={!isUpdating ? { scale: 1.02 } : {}}
                  whileTap={!isUpdating ? { scale: 0.98 } : {}}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedOrder.payment_method === 'QRIS' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <QrCode className={`w-6 h-6 ${
                      selectedOrder.payment_method === 'QRIS' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold ${
                      selectedOrder.payment_method === 'QRIS' ? 'text-orange-600' : 'text-gray-800'
                    }`}>Scan QRIS</p>
                    <p className="text-xs text-gray-500">Scan QR di kasir/tenant</p>
                  </div>
                  {selectedOrder.payment_method === 'QRIS' && (
                    <CheckCircle2 className="w-6 h-6 text-orange-500" />
                  )}
                </motion.button>
              </div>

              {isUpdating && (
                <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Menyimpan...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Footer */}
      <motion.div 
        className="mt-8 flex flex-col items-center pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 opacity-50">
          <img src="/kuramalogo.png" alt="KURAMA" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold tracking-wider text-gray-400">KURAMA</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">Terima kasih telah memesan</p>
      </motion.div>
    </motion.div>
  );
}
