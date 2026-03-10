import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Search, 
  Plus,
  Edit2,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Navbar3D } from '@/components/Navbar3D';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  item_count: number;
}

// Mock data for now - will be replaced with Supabase integration
const mockCategories: Category[] = [
  { id: 1, name: 'Signatures', item_count: 12 },
  { id: 2, name: 'Coffee', item_count: 8 },
  { id: 3, name: 'Minuman', item_count: 15 },
  { id: 4, name: 'Makanan', item_count: 20 },
  { id: 5, name: 'Camilan', item_count: 10 },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
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

export default function CategoryManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [localCategories, setLocalCategories] = useState(mockCategories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const filteredCategories = localCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = (id: number) => {
    setLocalCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, name: editName } : cat
    ));
    setEditingId(null);
    toast.success('Kategori berhasil diupdate!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setLocalCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Kategori berhasil dihapus!');
    }
  };

  const handleAddCategory = () => {
    const newName = prompt('Masukkan nama kategori baru:');
    if (newName && newName.trim()) {
      const newCategory: Category = {
        id: Date.now(),
        name: newName.trim(),
        item_count: 0
      };
      setLocalCategories(prev => [...prev, newCategory]);
      toast.success('Kategori berhasil ditambahkan!');
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
      <Navbar3D 
        title="Kategori & Menu"
        rightContent={
          <motion.button 
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        }
      />
      
      <main className="px-5 py-4 pb-6">
        {/* Search */}
        <motion.div 
          className="relative mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-orange-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-700 placeholder:text-orange-300"
          />
        </motion.div>
        {/* Categories List */}
        <motion.div 
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category) => (
              <motion.div 
                key={category.id} 
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
                variants={itemVariants}
                layout
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <motion.button 
                    className="p-1 hover:bg-orange-50 rounded cursor-grab"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <GripVertical className="w-5 h-5 text-orange-300" />
                  </motion.button>

                  {/* Icon */}
                  <motion.div 
                    className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Layers className="w-6 h-6 text-orange-500" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveEdit(category.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(category.id)}
                        className="w-full h-10 text-base border-2 border-orange-200 rounded-xl px-3 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-800">{category.name}</h3>
                        <p className="text-sm text-orange-500">{category.item_count} Menu</p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-orange-50 rounded-full"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit2 className="w-4 h-4 text-orange-400" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-red-50 rounded-full"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredCategories.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Layers className="w-16 h-16 text-orange-200 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400">Tidak ada kategori ditemukan</p>
            </motion.div>
          )}
        </motion.div>

        {/* Add Category Button */}
        <motion.button
          onClick={handleAddCategory}
          className="w-full h-14 mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2"
          style={{
            boxShadow: '0 6px 0 0 #18181B, 0 8px 24px rgba(0, 0, 0, 0.24)'
          }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: '0 4px 0 0 #18181B, 0 6px 16px rgba(0, 0, 0, 0.24)'
          }}
          whileTap={{ 
            scale: 0.98,
            y: 4,
            boxShadow: '0 0 0 0 #18181B, 0 2px 8px rgba(0, 0, 0, 0.24)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
            whileHover={{ rotate: 90 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
          Tambah Kategori Baru
        </motion.button>
      </main>
    </motion.div>
  );
}


