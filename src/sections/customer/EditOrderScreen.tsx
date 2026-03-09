import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { OrderItem } from '@/App';

interface EditOrderData {
  order: {
    id: number;
    order_number: string;
    queue_number: number;
    customer_name: string;
    status: string;
    payment_status: string | null;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
  };
  items: (OrderItem & { id?: number })[];
}

export default function EditOrderScreen() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<EditOrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        console.log('Loading editOrder from localStorage...');
        const saved = localStorage.getItem('editOrder');
        console.log('Raw saved data:', saved);
        
        if (!saved) {
          console.error('No editOrder data in localStorage');
          setLoadError('Tidak ada data pesanan');
          setLoading(false);
          return;
        }
        
        const parsed = JSON.parse(saved);
        console.log('Parsed data:', parsed);
        
        if (!parsed || !parsed.order || !parsed.order.id) {
          console.error('Invalid order data:', parsed);
          setLoadError('Data pesanan tidak valid');
          setLoading(false);
          return;
        }
        
        setOrderData(parsed);
        setItems(parsed.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading editOrder:', err);
        setLoadError('Gagal memuat data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate totals
  const { subtotal, tax, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = Math.round(sub * 0.1);
    return {
      subtotal: sub,
      tax: taxAmount,
      total: sub + taxAmount
    };
  }, [items]);

  const handleQuantityChange = (itemId: number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          subtotal: item.unit_price * newQty
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleNotesChange = (itemId: number, notes: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const handleSave = async () => {
    if (!orderData) return;
    if (items.length === 0) {
      toast.error('Pesanan tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      // Delete old items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderData.order.id);

      if (deleteError) throw deleteError;

      // Insert new items
      const newItems = items.map(item => ({
        order_id: orderData.order.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes,
        subtotal: item.subtotal
      }));

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(newItems);

      if (insertError) throw insertError;

      // Update order totals
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal,
          tax_amount: tax,
          total_amount: total
        })
        .eq('id', orderData.order.id);

      if (updateError) throw updateError;

      // Clear localStorage
      localStorage.removeItem('editOrder');
      
      toast.success('Pesanan berhasil diupdate!');
      navigate('/check-order');
    } catch (err: any) {
      console.error('Error saving order:', err);
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'DIBATALKAN' })
        .eq('id', orderData.order.id);

      if (error) throw error;

      localStorage.removeItem('editOrder');
      toast.success('Pesanan dibatalkan');
      navigate('/check-order');
    } catch (err: any) {
      toast.error('Gagal membatalkan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItems = () => {
    // Save current state and go to menu
    if (orderData) {
      localStorage.setItem('editOrderPending', JSON.stringify({
        order: orderData.order,
        items
      }));
    }
    navigate('/menu');
  };

  const handleBack = () => {
    navigate('/check-order');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 pb-8">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Edit Pesanan</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 pb-8">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Edit Pesanan</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-96 px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-red-500 font-medium mb-2">{loadError || 'Data tidak ditemukan'}</p>
          <p className="text-sm text-gray-500 text-center mb-4">
            Silakan kembali ke halaman Cek Pesanan dan coba lagi.
          </p>
          <motion.button
            onClick={handleBack}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
            style={{ boxShadow: '0 4px 0 0 #C2410C' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            Kembali ke Cek Pesanan
          </motion.button>
        </div>
      </div>
    );
  }

  const canEdit = orderData.order.payment_status !== 'SUDAH_BAYAR';

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 pb-8">
        <div className="flex items-center gap-3">
          <motion.button 
            onClick={handleBack}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Edit Pesanan</h1>
        </div>
      </div>

      <main className="px-5 py-4 -mt-4">
        {/* Order Info Card */}
        <motion.div 
          className="bg-white rounded-2xl p-4 mb-4 border-l-4 border-blue-500"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-orange-500 font-medium">ORDER #{orderData.order.order_number}</p>
            <Badge className="bg-blue-500 text-white">
              {orderData.order.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Antrian #{orderData.order.queue_number} • {orderData.order.customer_name}
          </p>
          {!canEdit && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Pesanan sudah dibayar dan tidak bisa diedit</p>
            </div>
          )}
        </motion.div>

        {/* Items List */}
        <motion.div 
          className="space-y-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Item Pesanan ({items.length})</h3>
            {canEdit && (
              <motion.button
                onClick={handleAddItems}
                className="text-sm text-orange-600 font-medium flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4" />
                Tambah Item
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 2px 0 0 #E5E7EB, 0 4px 8px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      Rp {item.unit_price.toLocaleString('id-ID')} / item
                    </p>
                  </div>
                  {canEdit && (
                    <motion.button
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {canEdit ? (
                      <>
                        <motion.button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <motion.button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </>
                    ) : (
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                    )}
                  </div>
                  <p className="font-bold text-orange-600">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Notes */}
                {canEdit ? (
                  <input
                    type="text"
                    placeholder="Tambah catatan..."
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="w-full mt-3 text-sm bg-gray-50 rounded-lg px-3 py-2 border-0 focus:ring-2 focus:ring-orange-200"
                  />
                ) : item.notes ? (
                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Catatan: {item.notes}
                  </p>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="text-center py-8 bg-white rounded-2xl">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Tidak ada item</p>
              {canEdit && (
                <motion.button
                  onClick={handleAddItems}
                  className="mt-3 text-orange-600 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  + Tambah Item
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Total Summary */}
        <motion.div 
          className="bg-white rounded-2xl p-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Subtotal</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Pajak (10%)</span>
            <span>Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-800">Total Baru</span>
            <span className="font-bold text-xl text-orange-600">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          {(subtotal !== orderData.order.subtotal) && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Total berubah dari Rp {orderData.order.total_amount.toLocaleString('id-ID')}
            </p>
          )}
        </motion.div>
      </main>

      {/* Bottom Actions */}
      {canEdit && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 space-y-3"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <motion.button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ boxShadow: '0 6px 0 0 #C2410C' }}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98, y: 2 }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </motion.button>

          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={saving}
            className="w-full h-12 text-red-500 font-medium rounded-2xl"
          >
            Batalkan Pesanan
          </button>
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowCancelConfirm(false)}
            />
            <motion.div
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Batalkan Pesanan?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pesanan akan dibatalkan dan tidak bisa diproses lagi.
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={handleCancelOrder}
                  disabled={saving}
                  className="w-full h-12 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Ya, Batalkan'
                  )}
                </motion.button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={saving}
                  className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Tidak, Kembali
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
