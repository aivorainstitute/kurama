import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ShoppingCart, User, Search, Plus, Minus, 
  Trash2, Receipt, Printer, X, Check, ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { MenuItem, CartItem, Order, OrderStatus } from '@/App';

interface CashierScreenProps {
  onLogout: () => void;
}

// Generate order number
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CZ-${date}-${random}`;
};

// Generate queue number
const generateQueueNumber = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('orders')
    .select('queue_number')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${tomorrow}T00:00:00`)
    .order('queue_number', { ascending: false })
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return 1;
  }
  
  return (data[0].queue_number || 0) + 1;
};

export default function CashierScreen({ onLogout }: CashierScreenProps) {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load menu items
  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, []);

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name');
    
    if (error) {
      toast.error('Gagal memuat menu');
      return;
    }
    
    setMenuItems(data || []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    if (error) {
      toast.error('Gagal memuat kategori');
      return;
    }
    
    setCategories(data || []);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category_id?.toString() === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (menuItem: MenuItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.menu_item.price }
            : item
        );
      }
      return [...prev, {
        id: Date.now(),
        menu_item: menuItem,
        quantity: 1,
        notes: '',
        subtotal: menuItem.price
      }];
    });
    toast.success(`${menuItem.name} ditambahkan`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity, subtotal: newQuantity * item.menu_item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateNotes = (id: number, notes: string) => {
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, notes } : item)
    );
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = Math.round(cartTotal * 0.1);
  const finalTotal = cartTotal + taxAmount;

  const handleCheckout = async (paymentMethod: 'CASH' | 'QRIS') => {
    if (!customerName.trim()) {
      toast.error('Masukkan nama pelanggan terlebih dahulu');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderNumber = generateOrderNumber();
      const queueNumber = await generateQueueNumber();
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          queue_number: queueNumber,
          customer_name: customerName.toUpperCase(),
          status: 'BARU' as OrderStatus,
          payment_status: 'SUDAH_BAYAR',
          payment_method: paymentMethod,
          subtotal: cartTotal,
          tax_amount: taxAmount,
          total_amount: finalTotal
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item.id,
        name: item.menu_item.name,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        notes: item.notes || null,
        subtotal: item.subtotal,
        image_url: item.menu_item.image_url || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create order object for receipt
      const order: Order = {
        id: orderData.id,
        order_number: orderData.order_number,
        queue_number: orderData.queue_number,
        customer_name: orderData.customer_name,
        status: orderData.status,
        payment_status: 'SUDAH_BAYAR',
        payment_method: paymentMethod,
        subtotal: cartTotal,
        tax_amount: taxAmount,
        total_amount: finalTotal,
        created_at: orderData.created_at,
        items: cartItems.map(item => ({
          menu_item_id: item.menu_item.id,
          name: item.menu_item.name,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          notes: item.notes,
          subtotal: item.subtotal,
          image_url: item.menu_item.image_url || undefined
        }))
      };

      setCompletedOrder(order);
      setShowReceipt(true);
      setCartItems([]);
      setCustomerName('');
      setShowCart(false);
      
      toast.success('Pesanan berhasil dibuat!');
    } catch (error: any) {
      toast.error('Gagal membuat pesanan: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewOrder = () => {
    setShowReceipt(false);
    setCompletedOrder(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/kuramalogo.png" alt="kur𝛂ma" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800">kur𝛂ma</h1>
              <p className="text-xs text-gray-500">Kasir Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <motion.button
              onClick={() => setShowCart(true)}
              className="relative p-3 bg-blue-500 text-white rounded-xl"
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </motion.button>
            
            {/* Logout */}
            <motion.button
              onClick={onLogout}
              className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl"
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Customer Name Input */}
      <div className="bg-blue-50 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-500" />
            <input
              type="text"
              placeholder="Nama Pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
              className="flex-1 h-12 px-4 bg-white border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <motion.button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              Semua
            </motion.button>
            {categories.map(cat => (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm ${
                  activeCategory === cat.id.toString()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer"
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square bg-gray-100 relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm truncate">{item.name}</h3>
                  <p className="text-blue-600 font-bold text-sm">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Keranjang</h2>
                <button onClick={() => setShowCart(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.menu_item.name}</h4>
                          <p className="text-sm text-gray-500">
                            Rp {item.menu_item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="ml-auto font-bold text-blue-600">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      {/* Notes */}
                      <input
                        type="text"
                        placeholder="Catatan (opsional)"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PPN (10%)</span>
                      <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">Rp {finalTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => handleCheckout('CASH')}
                      disabled={isProcessing}
                      className="h-14 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Receipt className="w-5 h-5" />
                      CASH
                    </motion.button>
                    <motion.button
                      onClick={() => handleCheckout('QRIS')}
                      disabled={isProcessing}
                      className="h-14 bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Check className="w-5 h-5" />
                      QRIS
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && completedOrder && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowReceipt(false)} />
            <motion.div
              className="relative bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Receipt Content */}
              <div className="p-6 font-mono text-sm">
                <div className="text-center mb-4">
                  <h2 className="font-bold text-lg">kur𝛂ma COFFEE</h2>
                  <p className="text-xs text-gray-500">Jl. A. Yani No. 45, Tanjung</p>
                  <p className="text-xs text-gray-500">Tabalong, Kalimantan Selatan</p>
                </div>
                
                <div className="border-t border-b border-dashed py-2 my-2 text-xs">
                  <p>No: {completedOrder.order_number}</p>
                  <p>Antrian: #{completedOrder.queue_number}</p>
                  <p>Pelanggan: {completedOrder.customer_name}</p>
                  <p>Kasir: KASIR</p>
                  <p>{new Date(completedOrder.created_at).toLocaleString('id-ID')}</p>
                </div>
                
                <div className="py-2">
                  {completedOrder.items?.map((item, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between">
                        <span>{item.name}</span>
                        <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}
                      </span>
                      {item.notes && (
                        <p className="text-xs text-gray-400">*{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed py-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {completedOrder.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN (10%)</span>
                    <span>Rp {completedOrder.tax_amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>TOTAL</span>
                    <span>Rp {completedOrder.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Metode</span>
                    <span>{completedOrder.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="text-green-600">LUNAS</span>
                  </div>
                </div>
                
                <div className="text-center mt-4 pt-4 border-t border-dashed">
                  <p className="text-xs text-gray-500">Terima kasih telah berkunjung!</p>
                  <p className="text-xs text-gray-500">Instagram: @kurama.coffee</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-4 border-t space-y-3">
                <motion.button
                  onClick={handlePrint}
                  className="w-full h-12 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  <Printer className="w-5 h-5" />
                  Cetak Struk
                </motion.button>
                <motion.button
                  onClick={handleNewOrder}
                  className="w-full h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowRight className="w-5 h-5" />
                  Pesanan Baru
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
