import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  ChevronLeft,
  Edit2,
  Grid3X3,
  Loader2
} from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';

const categories = ['Semua', 'Minuman', 'Makanan Utama'];

export default function StockManagementSupabase() {
  const navigate = useNavigate();
  const { menuItems, loading, error, updateStock } = useMenuItems();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'Semua' || 
      (selectedCategory === 'Minuman' && item.category_name === 'Minuman') ||
      (selectedCategory === 'Makanan Utama' && (item.category_name === 'Makanan' || item.category_name === 'Signatures'));
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStockChange = async (itemId: number, delta: number) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const newStock = Math.max(0, item.stock + delta);
    await updateStock(itemId, newStock);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D7377]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error ?? 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#0D7377] text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-gray-50 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pengelolaan Stok</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">IKHTISAR INVENTARIS</p>
          </div>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="ml-auto w-10 h-10 bg-[#0D7377] rounded-xl flex items-center justify-center"
          >
            <Grid3X3 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-[#0D7377] text-white shadow-lg shadow-teal-900/20'
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 py-4 pb-48">
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="relative">
                  <img 
                    src={item.image_url || undefined} 
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl"
                  />
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-red-500/90 rounded-xl flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">HABIS</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${item.is_available ? 'text-gray-800' : 'text-gray-400'}`}>
                        {item.name}
                      </h3>
                      <p className={`text-xs uppercase ${
                        item.category_name === 'Minuman' ? 'text-[#0D7377]' : 
                        item.category_name === 'Camilan' ? 'text-orange-500' : 
                        item.category_name === 'Makanan' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {item.category_name}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate(`/admin/edit-item/${item.id}`)}
                      className="p-2 hover:bg-gray-50 rounded-full"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Stock Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStockChange(item.id, -1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      item.stock === 0 
                        ? 'bg-gray-200 text-gray-400' 
                        : 'bg-[#0D7377] text-white hover:bg-[#095C5F]'
                    }`}
                    disabled={item.stock === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className={`w-8 text-center font-medium ${item.is_available ? 'text-gray-800' : 'text-gray-400'}`}>
                    {item.stock}
                  </span>
                  <button
                    onClick={() => handleStockChange(item.id, 1)}
                    className="w-10 h-10 bg-[#0D7377] rounded-full flex items-center justify-center text-white hover:bg-[#095C5F] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Order Center Button */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-[#0D7377] hover:bg-[#095C5F] active:scale-95 transition-all text-white rounded-full px-6 py-4 shadow-xl shadow-teal-900/30 flex items-center gap-3"
        >
          <span className="font-medium">PUSAT PESANAN</span>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Grid3X3 className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 rounded-t-3xl">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-[#0D7377]"
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-medium">PESANAN</span>
          </button>
          <button 
            onClick={() => navigate('/admin/orders')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-[#0D7377]"
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs font-medium">RIWAYAT</span>
          </button>
          <button 
            onClick={() => navigate('/admin/stock')}
            className="flex flex-col items-center gap-1 p-2 text-[#0D7377]"
          >
            <div className="w-10 h-10 bg-[#0D7377] rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">STOK</span>
          </button>
          <button 
            onClick={() => navigate('/admin/categories')}
            className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-[#0D7377]"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">ADMIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
