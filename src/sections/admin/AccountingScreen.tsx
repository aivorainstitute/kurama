import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  PieChart,
  Download,
  ChevronDown,
  Coffee,
  ShoppingBag,
  Users,
  Clock,
  Filter
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useMemo, useState } from 'react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import { supabase } from '@/lib/supabase';

type PeriodType = 'hari' | 'minggu' | 'bulan';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  hourlySales: Array<{
    hour: string;
    orders: number;
    revenue: number;
  }>;
}

export default function AccountingScreen() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('hari');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const { orderSummaries, loading } = useOrders();

  // Filter orders berdasarkan periode
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orderSummaries.filter(order => {
      const orderDate = new Date(order.created_at);
      
      switch (period) {
        case 'hari':
          return orderDate >= today;
        case 'minggu':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        case 'bulan':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [orderSummaries, period]);

  // Hitung data akuntansi
  const salesData: SalesData = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => o.status === 'SELESAI');
    
    // Total revenue
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    
    // Total orders
    const totalOrders = completedOrders.length;
    
    // Total items
    const totalItems = completedOrders.reduce((sum, o) => sum + (o.item_count || 0), 0);
    
    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products (dummy data - perlu fetch dari order_items)
    const topProducts = [
      { name: 'Iced Caramel Latte', quantity: 45, revenue: 1575000 },
      { name: 'Iced Vanilla Latte', quantity: 38, revenue: 1710000 },
      { name: 'Iced Coffee Milk', quantity: 32, revenue: 960000 },
      { name: 'Iced Hazelnut Latte', quantity: 28, revenue: 1540000 },
      { name: 'Iced Brown Sugar Latte', quantity: 25, revenue: 550000 },
    ];

    // Sales by category
    const salesByCategory = [
      { category: 'Coffee', revenue: totalRevenue * 0.65, percentage: 65 },
      { category: 'Non-Coffee', revenue: totalRevenue * 0.25, percentage: 25 },
      { category: 'Food', revenue: totalRevenue * 0.10, percentage: 10 },
    ];

    // Hourly sales (dummy data)
    const hourlySales = [
      { hour: '08:00', orders: 5, revenue: 175000 },
      { hour: '10:00', orders: 12, revenue: 420000 },
      { hour: '12:00', orders: 18, revenue: 630000 },
      { hour: '14:00', orders: 15, revenue: 525000 },
      { hour: '16:00', orders: 20, revenue: 700000 },
      { hour: '18:00', orders: 14, revenue: 490000 },
      { hour: '20:00', orders: 8, revenue: 280000 },
    ];

    return {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      topProducts,
      salesByCategory,
      hourlySales,
    };
  }, [filteredOrders]);

  const periodLabels = {
    hari: 'Hari Ini',
    minggu: '7 Hari Terakhir',
    bulan: '30 Hari Terakhir',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <TrendingUp className="w-12 h-12 text-orange-500" />
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
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold">Akuntansi</h1>
            <p className="text-orange-100 text-sm">Laporan Penjualan & Analisis</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="relative">
          <motion.button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-4 h-4" />
            {periodLabels[period]}
            <ChevronDown className={`w-4 h-4 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showPeriodDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50"
              >
                {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                      period === p ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="px-5 py-6 space-y-6">
        {/* Summary Cards */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Total Revenue */}
          <motion.div 
            className="bg-white rounded-2xl p-4 border border-orange-100"
            style={{ boxShadow: '0 4px 0 0 #FED7AA, 0 4px 12px rgba(249, 115, 22, 0.1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Penjualan</p>
            <p className="text-xl font-bold text-gray-800">
              Rp {salesData.totalRevenue.toLocaleString('id-ID')}
            </p>
          </motion.div>

          {/* Total Orders */}
          <motion.div 
            className="bg-white rounded-2xl p-4 border border-blue-100"
            style={{ boxShadow: '0 4px 0 0 #BFDBFE, 0 4px 12px rgba(59, 130, 246, 0.1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Pesanan</p>
            <p className="text-xl font-bold text-gray-800">{salesData.totalOrders}</p>
          </motion.div>

          {/* Total Items */}
          <motion.div 
            className="bg-white rounded-2xl p-4 border border-green-100"
            style={{ boxShadow: '0 4px 0 0 #BBF7D0, 0 4px 12px rgba(34, 197, 94, 0.1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Item Terjual</p>
            <p className="text-xl font-bold text-gray-800">{salesData.totalItems}</p>
          </motion.div>

          {/* Average Order */}
          <motion.div 
            className="bg-white rounded-2xl p-4 border border-purple-100"
            style={{ boxShadow: '0 4px 0 0 #E9D5FF, 0 4px 12px rgba(168, 85, 247, 0.1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Rata-rata Pesanan</p>
            <p className="text-xl font-bold text-gray-800">
              Rp {Math.round(salesData.averageOrderValue).toLocaleString('id-ID')}
            </p>
          </motion.div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Produk Terlaris</h2>
              <p className="text-xs text-gray-500">5 produk dengan penjualan tertinggi</p>
            </div>
          </div>

          <div className="space-y-3">
            {salesData.topProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} terjual</p>
                </div>
                <p className="font-bold text-orange-600 text-sm">
                  Rp {product.revenue.toLocaleString('id-ID')}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Penjualan per Kategori</h2>
              <p className="text-xs text-gray-500">Distribusi penjualan berdasarkan kategori</p>
            </div>
          </div>

          <div className="space-y-4">
            {salesData.salesByCategory.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <span className="text-sm font-bold text-gray-800">
                    Rp {category.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-orange-500' :
                      index === 1 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{category.percentage}% dari total</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Hourly Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Penjualan per Jam</h2>
              <p className="text-xs text-gray-500">Grafik penjualan berdasarkan waktu</p>
            </div>
          </div>

          <div className="space-y-3">
            {salesData.hourlySales.map((hour, index) => (
              <motion.div
                key={hour.hour}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.03 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs font-medium text-gray-500 w-12">{hour.hour}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${(hour.revenue / 700000) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                    {hour.orders} order
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-600 w-20 text-right">
                  Rp {(hour.revenue / 1000).toFixed(0)}k
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Export Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold"
          style={{ boxShadow: '0 4px 0 0 #1F2937, 0 4px 12px rgba(0, 0, 0, 0.2)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, y: 2 }}
        >
          <Download className="w-5 h-5" />
          Export Laporan (CSV)
        </motion.button>
      </main>
    </div>
  );
}
