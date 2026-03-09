import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ArrowRight, Trash2, ImageOff, Loader2 } from 'lucide-react';
import { CustomerNavbar3D } from '@/components/Navbar3D';
import type { CartItem, Order } from '@/App';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/orange/white?text=No+Image';

interface CartSheetProps {
  cartItems: CartItem[];
  updateCartItem: (id: number, quantity: number, notes?: string) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  customerName: string;
  createOrder: (customerName: string) => Promise<Order>;
}

export default function CartSheet({ 
  cartItems, 
  updateCartItem, 
  removeFromCart, 
  customerName,
  createOrder 
}: CartSheetProps) {
  const navigate = useNavigate();
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = Math.round(subtotal * 0.1);
  const total = subtotal + taxAmount;

  const handleCheckout = async () => {
    if (cartItems.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      const order = await createOrder(customerName);
      navigate('/payment', { state: { order } });
    } catch (error: any) {
      console.error('Checkout error:', error);
      const message = error?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
      setErrorMsg(message);
      alert('Error: ' + message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    navigate('/menu');
  };

  const startEditingNotes = (itemId: number, currentNotes: string) => {
    setEditingNotes(itemId);
    setNoteText(currentNotes);
  };

  const saveNotes = (itemId: number) => {
    const item = cartItems.find(c => c.id === itemId);
    if (item) {
      updateCartItem(itemId, item.quantity, noteText);
    }
    setEditingNotes(null);
    setNoteText('');
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
        title="Keranjang"
        showBack={true}
        backTo="/menu"
      />

      {/* Cart Items */}
      <main className="px-5 py-4 pb-56">
        {cartItems.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ boxShadow: '0 8px 0 0 #FED7AA, 0 12px 24px rgba(249, 115, 22, 0.2)' }}
            >
              <span className="text-4xl">🛒</span>
            </motion.div>
            <p className="text-gray-500">Keranjang masih kosong</p>
            <motion.button 
              onClick={handleClose}
              className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-medium"
              style={{ boxShadow: '0 6px 0 0 #C2410C, 0 8px 16px rgba(249, 115, 22, 0.4)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, y: 4 }}
            >
              Kembali ke Menu
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="bg-white rounded-2xl border border-orange-100 p-4"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(249, 115, 22, 0.1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <div className="flex gap-4">
                    {item.menu_item.image_url ? (
                      <motion.img 
                        src={item.menu_item.image_url} 
                        alt={item.menu_item.name}
                        className="w-20 h-20 object-cover rounded-xl"
                        whileHover={{ scale: 1.05 }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.menu_item.name}</h3>
                          {editingNotes === item.id ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Tambah catatan..."
                                className="w-full text-sm border-2 border-orange-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500"
                                onBlur={() => saveNotes(item.id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveNotes(item.id)}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <motion.button
                              onClick={() => startEditingNotes(item.id, item.notes)}
                              className="text-sm text-orange-400 mt-1 hover:text-orange-600"
                              whileHover={{ scale: 1.05 }}
                            >
                              {item.notes || '+ Tambah catatan'}
                            </motion.button>
                          )}
                        </div>
                        <p className="font-semibold text-orange-600">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-orange-50 rounded-full px-2 py-1">
                          <motion.button
                            onClick={() => updateCartItem(item.id, Math.max(0, item.quantity - 1))}
                            className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-600 hover:bg-orange-100"
                            style={{ boxShadow: '0 2px 0 0 #FED7AA' }}
                            whileTap={{ scale: 0.9, y: 2 }}
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <motion.span 
                            className="text-sm font-medium w-6 text-center"
                            key={item.quantity}
                            initial={{ scale: 1.5, color: '#F97316' }}
                            animate={{ scale: 1, color: '#374151' }}
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white"
                            style={{ boxShadow: '0 2px 0 0 #C2410C' }}
                            whileTap={{ scale: 0.9, y: 2 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                        
                        <motion.button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Summary */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 p-5"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Pajak (10%)</span>
                <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-orange-100">
                <span className="text-sm text-gray-500">TOTAL PEMBAYARAN</span>
                <div className="text-right">
                  <motion.p 
                    className="text-2xl font-bold text-orange-600"
                    key={total}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    Rp {total.toLocaleString('id-ID')}
                  </motion.p>
                  <p className="text-xs text-gray-400">INCL. TAX 10%</p>
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                boxShadow: isProcessing ? 'none' : '0 6px 0 0 #C2410C, 0 8px 24px rgba(249, 115, 22, 0.4)'
              }}
              whileHover={isProcessing ? {} : { scale: 1.02, y: -2 }}
              whileTap={isProcessing ? {} : { scale: 0.98, y: 4 }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Checkout
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Footer */}
      <motion.div 
        className="mt-6 flex flex-col items-center pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 opacity-40">
          <img src="/logo.png" alt="KURAMA" className="w-5 h-5 object-contain" />
          <span className="text-xs font-bold tracking-wider text-gray-400">KURAMA</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
