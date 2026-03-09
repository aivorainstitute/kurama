import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  ArrowLeft, 
  Save,
  Loader2,
  Trash2
} from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { MenuItem } from '@/lib/supabase';

interface EditOrderMenuProps {
  customerName: string;
}

interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  notes: string;
  subtotal: number;
}

export default function EditOrderMenu({ customerName }: EditOrderMenuProps) {
  const navigate = useNavigate();
  const { menuItems, loading: menuLoading } = useMenuItems();
  
  const [editData, setEditData] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load edit data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('editModeOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEditData(parsed);
        
        // Convert order items to cart format
        if (parsed.items) {
          const cart = parsed.items.map((item: any) => ({
            menu_item: {
              id: item.menu_item_id,
              name: item.name,
              price: item.unit_price,
              image_url: null,
              category_name: '',
              description: null,
              is_available: true,
              is_popular: false,
              stock: 100
            } as MenuItem,
            quantity: item.quantity,
            notes: item.notes || '',
            subtotal: item.subtotal
          }));
          setCartItems(cart);
        }
      } catch {
        navigate('/check-order');
      }
    } else {
      navigate('/check-order');
    }
  }, [navigate]);

  const categories = useMemo(() => {
    const unique = [...new Set(menuItems.map(i => i.category_name).filter((c): c is string => !!c))];
    return ['Semua', ...unique];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') return menuItems.filter(i => i.is_available);
    return menuItems.filter(i => i.is_available && i.category_name === selectedCategory);
  }, [menuItems, selectedCategory]);

  const getItemQuantity = (itemId: number) => {
    const cartItem = cartItems.find(c => c.menu_item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (menuItem: MenuItem, delta: number) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.menu_item.id === menuItem.id);
      
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter(c => c.menu_item.id !== menuItem.id);
        }
        return prev.map(c => 
          c.menu_item.id === menuItem.id 
            ? { ...c, quantity: newQty, subtotal: menuItem.price * newQty }
            : c
        );
      }
      
      if (delta > 0) {
        return [...prev, {
          menu_item: menuItem,
          quantity: 1,
          notes: '',
          subtotal: menuItem.price
        }];
      }
      
      return prev;
    });
  };

  const { subtotal, tax, total } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmt = Math.round(sub * 0.1);
    return { subtotal: sub, tax: taxAmt, total: sub + taxAmt };
  }, [cartItems]);

  const handleSave = async () => {
    if (!editData || cartItems.length === 0) {
      toast.error('Pesanan tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      // Delete old items
      await supabase.from('order_items').delete().eq('order_id', editData.orderId);

      // Insert new items
      const newItems = cartItems.map(item => ({
        order_id: editData.orderId,
        menu_item_id: item.menu_item.id,
        name: item.menu_item.name,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        notes: item.notes,
        subtotal: item.subtotal
      }));

      await supabase.from('order_items').insert(newItems);

      // Update order
      await supabase.from('orders').update({
        subtotal,
        tax_amount: tax,
        total_amount: total,
        customer_name: customerName || editData.customerName || ''
      } as Record<string, unknown>).eq('id', editData.orderId);

      localStorage.removeItem('editModeOrder');
      toast.success('Pesanan berhasil diupdate!');
      navigate('/check-order');
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('editModeOrder');
    navigate('/check-order');
  };

  if (menuLoading || !editData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 pb-8">
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Edit Pesanan</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button 
              onClick={handleCancel}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Pesanan</h1>
              <p className="text-sm text-blue-100">#{editData.orderNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-100">Item: {cartItems.length}</p>
            <p className="text-lg font-bold text-white">Rp {total.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <main className="px-5 py-4 pt-6 pb-40">
        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <motion.div 
            className="bg-white rounded-2xl p-4 mb-6"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3">Item Saat Ini ({cartItems.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate">{item.quantity}x {item.menu_item.name}</span>
                  <span className="text-gray-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 mt-2">
          {categories.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-orange-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={selectedCategory === cat ? { boxShadow: '0 4px 0 0 #C2410C' } : {}}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-8">
          <p className="text-xs text-gray-400">{filteredItems.length} menu tersedia</p>
          
          {filteredItems.map(item => {
            const qty = getItemQuantity(item.id);
            return (
              <motion.div 
                key={item.id}
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex gap-4">
                  <img 
                    src={item.image_url || 'https://placehold.co/100x100/orange/white?text=No+Image'} 
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{item.category_name}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-orange-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <motion.button
                              onClick={() => handleAddToCart(item, -1)}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            <span className="w-6 text-center font-medium">{qty}</span>
                          </>
                        )}
                        <motion.button
                          onClick={() => handleAddToCart(item, 1)}
                          className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ boxShadow: '0 2px 0 0 #C2410C' }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Bottom Actions */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Total Baru</p>
            <p className="text-2xl font-bold text-orange-600">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>
          <p className="text-sm text-gray-400">
            {cartItems.reduce((sum, i) => sum + i.quantity, 0)} item
          </p>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            onClick={() => setShowConfirm(true)}
            disabled={saving || cartItems.length === 0}
            className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ boxShadow: '0 6px 0 0 #C2410C' }}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98, y: 2 }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </motion.button>
          
          <button
            onClick={handleCancel}
            disabled={saving}
            className="h-14 px-5 bg-gray-100 text-gray-700 rounded-2xl font-medium"
          >
            Batal
          </button>
        </div>
      </motion.div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
            <motion.div
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="text-lg font-bold text-center mb-4">Simpan Perubahan?</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 bg-orange-500 text-white rounded-xl font-semibold"
                >
                  Ya, Simpan
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
