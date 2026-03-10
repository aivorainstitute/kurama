import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Minus, 
  Edit2,
  Package,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useMenuItems, clearMenuCache } from '@/hooks/useMenuItems';
import { Navbar3D } from '@/components/Navbar3D';

// Ambil kategori unik dari menu items
const getCategories = (menuItems: any[]) => {
  const uniqueCategories = [...new Set(
    menuItems
      .map(item => item.category_name)
      .filter((cat): cat is string => !!cat)
  )];
  return ['Semua', ...uniqueCategories];
};



const StockItem = ({ 
  item, 
  onEdit, 
  onStockChange 
}: { 
  item: any; 
  onEdit: (id: number) => void;
  onStockChange: (id: number, delta: number) => void;
}) => {
  console.log('StockItem render:', item.name, 'stock:', item.stock);
  
  return (
    <motion.div 
      className="bg-white rounded-2xl p-4"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.06)' }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.img 
            src={item.image_url || 'https://placehold.co/100x100/e4e4e7/111827?text=Menu'} 
            alt={item.name}
            loading="lazy"
            className="w-14 h-14 object-cover rounded-xl"
            whileHover={{ scale: 1.1 }}
          />
          {!item.is_available && (
            <div className="absolute inset-0 bg-red-500/90 rounded-xl flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">HABIS</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className={`font-semibold truncate ${item.is_available ? 'text-gray-800' : 'text-gray-400'}`}>
                {item.name}
              </h3>
              <p className={`text-xs uppercase font-medium ${
                item.category_name === 'Minuman' ? 'text-blue-500' : 
                item.category_name === 'Coffee' ? 'text-amber-600' :
                item.category_name === 'Signatures' ? 'text-pink-500' :
                item.category_name === 'Makanan' ? 'text-green-500' : 
                item.category_name === 'Camilan' ? 'text-purple-500' : 
                'text-orange-500'
              }`}>
                {item.category_name}
              </p>
            </div>
            <motion.button 
              onClick={() => onEdit(item.id)}
              className="p-2 hover:bg-orange-50 rounded-full flex-shrink-0"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Edit2 className="w-4 h-4 text-orange-400" />
            </motion.button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-orange-600">
              Rp {item.price.toLocaleString('id-ID')}
            </span>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => onStockChange(item.id, -1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${
                  item.stock > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300'
                }`}
                disabled={item.stock === 0}
                whileHover={item.stock > 0 ? { scale: 1.1 } : {}}
                whileTap={item.stock > 0 ? { scale: 0.9, y: 2 } : {}}
                style={item.stock > 0 ? {
                  boxShadow: '0 4px 0 0 #18181B, 0 4px 8px rgba(0, 0, 0, 0.18)'
                } : {}}
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              
              <motion.span 
                className={`w-8 text-center font-medium ${item.is_available ? 'text-gray-800' : 'text-gray-400'}`}
                key={item.stock}
                initial={{ scale: 1.5, color: '#3F3F46' }}
                animate={{ scale: 1, color: item.is_available ? '#1F2937' : '#9CA3AF' }}
              >
                {item.stock}
              </motion.span>
              
              <motion.button
                onClick={() => onStockChange(item.id, 1)}
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, y: 2 }}
                style={{
                  boxShadow: '0 4px 0 0 #18181B, 0 4px 8px rgba(0, 0, 0, 0.24)'
                }}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function StockManagement() {
  const navigate = useNavigate();
  const { menuItems, loading, error, updateStock } = useMenuItems();

  // Get categories from database
  const categories = getCategories(menuItems);
  
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items - direct for faster response
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Semua' || item.category_name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEdit = useCallback((id: number) => {
    navigate(`/admin/edit-item/${id}`);
  }, [navigate]);

  const handleStockChange = useCallback(async (itemId: number, delta: number) => {
    const result = await updateStock(itemId, delta);
    if (!result.success) {
      console.error('Failed to update stock:', result.error);
    }
  }, [updateStock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar3D title="Pengelolaan Stok" />
        <div className="px-5">
          {/* Search skeleton */}
          <div className="h-12 bg-gray-200 rounded-2xl mb-4 animate-pulse" />
          {/* Filter tabs skeleton */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          {/* Stock items skeleton */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
            style={{ boxShadow: '0 4px 0 0 #18181B' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 4 }}
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
        title="Pengelolaan Stok"
        rightContent={
          <motion.button 
            onClick={() => {
              clearMenuCache();
              window.location.reload();
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            style={{
              boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </motion.button>
        }
      />

      <main className="px-5 py-4 pb-6">
        {/* Search */}
        <motion.div 
          className="relative mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
          <Input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white border-orange-100 rounded-2xl focus:border-orange-500 focus:ring-orange-500/20"
          />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {categories.map((category, _index) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-orange-100 hover:border-orange-300'
              }`}
              style={selectedCategory === category ? {
                boxShadow: '0 4px 0 0 #18181B, 0 6px 12px rgba(0, 0, 0, 0.18)'
              } : {}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Items Count */}
        <motion.p 
          className="text-sm text-gray-500 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {filteredItems.length} item ditemukan
        </motion.p>

        {/* Items List */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <StockItem
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onStockChange={handleStockChange}
            />
          ))}
          
          {filteredItems.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Package className="w-16 h-16 text-orange-200 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400">
                {selectedCategory !== 'Semua' 
                  ? `Tidak ada menu di kategori "${selectedCategory}"` 
                  : searchQuery 
                    ? `Tidak ada menu dengan nama "${searchQuery}"`
                    : 'Tidak ada menu ditemukan'
                }
              </p>
              {(selectedCategory !== 'Semua' || searchQuery) && (
                <motion.button
                  onClick={() => {
                    setSelectedCategory('Semua');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-orange-600 font-medium text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  Reset Filter
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

