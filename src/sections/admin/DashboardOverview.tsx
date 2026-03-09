import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Package, 
  Settings, 
  User,
  ClipboardCheck,
  Loader2,
  TrendingUp,
  Users,
  ArrowRight,
  Power,
  LogOut,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Menu items configuration
const menuItems = [
  {
    id: 'orders',
    title: 'Pusat Pesanan',
    description: 'Kelola pesanan aktif',
    icon: ClipboardList,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    shadowColor: 'shadow-blue-200',
    path: '/admin/orders'
  },
  {
    id: 'stock',
    title: 'Pengelolaan Stok',
    description: 'Update stok menu',
    icon: Package,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    shadowColor: 'shadow-orange-200',
    path: '/admin/stock'
  },
  {
    id: 'categories',
    title: 'Kategori & Menu',
    description: 'Atur kategori dan item',
    icon: Settings,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    shadowColor: 'shadow-purple-200',
    path: '/admin/categories'
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17
    }
  },
  tap: { scale: 0.98 }
};

interface DashboardOverviewProps {
  onLogout?: () => void;
}

export default function DashboardOverview({ onLogout }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const { orderSummaries, activeOrders, todayOrders, loading, refetch } = useOrders();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const metrics = useMemo(() => {
    const totalRevenue = todayOrders
      .filter(o => o.status === 'SELESAI')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    const totalItems = todayOrders.reduce((sum, o) => sum + (o.item_count || 0), 0);
    
    return {
      totalRevenue,
      totalOrders: todayOrders.length,
      activeOrdersCount: activeOrders.length,
      totalItems
    };
  }, [todayOrders, activeOrders]);

  const recentOrders = useMemo(() => todayOrders.slice(0, 3), [todayOrders]);
  const pulseAnimation = {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.1, 0.3]
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      toast.success('Berhasil logout');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-8">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-6 text-white shadow-2xl"
      >
        {/* Brand Bar */}
        <motion.div 
          className="flex items-center justify-center mb-4 pb-3 border-b border-white/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="KURAMA" className="w-8 h-8 object-contain drop-shadow-md" />
            <span className="font-black text-xl tracking-wider">KURAMA</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-orange-100 text-sm">Selamat Pagi,</p>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-6 h-6" />
            </motion.div>
            <motion.button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <Power className="w-6 h-6" />
            </motion.button>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div 
          className="flex gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-orange-100 text-xs">Pendapatan Hari Ini</p>
            <p className="text-xl font-bold">Rp{metrics.totalRevenue.toLocaleString('id-ID')}</p>
          </motion.div>
          <motion.div 
            className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-orange-100 text-xs">Pesanan Aktif</p>
            <motion.p 
              className="text-xl font-bold"
              key={metrics.activeOrdersCount}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
            >
              {metrics.activeOrdersCount}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.header>

      <main className="px-5 py-6 -mt-4">
        {/* Menu Grid */}
        <motion.div 
          className="mb-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 
            className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4"
            variants={itemVariants}
          >
            MENU UTAMA
          </motion.h2>
          <div className="grid grid-cols-1 gap-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial="rest"
                  animate="rest"
                  onClick={() => navigate(item.path)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer ${item.shadowColor} transition-shadow duration-300`}
                  style={{
                    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 8px 16px -4px ${item.id === 'stock' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className={`w-7 h-7 ${item.textColor}`} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <motion.div 
                      className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center`}
                      whileHover={{ x: 5 }}
                    >
                      <ArrowRight className={`w-5 h-5 ${item.textColor}`} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Active Orders Alert */}
        <AnimatePresence>
          {metrics.activeOrdersCount > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <motion.div 
                onClick={() => navigate('/admin/orders')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-3d cursor-pointer relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated background pulse */}
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ClipboardList className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-orange-100 text-sm">Pesanan Perlu Diproses</p>
                      <motion.p 
                        className="text-white text-2xl font-bold"
                        key={metrics.activeOrdersCount}
                        initial={{ scale: 1.5, color: '#FEF3C7' }}
                        animate={{ scale: 1, color: '#FFFFFF' }}
                      >
                        {metrics.activeOrdersCount}
                      </motion.p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6 text-white/80" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Orders */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              PESANAN HARI INI
            </h2>
            <motion.button 
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-orange-600 font-medium hover:underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Lihat Semua
            </motion.button>
          </div>
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {recentOrders.map((order, index) => (
                <motion.div 
                  key={order.id}
                  variants={itemVariants}
                  layout
                  onClick={() => navigate('/admin/orders')}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow"
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.status === 'BARU' ? 'bg-blue-50' :
                        order.status === 'DIPROSES' ? 'bg-yellow-50' :
                        order.status === 'SIAP' ? 'bg-green-50' :
                        'bg-gray-50'
                      }`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ClipboardCheck className={`w-5 h-5 ${
                        order.status === 'BARU' ? 'text-blue-500' :
                        order.status === 'DIPROSES' ? 'text-yellow-500' :
                        order.status === 'SIAP' ? 'text-green-500' :
                        'text-gray-400'
                      }`} />
                    </motion.div>
                    <div>
                      <p className="font-medium text-gray-800">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        No Order: {order.order_number} • Antrian: #{order.queue_number} • {order.item_count} item
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-orange-600">
                      Rp{order.total_amount.toLocaleString('id-ID')}
                    </span>
                    <p className={`text-xs ${
                      order.status === 'BARU' ? 'text-blue-500' :
                      order.status === 'DIPROSES' ? 'text-yellow-500' :
                      order.status === 'SIAP' ? 'text-green-500' :
                      'text-gray-400'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {recentOrders.length === 0 && (
              <motion.div 
                className="text-center py-8 bg-white rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">Belum ada pesanan hari ini</p>
                <motion.button
                  onClick={refetch}
                  className="mt-3 flex items-center gap-2 mx-auto text-orange-600 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div 
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(34, 197, 94, 0.15)' }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3"
              whileHover={{ rotate: 15 }}
            >
              <TrendingUp className="w-5 h-5 text-green-600" />
            </motion.div>
            <p className="text-xs text-gray-500">Total Item Terjual</p>
            <motion.p 
              className="text-xl font-bold text-gray-800"
              key={metrics.totalItems}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {metrics.totalItems}
            </motion.p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(168, 85, 247, 0.15)' }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3"
              whileHover={{ rotate: 15 }}
            >
              <Users className="w-5 h-5 text-purple-600" />
            </motion.div>
            <p className="text-xs text-gray-500">Total Pelanggan</p>
            <motion.p 
              className="text-xl font-bold text-gray-800"
              key={todayOrders.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {todayOrders.length}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full mt-6 h-14 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <LogOut className="w-5 h-5" />
          KELUAR DARI ADMIN
        </motion.button>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div 
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <LogOut className="w-8 h-8 text-red-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                Konfirmasi Logout
              </h2>
              <p className="text-gray-500 text-center mb-6">
                Apakah Anda yakin ingin keluar dari panel admin?
              </p>
              <div className="space-y-3">
                <motion.button
                  onClick={handleLogout}
                  className="w-full h-12 bg-red-500 text-white font-semibold rounded-xl btn-3d"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ya, Keluar
                </motion.button>
                <motion.button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full h-12 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
