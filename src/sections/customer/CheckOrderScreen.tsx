import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, ClipboardList, ArrowRight, Search, X, Loader2, Edit3, ChevronRight, AlertCircle, CheckCircle2, RefreshCw, User, Printer } from 'lucide-react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { OrderSummary, OrderItem } from '@/App';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface CheckOrderScreenProps {
  orders: OrderSummary[];
  customerName: string;
}

const containerVariants = staggerContainer;
const itemVariants = fadeInUp;

export default function CheckOrderScreen({ orders: localOrders, customerName }: CheckOrderScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // State untuk modal detail pesanan
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Ambil data dari Supabase (real-time)
  const { orderSummaries, loading, error: _error, refetch } = useOrders();
  
  // Ambil nama dari state navigasi atau gunakan customerName
  const searchCustomerName = (location.state as any)?.searchName || customerName;
  
  // Filter orders by customer name dari Supabase
  const customerOrders = useMemo(() => {
    // Cari di orderSummaries dari Supabase (real-time)
    const supabaseOrders = orderSummaries.filter(order => 
      order.customer_name?.toLowerCase() === searchCustomerName.toLowerCase()
    );
    
    // Hapus duplikat berdasarkan order id
    const uniqueOrders = supabaseOrders.filter((order, index, self) => 
      index === self.findIndex((o) => o.id === order.id)
    );
    
    // Jika ada di Supabase, gunakan itu
    if (uniqueOrders.length > 0) {
      return uniqueOrders.map(summary => ({
        id: summary.id,
        order_number: summary.order_number,
        queue_number: summary.queue_number,
        status: summary.status,
        payment_status: summary.payment_status,
        payment_method: summary.payment_method,
        customer_name: summary.customer_name,
        items: [], // Items akan diisi terpisah jika perlu
        item_count: summary.item_count || 0, // Gunakan item_count dari summary
        subtotal: summary.subtotal,
        tax_amount: summary.tax_amount,
        total_amount: summary.total_amount,
        created_at: summary.created_at
      })) as any[];
    }
    
    // Fallback ke localStorage jika tidak ada di Supabase
    return localOrders.filter(order => 
      order.customer_name?.toLowerCase() === searchCustomerName.toLowerCase()
    );
  }, [orderSummaries, localOrders, searchCustomerName]);

  const activeOrders = customerOrders.filter(o => 
    o.status !== 'SELESAI' && o.status !== 'DIBATALKAN'
  );
  
  const completedOrders = customerOrders.filter(o => 
    o.status === 'SELESAI'
  );

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
      case 'SIAP': return 'SIAP DIAMBIL';
      case 'SELESAI': return 'SELESAI';
      default: return status;
    }
  };

  const handleSearch = () => {
    if (searchName.trim()) {
      navigate('/check-order', { state: { searchName: searchName.trim() } });
      setIsSearching(false);
      setSearchName('');
    }
  };

  // Fungsi untuk membuka modal detail pesanan
  const handleOpenDetail = async (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setLoadingItems(true);
    
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error) throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
      setOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Fungsi untuk menutup modal
  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  // Fungsi untuk edit pesanan - ke halaman edit order (biru)
  const handleEditOrder = () => {
    if (!selectedOrder) {
      toast.error('Tidak ada pesanan yang dipilih');
      return;
    }
    
    // Simpan data order ke localStorage untuk mode edit
    const editModeData = {
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.order_number,
      items: orderItems.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes,
        subtotal: item.subtotal
      })),
      subtotal: selectedOrder.subtotal,
      tax_amount: selectedOrder.tax_amount,
      total_amount: selectedOrder.total_amount
    };
    
    try {
      localStorage.setItem('editModeOrder', JSON.stringify(editModeData));
      console.log('Edit mode data saved:', editModeData);
      
      // Tutup modal dan navigate ke halaman edit (biru)
      setShowDetailModal(false);
      navigate('/edit-order');
    } catch (err) {
      console.error('Error saving edit mode data:', err);
      toast.error('Gagal menyimpan data');
    }
  };

  // Fungsi untuk cetak struk sebagai PNG (font monospace mesin tik)
  const handlePrintReceipt = async () => {
    if (!selectedOrder || orderItems.length === 0) {
      toast.error('Tidak ada data untuk dicetak');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ukuran struk 80mm thermal printer
      const width = 380;
      const padding = 15;
      const col1 = padding; // Label
      const col2 = 200; // Tengah (untuk @ harga)
      const col3 = width - padding; // Kanan (subtotal)
      
      // Hitung tinggi
      const lineHeight = 20;
      const itemSpacing = 40;
      const height = 550 + (orderItems.length * itemSpacing);

      canvas.width = width;
      canvas.height = height;

      // Background putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      let y = 35;

      // === HEADER ===
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Courier New';
      ctx.fillText('kur𝛂ma', width / 2, y);
      y += 24;
      
      ctx.font = '16px Courier New';
      ctx.fillText('Coffee', width / 2, y);
      y += 18;
      
      ctx.font = '11px Courier New';
      ctx.fillText('Brewed with passion, served with love', width / 2, y);
      y += 22;

      // Divider
      ctx.font = '12px Courier New';
      ctx.fillText('------------------------------------------', width / 2, y);
      y += 22;

      // === INFO ORDER ===
      ctx.textAlign = 'left';
      ctx.font = '12px Courier New';
      
      ctx.fillText(`Order    : #${selectedOrder.order_number}`, col1, y);
      y += lineHeight;
      ctx.fillText(`Antrian  : #${selectedOrder.queue_number}`, col1, y);
      y += lineHeight;
      ctx.fillText(`Nama     : ${selectedOrder.customer_name}`, col1, y);
      y += lineHeight;
      
      const dateStr = new Date(selectedOrder.created_at).toLocaleDateString('id-ID');
      const timeStr = new Date(selectedOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(`Tanggal  : ${dateStr} ${timeStr}`, col1, y);
      y += 26;

      // Divider
      ctx.textAlign = 'center';
      ctx.fillText('------------------------------------------', width / 2, y);
      y += 22;

      // === ITEMS ===
      orderItems.forEach((item) => {
        // Baris 1: Nama item (kiri) dan subtotal (kanan)
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px Courier New';
        const itemText = `${item.quantity}x ${item.name}`;
        const displayName = itemText.length > 25 ? itemText.substring(0, 25) : itemText;
        ctx.fillText(displayName, col1, y);
        
        // Subtotal di kanan
        ctx.textAlign = 'right';
        ctx.font = '12px Courier New';
        ctx.fillText(`Rp ${item.subtotal.toLocaleString('id-ID')}`, col3, y);
        y += 18;
        
        // Baris 2: Harga satuan (kiri, sedikit indent)
        ctx.textAlign = 'left';
        ctx.font = '11px Courier New';
        ctx.fillText(`  @ Rp ${item.unit_price.toLocaleString('id-ID')}`, col1, y);
        
        y += 24;
      });

      // Divider
      ctx.textAlign = 'center';
      ctx.font = '12px Courier New';
      ctx.fillText('------------------------------------------', width / 2, y);
      y += 24;

      // === TOTAL ===
      ctx.textAlign = 'left';
      ctx.font = '12px Courier New';
      ctx.fillText('Subtotal', col1, y);
      ctx.textAlign = 'right';
      ctx.fillText(`Rp ${(selectedOrder.subtotal || 0).toLocaleString('id-ID')}`, col3, y);
      y += lineHeight;

      ctx.textAlign = 'left';
      ctx.fillText('PPN (10%)', col1, y);
      ctx.textAlign = 'right';
      ctx.fillText(`Rp ${(selectedOrder.tax_amount || 0).toLocaleString('id-ID')}`, col3, y);
      y += lineHeight + 4;

      ctx.font = 'bold 13px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL', col1, y);
      ctx.textAlign = 'right';
      ctx.fillText(`Rp ${selectedOrder.total_amount.toLocaleString('id-ID')}`, col3, y);
      y += 26;

      // Divider
      ctx.textAlign = 'center';
      ctx.font = '12px Courier New';
      ctx.fillText('------------------------------------------', width / 2, y);
      y += 24;

      // === PAYMENT INFO ===
      ctx.textAlign = 'center';
      ctx.font = '12px Courier New';
      
      const paymentText = selectedOrder.payment_status === 'SUDAH_BAYAR' ? 'SUDAH BAYAR' : 'BELUM BAYAR';
      ctx.fillText(`Status : ${paymentText}`, width / 2, y);
      y += lineHeight;

      if (selectedOrder.payment_method) {
        ctx.fillText(`Metode : ${selectedOrder.payment_method}`, width / 2, y);
        y += lineHeight;
      }
      y += 18;

      // === FOOTER ===
      ctx.font = '11px Courier New';
      ctx.fillText('Terima kasih telah berkunjung', width / 2, y);
      y += lineHeight;
      ctx.fillText('ke kur𝛂ma Coffee', width / 2, y);
      y += lineHeight + 4;
      
      ctx.font = '10px Courier New';
      ctx.fillText('Simpan struk ini sebagai', width / 2, y);
      y += lineHeight - 2;
      ctx.fillText('bukti pembelian anda', width / 2, y);

      // Download PNG
      const link = document.createElement('a');
      link.download = `struk-${selectedOrder.order_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Struk berhasil dicetak!');
    } catch (err) {
      console.error('Error printing receipt:', err);
      toast.error('Gagal mencetak struk');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Cek Pesanan" backTo="/menu" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header 3D */}
      <CustomerNavbar3D 
        title="Cek Pesanan"
        backTo="/menu"
      />

      <main className="px-5 py-4 pb-6">
        {/* Customer Info Card */}
        <motion.div 
          className="bg-white rounded-2xl p-4 mb-4 border-l-4 border-orange-500"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 4px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)' }}
            >
              <User className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="text-sm text-gray-500">Pesanan atas nama</p>
              <h2 className="text-lg font-bold text-gray-800">{searchCustomerName}</h2>
            </div>
          </div>
        </motion.div>

        {/* Search Other Orders */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-4 mb-4"
              style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Masukkan nama lain..."
                    className="w-full h-12 pl-10 pr-4 bg-orange-50 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                    autoFocus
                  />
                </div>
                <motion.button
                  onClick={handleSearch}
                  disabled={!searchName.trim()}
                  className="h-12 px-4 bg-orange-500 text-white rounded-xl font-medium disabled:opacity-50"
                  style={{ boxShadow: '0 4px 0 0 #C2410C' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 4 }}
                >
                  Cari
                </motion.button>
                <motion.button
                  onClick={() => setIsSearching(false)}
                  className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearching(true)}
              className="w-full mb-4 h-12 border-2 border-dashed border-orange-300 text-orange-600 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-400 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Search className="w-4 h-4" />
              Cek Pesanan dengan Nama Lain
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {customerOrders.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              variants={itemVariants}
            >
              <motion.div 
                className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Package className="w-10 h-10 text-orange-400" />
              </motion.div>
              <p className="text-gray-500">Tidak ada pesanan ditemukan</p>
              <p className="text-sm text-gray-400 mt-1">untuk "{searchCustomerName}"</p>
              <motion.button
                onClick={refetch}
                className="mt-4 text-orange-600 font-medium flex items-center justify-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Active Orders */}
              {activeOrders.length > 0 && (
                <motion.div variants={itemVariants}>
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Pesanan Aktif ({activeOrders.length})
                  </h2>
                  <div className="space-y-3">
                    {activeOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleOpenDetail(order)}
                        className="bg-white rounded-2xl p-4 cursor-pointer border-l-4 border-blue-500"
                        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-orange-500 font-medium mb-1">
                              ORDER #{order.order_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-3">
                          {order.items?.length > 0 ? (
                            <>
                              {order.items.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {item.quantity}x
                                  </span>
                                  <span className="text-gray-700 flex-1">{item.name}</span>
                                  <span className="text-gray-500">
                                    Rp {item.subtotal.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                              {(order.items?.length || 0) > 3 && (
                                <p className="text-sm text-gray-400 pl-8">
                                  +{(order.items?.length || 0) - 3} item lainnya
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Package className="w-4 h-4" />
                              <span>{order.item_count || 0} item dipesan</span>
                            </div>
                          )}
                        </div>

                        {/* Total & Action */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <span className="text-sm text-gray-500">Total</span>
                            <p className="text-lg font-bold text-orange-600">
                              Rp {order.total_amount.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <motion.div 
                            className="flex items-center gap-2 text-orange-600 font-medium"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Clock className="w-4 h-4" />
                            Lihat Antrian
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <motion.div variants={itemVariants}>
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Riwayat Pesanan ({completedOrders.length})
                  </h2>
                  <div className="space-y-3">
                    {completedOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleOpenDetail(order)}
                        className="bg-gray-50 rounded-2xl p-4 cursor-pointer opacity-70 hover:opacity-100"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              #{order.order_number}
                            </p>
                            <p className="font-medium text-gray-700">
                              {order.item_count || order.items?.length || 0} item • Rp {order.total_amount.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Badge className="bg-gray-400 text-white">
                            SELESAI
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Back to Menu */}
        <motion.button
          onClick={() => navigate('/menu')}
          className="w-full mt-8 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
          style={{ boxShadow: '0 6px 0 0 #C2410C, 0 8px 24px rgba(249, 115, 22, 0.4)' }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 4 }}
        >
          Kembali ke Menu
        </motion.button>
      </main>

      {/* Modal Detail Pesanan */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={handleCloseDetail}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
                <div>
                  <p className="text-xs text-orange-500 font-medium">ORDER #{selectedOrder.order_number}</p>
                  <h3 className="text-lg font-bold text-gray-800">Detail Pesanan</h3>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-white px-3 py-1`}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Antrian #{selectedOrder.queue_number}
                  </span>
                </div>

                {/* Items List */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Dipesan</h4>
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">Tidak ada detail item</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-bold text-sm">{item.quantity}x</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.notes && (
                              <p className="text-xs text-gray-500">Catatan: {item.notes}</p>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-600">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Status */}
                <div className={`rounded-xl p-4 mb-4 ${
                  selectedOrder.payment_status === 'SUDAH_BAYAR' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedOrder.payment_status === 'SUDAH_BAYAR' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      selectedOrder.payment_status === 'SUDAH_BAYAR' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {selectedOrder.payment_status === 'SUDAH_BAYAR' ? 'SUDAH BAYAR' : 'BELUM BAYAR'}
                    </span>
                  </div>
                  {selectedOrder.payment_method && (
                    <p className="text-sm text-gray-600 ml-7">
                      Metode: {selectedOrder.payment_method}
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span>Rp {(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Pajak (10%)</span>
                    <span>Rp {(selectedOrder.tax_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-xl text-orange-600">
                      Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Tombol Edit - hanya untuk BELUM_BAYAR */}
                  {(selectedOrder.payment_status === 'BELUM_BAYAR' || 
                    selectedOrder.payment_status === undefined) && (
                    <motion.button
                      onClick={handleEditOrder}
                      className="w-full h-12 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                      style={{ boxShadow: '0 4px 0 0 #1D4ED8' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98, y: 2 }}
                    >
                      <Edit3 className="w-5 h-5" />
                      Edit Pesanan
                    </motion.button>
                  )}
                  
                  {/* Tombol Cetak Struk - hanya untuk SUDAH_BAYAR */}
                  {selectedOrder.payment_status === 'SUDAH_BAYAR' && (
                    <motion.button
                      onClick={handlePrintReceipt}
                      className="w-full h-12 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                      style={{ boxShadow: '0 4px 0 0 #16A34A' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98, y: 2 }}
                    >
                      <Printer className="w-5 h-5" />
                      Cetak Struk
                    </motion.button>
                  )}
                  
                  {/* Tombol Lihat Antrian */}
                  <motion.button
                    onClick={() => {
                      handleCloseDetail();
                      navigate('/queue');
                    }}
                    className="w-full h-12 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                    style={{ boxShadow: '0 4px 0 0 #C2410C' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98, y: 2 }}
                  >
                    <Clock className="w-5 h-5" />
                    Lihat Antrian
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                  
                  {/* Tombol Tutup */}
                  <button
                    onClick={handleCloseDetail}
                    className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
