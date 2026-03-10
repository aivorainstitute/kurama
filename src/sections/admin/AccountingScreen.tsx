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
  Loader2
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useEffect, useMemo, useState } from 'react';
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

interface OrderItemData {
  name: string;
  quantity: number;
  subtotal: number;
  order_id: number;
  created_at: string;
  order_status: string;
}

export default function AccountingScreen() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('hari');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const { orderSummaries, loading: loadingOrders } = useOrders();

  // Fetch order items dengan join ke orders untuk dapat status
  useEffect(() => {
    const fetchOrderItems = async () => {
      setLoadingItems(true);
      try {
        // Ambil order_items dengan join ke orders
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            name, 
            quantity, 
            subtotal, 
            order_id, 
            created_at,
            orders!inner(status)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data untuk mendapatkan order_status
        const transformedData = (data || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          subtotal: item.subtotal,
          order_id: item.order_id,
          created_at: item.created_at,
          order_status: item.orders?.status || 'BARU'
        }));
        
        setOrderItems(transformedData);
      } catch (err) {
        console.error('Error fetching order items:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchOrderItems();
  }, []);

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

  // Filter order items berdasarkan periode DAN hanya yang SELESAI
  const filteredOrderItems = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orderItems.filter(item => {
      // Hanya ambil item dari order yang SELESAI
      if (item.order_status !== 'SELESAI') return false;
      
      const itemDate = new Date(item.created_at);
      
      switch (period) {
        case 'hari':
          return itemDate >= today;
        case 'minggu':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return itemDate >= weekAgo;
        case 'bulan':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [orderItems, period]);

  // Hitung data akuntansi real
  const salesData: SalesData = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => o.status === 'SELESAI');
    
    // Total revenue
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    
    // Total orders
    const totalOrders = completedOrders.length;
    
    // Total items dari order items real
    const totalItems = filteredOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products - hitung dari data real
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    filteredOrderItems.forEach(item => {
      const existing = productMap.get(item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        productMap.set(item.name, { quantity: item.quantity, revenue: item.subtotal });
      }
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by category - estimasi berdasarkan nama produk
    const categoryMap = new Map<string, number>();
    
    filteredOrderItems.forEach(item => {
      let category = 'Lainnya';
      const nameLower = item.name.toLowerCase();
      
      if (nameLower.includes('coffee') || nameLower.includes('latte') || nameLower.includes('espresso') || nameLower.includes('cappuccino') || nameLower.includes('americano')) {
        category = 'Coffee';
      } else if (nameLower.includes('tea') || nameLower.includes('milk') || nameLower.includes('chocolate') || nameLower.includes('matcha')) {
        category = 'Non-Coffee';
      } else if (nameLower.includes('cake') || nameLower.includes('pastry') || nameLower.includes('croissant') || nameLower.includes('sandwich') || nameLower.includes('toast')) {
        category = 'Food';
      }
      
      categoryMap.set(category, (categoryMap.get(category) || 0) + item.subtotal);
    });

    const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0) || 1;
    
    const salesByCategory = Array.from(categoryMap.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: Math.round((revenue / totalCategoryRevenue) * 100)
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Hourly sales - hitung dari data real (hanya jam yang ada penjualan)
    const hourMap = new Map<string, { orders: Set<number>; revenue: number }>();
    
    completedOrders.forEach(order => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      const existing = hourMap.get(hourKey);
      if (existing) {
        existing.orders.add(order.id);
        existing.revenue += order.total_amount;
      } else {
        hourMap.set(hourKey, { orders: new Set([order.id]), revenue: order.total_amount });
      }
    });

    // Hanya tampilkan jam yang ada penjualannya (tidak diisi jam kosong)
    const hourlySales = Array.from(hourMap.entries())
      .filter(([_, data]) => data.orders.size > 0) // Filter hanya yang ada order
      .map(([hour, data]) => ({ hour, orders: data.orders.size, revenue: data.revenue }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      topProducts,
      salesByCategory,
      hourlySales,
    };
  }, [filteredOrders, filteredOrderItems]);

  const periodLabels = {
    hari: 'Hari Ini',
    minggu: '7 Hari Terakhir',
    bulan: '30 Hari Terakhir',
  };

  // Export CSV
  const exportCSV = () => {
    const csvContent = [
      ['Laporan Penjualan', periodLabels[period]],
      [''],
      ['Ringkasan'],
      ['Total Penjualan', salesData.totalRevenue],
      ['Total Pesanan', salesData.totalOrders],
      ['Item Terjual', salesData.totalItems],
      ['Rata-rata Pesanan', Math.round(salesData.averageOrderValue)],
      [''],
      ['Produk Terlaris'],
      ['Nama', 'Jumlah', 'Revenue'],
      ...salesData.topProducts.map(p => [p.name, p.quantity, p.revenue]),
      [''],
      ['Penjualan per Kategori'],
      ['Kategori', 'Revenue', 'Persentase'],
      ...salesData.salesByCategory.map(c => [c.category, c.revenue, `${c.percentage}%`]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const loading = loadingOrders || loadingItems;

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
              <p className="text-xs text-gray-500">
                {salesData.topProducts.length > 0 ? '5 produk dengan penjualan tertinggi' : 'Belum ada data penjualan'}
              </p>
            </div>
          </div>

          {salesData.topProducts.length > 0 ? (
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
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Coffee className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada produk terjual di periode ini</p>
            </div>
          )}
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

          {salesData.salesByCategory.length > 0 ? (
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
          ) : (
            <div className="text-center py-8 text-gray-400">
              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada data kategori</p>
            </div>
          )}
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
              <p className="text-xs text-gray-500">
                {salesData.hourlySales.length > 0 
                  ? `${salesData.hourlySales.length} jam aktif` 
                  : 'Belum ada data'}
              </p>
            </div>
          </div>

          {salesData.hourlySales.length > 0 ? (
            <div className="space-y-2">
              {salesData.hourlySales.map((hour, index) => {
                const maxRevenue = Math.max(...salesData.hourlySales.map(h => h.revenue));
                const percentage = maxRevenue > 0 ? (hour.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <motion.div
                    key={hour.hour}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-xs font-bold text-gray-600 w-10">{hour.hour}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(percentage, 5)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 min-w-[50px] text-right">
                        {hour.orders} order
                      </span>
                    </div>
                    <span className="text-xs font-bold text-orange-600 w-16 text-right">
                      Rp {(hour.revenue / 1000).toFixed(0)}k
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada data penjualan</p>
            </div>
          )}
        </motion.div>

        {/* Export Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={exportCSV}
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
