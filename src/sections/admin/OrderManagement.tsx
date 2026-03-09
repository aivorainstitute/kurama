import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  Bell,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Navbar3D } from '@/components/Navbar3D';
import { toast } from 'sonner';
import { useOrders } from '@/hooks/useOrders';
import type { OrderItem, OrderStatus } from '@/lib/supabase';

import { supabase } from '@/lib/supabase';

const tabs = ['Semua', 'Belum Bayar', 'Baru', 'Diproses', 'Siap'];



export default function OrderManagement() {
  const { orderSummaries, loading, error, getOrderItems, updateOrderStatus, refetch } = useOrders();
  const [activeTab, setActiveTab] = useState('Semua');
  const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({});
  const [updatingOrders, setUpdatingOrders] = useState<Record<number, boolean>>({});
  const [confirmingPayment, setConfirmingPayment] = useState<Record<number, boolean>>({});

  // Cek apakah kolom payment_status sudah ada di data (minimal 1 order punya payment_status)
  const hasPaymentColumn = orderSummaries.some(order => order.payment_status !== undefined);

  // Filter orders based on tab
  const filteredOrders = (activeTab === 'Semua' 
    ? orderSummaries 
    : orderSummaries.filter(order => {
        const isPaid = order.payment_status === 'SUDAH_BAYAR';
        const isUnpaid = order.payment_status === 'BELUM_BAYAR' || 
                         (order.payment_status === undefined && order.status === 'BARU'); // Default BELUM_BAYAR untuk BARU
        switch (activeTab) {
          case 'Belum Bayar': return isUnpaid && order.status !== 'SELESAI' && order.status !== 'DIBATALKAN';
          case 'Baru': return order.status === 'BARU' && isPaid;
          case 'Diproses': return order.status === 'DIPROSES';
          case 'Siap': return order.status === 'SIAP';
          default: return true;
        }
      })
  ).sort((a, b) => {
    // Prioritaskan pesanan aktif (BARU, DIPROSES, SIAP) di atas
    // SELESAI dan DIBATALKAN di bawah
    const aIsDone = a.status === 'SELESAI' || a.status === 'DIBATALKAN';
    const bIsDone = b.status === 'SELESAI' || b.status === 'DIBATALKAN';
    
    if (aIsDone && !bIsDone) return 1;  // a selesai, b aktif -> a di bawah
    if (!aIsDone && bIsDone) return -1; // a aktif, b selesai -> a di atas
    
    // Jika sama-sama aktif atau sama-sama selesai, urutkan berdasarkan waktu
    // Pesanan lebih baru di atas untuk yang aktif
    // Pesanan lebih lama di bawah untuk yang selesai
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });



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
  }, [orderSummaries, activeTab]);

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

  const handleStatusUpdate = async (orderId: number, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      // Set loading state untuk order ini
      setUpdatingOrders(prev => ({ ...prev, [orderId]: true }));
      
      const result = await updateOrderStatus(orderId, nextStatus);
      
      // Clear loading state
      setUpdatingOrders(prev => ({ ...prev, [orderId]: false }));
      
      if (result.success) {
        toast.success(`Status pesanan diupdate ke ${getStatusLabel(nextStatus)}`);
      } else {
        toast.error('Gagal update status: ' + result.error);
      }
    }
  };

  const handlePaymentConfirm = async (orderId: number) => {
    // Set loading state
    setConfirmingPayment(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'SUDAH_BAYAR',
          payment_method: 'CASH' // Default, bisa diupdate nanti
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Pembayaran dikonfirmasi!');
      refetch();
    } catch (err: any) {
      toast.error('Gagal konfirmasi pembayaran: ' + err.message);
    } finally {
      // Clear loading state
      setConfirmingPayment(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar3D title="Pusat Pesanan" />
        <div className="px-5">
          {/* Filter tabs skeleton */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          {/* Order cards skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-20 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <motion.button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            Coba Lagi
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header 3D */}
      <Navbar3D 
        title="Pusat Pesanan"
        rightContent={
          <motion.button 
            onClick={() => { console.log('[OrderManagement] Refresh clicked'); refetch(); }}
            disabled={loading}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 disabled:opacity-50"
            whileHover={{ scale: loading ? 1 : 1.1, rotate: loading ? 0 : 180 }}
            whileTap={{ scale: loading ? 1 : 0.9 }}
            style={{
              boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        }
      />
      
      <main className="px-5 py-4 pb-6">
        {/* Notice jika kolom payment_status belum ada */}
        {!hasPaymentColumn && (
          <motion.div 
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 mb-1">Fitur Pembayaran Belum Aktif</p>
              <p className="text-sm text-amber-700">
                Jalankan SQL di Supabase Dashboard untuk mengaktifkan fitur pembayaran.
                <br />
                File: <code>supabase-add-payment-status.sql</code>
              </p>
            </div>
          </motion.div>
        )}
        {/* Active Orders Badge -->
        <motion.div 
          className="flex items-center gap-2 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm text-gray-600">{activeOrdersCount} Pesanan Aktif</span>
          <span className="text-xs text-gray-400">({orderSummaries.length} hari ini)</span>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          className="flex gap-2 overflow-x-auto no-scrollbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {tabs.map((tab, _index) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {tab}
            </motion.button>
          ))}
        </motion.div>

        {/* Orders List */}
        <div className="space-y-4 mt-4">
          {filteredOrders.map((order, index) => (
            <motion.div 
              key={order.id}
              className="bg-white rounded-2xl overflow-hidden shadow-card"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)'
              }}
              whileHover={{ scale: 1.01 }}
              >
                {/* Order Header - No Order Number Bar */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-2 border-b border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-700">{order.order_number}</span>
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
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                          <span className="text-orange-600 font-medium">Antrian #{order.queue_number}</span>
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
                        <span className="w-6 h-6 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
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
                  <span className="text-sm text-gray-500">Total ({order.item_count} item)</span>
                  <span className="font-semibold text-orange-600">
                    Rp{order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Payment Status Badge - Hanya tampil jika kolom payment_status ada */}
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
                {/* Action Buttons */}
                <div className="px-4 pb-4 space-y-2">
                  {/* Tombol Konfirmasi Pembayaran - muncul untuk pesanan BARU yang belum/belum jelas status bayar */}
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
                  
                  {/* Tombol Update Status - muncul jika sudah bayar atau status bukan BARU */}
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
            ))}
          
          {filteredOrders.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-gray-400">Tidak ada pesanan</p>
              <motion.button
                onClick={refetch}
                className="mt-4 text-orange-600 font-medium flex items-center justify-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </motion.button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
