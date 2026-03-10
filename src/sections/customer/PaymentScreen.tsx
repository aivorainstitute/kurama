import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  CheckCircle2,
  Copy,
  Store,
  Wallet,
  QrCode,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { Order } from '@/App';

interface PaymentScreenProps {
  order: Order | null;
}

export default function PaymentScreen({ order }: PaymentScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>((location.state as any)?.order || order);
  const [selectedMethod, setSelectedMethod] = useState<string>((location.state as any)?.paymentMethod || orderData?.payment_method || 'CASH');
  const [isLoading, setIsLoading] = useState(!orderData);
  
  // Recover data dari localStorage atau fetch dari database saat refresh
  useEffect(() => {
    const recoverOrderData = async () => {
      // Jika sudah ada data dari navigation state, gunakan itu
      if (orderData) {
        setIsLoading(false);
        return;
      }
      
      // Coba recover dari localStorage
      const lastOrderId = localStorage.getItem('lastOrderId');
      const lastPaymentMethod = localStorage.getItem('lastPaymentMethod');
      
      if (lastOrderId) {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', lastOrderId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setOrderData(data as Order);
            // Prioritaskan payment_method dari database, fallback ke localStorage
            setSelectedMethod(data.payment_method || lastPaymentMethod || 'CASH');
          }
        } catch (err) {
          console.error('Error recovering order:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    recoverOrderData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat data pesanan...</p>
        </motion.div>
      </div>
    );
  }
  
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-12 h-12 text-orange-500" />
          </div>
          <p className="text-gray-500">Data pesanan tidak ditemukan</p>
          <motion.button 
            onClick={() => navigate('/menu')}
            className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium"
            style={{ boxShadow: '0 6px 0 0 #18181B' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 4 }}
          >
            Kembali ke Menu
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderData.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    
    // Refresh data order dari database
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderData.id)
        .single();
      
      if (error) throw error;
      
      // Navigate ke queue dengan data terbaru
      navigate('/queue');
    } catch (err) {
      console.error('Error checking status:', err);
      // Tetap navigate meskipun error
      navigate('/queue');
    } finally {
      setIsChecking(false);
    }
  };

  const isCash = selectedMethod === 'CASH';

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CustomerNavbar3D 
        title={isCash ? "Bayar di Kasir" : "Scan QRIS"}
        backTo="/queue"
      />

      <main className="px-5 py-4 space-y-5">
        {/* Order Info Card */}
        <motion.div 
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white"
          style={{ boxShadow: '0 8px 0 0 #18181B, 0 12px 32px rgba(0, 0, 0, 0.24)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Credit Card Style Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-orange-100 text-xs uppercase tracking-wider mb-1">Nama</p>
              <p className="text-white font-bold text-lg">{orderData.customer_name}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-xs uppercase tracking-wider mb-1">No. Pesanan</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{orderData.order_number}</span>
                <motion.button
                  onClick={handleCopyOrderNumber}
                  className="p-1.5 bg-white/20 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-white/20 pt-4">
            <div>
              <p className="text-orange-100 text-sm">Antrian</p>
              <p className="text-4xl font-bold">#{orderData.queue_number}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Total</p>
              <p className="text-2xl font-bold">
                Rp {orderData.total_amount?.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Metode Pembayaran yang Dipilih */}
        <motion.div 
          className={`rounded-2xl p-5 border-2 ${
            isCash 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-blue-50 border-blue-200'
          }`}
          style={{ 
            boxShadow: isCash 
              ? '0 4px 0 0 #52525B, 0 4px 12px rgba(0, 0, 0, 0.12)' 
              : '0 4px 0 0 #52525B, 0 4px 12px rgba(0, 0, 0, 0.12)' 
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCash ? 'bg-amber-500' : 'bg-blue-500'
            }`}>
              {isCash ? (
                <Wallet className="w-6 h-6 text-white" />
              ) : (
                <QrCode className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className={`font-bold ${isCash ? 'text-amber-800' : 'text-blue-800'}`}>
                {isCash ? 'Bayar di Kasir (Cash)' : 'Scan QRIS'}
              </p>
              <p className={`text-sm ${isCash ? 'text-amber-600' : 'text-blue-600'}`}>
                {isCash ? 'Tunai / Kartu / E-Wallet' : 'Scan QR Code'}
              </p>
            </div>
          </div>
          
          {/* Instruksi sesuai metode */}
          <div className="space-y-3">
            {isCash ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">1</span>
                  </div>
                  <p className="text-sm text-amber-800">Datangi kasir/tenant</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">2</span>
                  </div>
                  <p className="text-sm text-amber-800">Sebutkan/tunjukkan <strong>Nomor Pesanan</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">3</span>
                  </div>
                  <p className="text-sm text-amber-800">Lakukan pembayaran (tunai/kartu/e-wallet)</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">1</span>
                  </div>
                  <p className="text-sm text-blue-800">Buka aplikasi e-wallet (Gopay/OVO/Dana/LinkAja)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">2</span>
                  </div>
                  <p className="text-sm text-blue-800">Scan QRIS di kasir/tenant</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">3</span>
                  </div>
                  <p className="text-sm text-blue-800">Masukkan nominal dan konfirmasi pembayaran</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Info Penting */}
        <motion.div 
          className="bg-white rounded-2xl p-5 border border-gray-200"
          style={{ boxShadow: '0 4px 0 0 #E5E7EB, 0 4px 12px rgba(0,0,0,0.05)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            <strong>Catatan:</strong> Setelah pembayaran dikonfirmasi kasir, pesanan akan masuk ke antrian dan diproses.{' '}
            <span className="text-orange-600">Status pembayaran akan diperbarui otomatis.</span>
          </p>
        </motion.div>
      </main>

      {/* Bottom Action */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-5 space-y-3"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Tombol Cek Status Pembayaran */}
        <motion.button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ 
            boxShadow: !isChecking
              ? '0 6px 0 0 #3F3F46, 0 8px 24px rgba(0, 0, 0, 0.24)' 
              : '0 2px 0 0 #3F3F46' 
          }}
          whileHover={!isChecking ? { scale: 1.02 } : {}}
          whileTap={!isChecking ? { scale: 0.98, y: 4 } : {}}
        >
          {isChecking ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          {isChecking ? 'Mengecek...' : 'Cek Status Pembayaran'}
        </motion.button>

        {/* Tombol Kembali ke Antrian */}
        <motion.button
          onClick={() => navigate('/queue')}
          disabled={isChecking}
          className="w-full h-12 bg-gray-100 text-gray-700 text-base font-medium rounded-2xl flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, y: 2 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Antrian
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

