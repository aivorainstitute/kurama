import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  QrCode, 
  ChevronLeft,
  Store,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/App';

interface PaymentMethodScreenProps {
  activeOrder: Order | null;
}

export default function PaymentMethodScreen({ activeOrder }: PaymentMethodScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  // Get order from location state (passed from CartSheet) or use activeOrder
  const order = location.state?.order || activeOrder;
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Tidak ada pesanan aktif</p>
          <button 
            onClick={() => navigate('/menu')}
            className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-medium"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  // Simpan metode pembayaran ke database dan navigate
  const handleSelectMethod = async (method: 'CASH' | 'QRIS') => {
    setIsSaving(true);
    
    try {
      // Update payment_method di database
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: method })
        .eq('id', order.id);
      
      if (error) {
        console.error('Error saving payment method:', error);
        // Tetap lanjut meski error, kita bisa retry nanti
      }
      
      // Simpan order ID ke localStorage untuk recovery saat refresh
      localStorage.setItem('lastOrderId', order.id);
      localStorage.setItem('lastPaymentMethod', method);
      
      // Navigate ke payment screen
      navigate('/payment', { 
        state: { 
          order: { ...order, payment_method: method },
          paymentMethod: method 
        } 
      });
    } catch (err) {
      console.error('Error in handleSelectMethod:', err);
      // Tetap navigate meski error
      navigate('/payment', { 
        state: { 
          order,
          paymentMethod: method 
        } 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const paymentMethods = [
    {
      id: 'CASH' as const,
      title: 'Bayar di Kasir',
      subtitle: 'Tunai / Kartu / E-Wallet',
      icon: Store,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Bayar langsung di kasir KURAMA'
    },
    {
      id: 'QRIS' as const,
      title: 'Scan QRIS',
      subtitle: 'Scan QR Code',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Scan QRIS dengan aplikasi pembayaran Anda'
    }
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <CustomerNavbar3D 
        title="Metode Pembayaran"
        showBack={true}
        backTo="/cart"
      />

      <main className="px-5 py-6">
        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-orange-100 p-5 mb-6"
          style={{ boxShadow: '0 4px 0 0 #E4E4E7, 0 8px 16px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pembayaran</p>
              <p className="text-2xl font-bold text-orange-600">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="border-t border-orange-100 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nomor Antrian</span>
              <span className="font-bold text-orange-600">#{order.queue_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nama</span>
              <span className="font-medium">{order.customer_name}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Method Selection - Klik langsung pindah halaman */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Pilih Metode Pembayaran</h2>
          
          <div className="space-y-4">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              
              return (
                <motion.button
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id)}
                  disabled={isSaving}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="w-full p-5 rounded-2xl border-2 bg-white border-gray-200 hover:border-orange-300 text-left transition-all group disabled:opacity-50"
                  style={{
                    boxShadow: isSaving ? '0 2px 0 0 #E5E7EB' : '0 4px 0 0 #E5E7EB, 0 4px 12px rgba(0,0,0,0.05)'
                  }}
                  whileHover={!isSaving ? { 
                    scale: 1.02, 
                    boxShadow: '0 6px 0 0 #E4E4E7, 0 8px 20px rgba(0, 0, 0, 0.1)'
                  } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">{method.title}</h3>
                      <p className="text-sm text-gray-500">{method.subtitle}</p>
                      <p className="text-xs text-gray-400 mt-1">{method.description}</p>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}

