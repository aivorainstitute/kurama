import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BarChart3, Menu, ImageOff, ChevronLeft, Loader2, Clock, Store, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { OrderSummary, Order } from '@/App';

const PLACEHOLDER_IMAGE = 'https://placehold.co/100x100/orange/white?text=Menu';

// 3D Shadow styles
const card3D = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.15)';
const button3D = '0 6px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)';
const button3DOrange = '0 4px 0 0 #FED7AA, 0 4px 8px rgba(249, 115, 22, 0.3)';

interface OrderDetailScreenProps {
  orders: OrderSummary[];
}

export default function OrderDetailScreen({ orders }: OrderDetailScreenProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<import('@/App').Order | null>(null);
  
  // Fetch order detail dari Supabase
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) return;
      
      setLoading(true);
      try {
        // Cari di props dulu
        const foundOrder = orders.find(o => o.id === Number(orderId));
        
        if (foundOrder && foundOrder.items && foundOrder.items.length > 0) {
          // Jika sudah ada items lengkap, gunakan itu
          setOrder(foundOrder);
        } else {
          // Fetch dari Supabase
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          
          if (orderError) throw orderError;
          
          if (orderData) {
            // Fetch items
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', orderId);
            
            if (itemsError) throw itemsError;
            
            setOrder({
              ...orderData,
              items: itemsData || []
            } as Order);
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [orderId, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <CustomerNavbar3D title="Detail Pesanan" backTo="/menu" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4" style={{ boxShadow: card3D }}>
            <span className="text-4xl">🔍</span>
          </div>
          <p className="text-gray-500">Pesanan tidak ditemukan</p>
          <motion.button 
            onClick={() => navigate('/menu')}
            className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-medium"
            style={{ boxShadow: button3D }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 4 }}
          >
            Kembali ke Menu
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header 3D */}
      <CustomerNavbar3D 
        title="Detail Pesanan"
        backTo="/menu"
      />

      <main className="px-4 py-4 space-y-4">
        {/* Customer Info Card - Consistent with CheckOrderScreen */}
        <motion.div 
          className="bg-white rounded-2xl p-5 border-l-4 border-orange-500"
          style={{ boxShadow: card3D }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 4px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95, y: 2 }}
            >
              <User className="w-7 h-7 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Pesanan atas nama</p>
              <h2 className="font-bold text-gray-800 text-lg">{order.customer_name}</h2>
            </div>
          </div>
        </motion.div>

        {/* Order Items - White with Blue Left Border */}
        <motion.div 
          className="bg-white rounded-2xl p-5 border-l-4 border-blue-500"
          style={{ boxShadow: card3D }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-blue-500 text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
            <Menu className="w-4 h-4" />
            Item Pesanan
          </h3>
          
          <div className="space-y-4">
            {order.items?.map((item: import('@/App').OrderItem, index: number) => (
              <motion.div 
                key={index} 
                className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <motion.div 
                  className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                >
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <ImageOff className="w-8 h-8 text-blue-300" />
                  )}
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.quantity}x Rp {item.unit_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="font-bold text-orange-600 whitespace-nowrap">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                  
                  {item.notes && (
                    <motion.div 
                      className="mt-2 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Menu className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-700">{item.notes}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {(!order.items || order.items.length === 0) && (
              <p className="text-center text-gray-400 py-4">Tidak ada item</p>
            )}
          </div>
        </motion.div>

        {/* Payment Summary - Green Gradient */}
        <motion.div 
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white"
          style={{ boxShadow: '0 6px 0 0 #059669, 0 8px 16px rgba(16, 185, 129, 0.4)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-emerald-100 text-xs uppercase tracking-wider font-bold mb-4 text-center flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Rincian Pembayaran
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-100">Subtotal</span>
              <span className="font-medium">Rp {order.subtotal?.toLocaleString('id-ID') || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-100">Tax (10%)</span>
              <span className="font-medium">Rp {order.tax_amount?.toLocaleString('id-ID') || 0}</span>
            </div>
            <div className="border-t border-white/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-100">TOTAL</span>
                <motion.span 
                  className="text-2xl font-bold"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  Rp {order.total_amount?.toLocaleString('id-ID') || 0}
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Actions */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-orange-100 p-5"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          onClick={() => navigate('/queue')}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 mb-3"
          style={{ boxShadow: button3D }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, y: 4 }}
        >
          <BarChart3 className="w-5 h-5" />
          Cek Antrian
        </motion.button>
        <motion.button
          onClick={() => navigate('/menu')}
          className="w-full h-14 bg-white border-2 border-orange-200 text-orange-600 font-semibold rounded-2xl flex items-center justify-center gap-2"
          style={{ boxShadow: button3DOrange }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, y: 4 }}
        >
          <ChevronLeft className="w-5 h-5" />
          KEMBALI KE MENU
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
