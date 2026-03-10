import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, History } from 'lucide-react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { OrderSummary } from '@/App';

interface OrderHistoryScreenProps {
  customerName: string;
  orders: OrderSummary[];
}

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

export default function OrderHistoryScreen({ customerName, orders }: OrderHistoryScreenProps) {
  const navigate = useNavigate();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header 3D */}
      <CustomerNavbar3D 
        title="Riwayat Pesanan"
        backTo="/menu"
      />
      
      <main className="px-5 py-4 pb-28">
        {orders.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <History className="w-10 h-10 text-orange-400" />
            </motion.div>
            <p className="text-gray-500">Belum ada riwayat pesanan</p>
            <motion.button 
              onClick={() => navigate('/menu')}
              className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-medium"
              style={{
                boxShadow: '0 6px 0 0 #18181B, 0 8px 16px rgba(0, 0, 0, 0.24)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 4 }}
            >
              Mulai Pesan
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {orders.map((order, _index) => (
              <motion.div
                key={order.id}
                variants={itemVariants}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-2xl p-4 cursor-pointer"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{formatDate(order.created_at)}</p>
                    <h3 className="font-semibold text-gray-800">Order #{order.order_number}</h3>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{order.items?.length || 0} item</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-orange-600">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-5"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <motion.button
          onClick={() => navigate('/menu')}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2"
          style={{
            boxShadow: '0 6px 0 0 #18181B, 0 8px 24px rgba(0, 0, 0, 0.24)'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, y: 4 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.div>
          Pesan Lagi
        </motion.button>
      </motion.div>

      {/* Brand Footer */}
      <motion.div 
        className="mt-8 flex flex-col items-center pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 opacity-50">
          <img src="/kuramalogo.png" alt="kur𝛂ma" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold tracking-wider text-gray-400">kur𝛂ma</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">Terima kasih telah memesan</p>
      </motion.div>
    </motion.div>
  );
}

