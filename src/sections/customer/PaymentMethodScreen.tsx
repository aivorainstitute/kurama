import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  QrCode, 
  ArrowRight, 
  ChevronLeft,
  Store,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { Order } from '@/App';

interface PaymentMethodScreenProps {
  activeOrder: Order | null;
}

export default function PaymentMethodScreen({ activeOrder }: PaymentMethodScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'QRIS' | null>(null);
  
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

  const handleContinue = () => {
    if (!selectedMethod) return;
    
    // Navigate to payment detail page with selected method
    navigate('/payment', { 
      state: { 
        order,
        paymentMethod: selectedMethod 
      } 
    });
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

      <main className="px-5 py-6 pb-40">
        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-orange-100 p-5 mb-6"
          style={{ boxShadow: '0 4px 0 0 #FED7AA, 0 8px 16px rgba(249, 115, 22, 0.1)' }}
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

        {/* Payment Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Pilih Metode Pembayaran</h2>
          
          <div className="space-y-4">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              const Icon = method.icon;
              
              return (
                <motion.button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                    isSelected 
                      ? `${method.bgColor} ${method.borderColor} border-2` 
                      : 'bg-white border-gray-200 hover:border-orange-200'
                  }`}
                  style={{
                    boxShadow: isSelected 
                      ? `0 4px 0 0 ${method.id === 'CASH' ? '#FED7AA' : '#BFDBFE'}, 0 8px 16px rgba(0,0,0,0.1)`
                      : '0 4px 0 0 #E5E7EB, 0 4px 12px rgba(0,0,0,0.05)'
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
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
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Tips Pembayaran</p>
              <p className="text-xs text-blue-600 mt-1">
                Pilih QRIS untuk pembayaran yang lebih cepat, atau bayar di kasir jika ingin menggunakan tunai.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Continue Button */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-5"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={handleContinue}
          disabled={!selectedMethod}
          className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            selectedMethod
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          style={{
            boxShadow: selectedMethod ? '0 6px 0 0 #C2410C, 0 8px 24px rgba(249, 115, 22, 0.4)' : 'none'
          }}
          whileHover={selectedMethod ? { scale: 1.02 } : {}}
          whileTap={selectedMethod ? { scale: 0.98, y: 4 } : {}}
        >
          Lanjutkan Pembayaran
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
