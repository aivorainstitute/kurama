import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, User, HelpCircle, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { OrderSummary } from '@/App';

// 3D Shadow styles
const card3D = '0 4px 0 0 rgba(0,0,0,0.1), 0 8px 16px rgba(0, 0, 0, 0.12)';
const button3D = '0 6px 0 0 #18181B, 0 8px 24px rgba(0, 0, 0, 0.24)';
const button3DOrange = '0 4px 0 0 #D4D4D8, 0 4px 12px rgba(0, 0, 0, 0.14)';

interface WelcomeScreenProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  hasActiveOrder?: boolean;
  orders?: OrderSummary[];
}

export default function WelcomeScreen({ customerName, setCustomerName, orders = [] }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(customerName);
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [checkName, setCheckName] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showDifferentNameForm, setShowDifferentNameForm] = useState(false);
  const [differentName, setDifferentName] = useState('');

  const checkNameExists = async (nameToCheck: string): Promise<boolean> => {
    const localExists = orders.some(o => 
      o.customer_name.toLowerCase() === nameToCheck.toLowerCase()
    );
    if (localExists) return true;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .ilike('customer_name', nameToCheck)
        .limit(1);
      
      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const handleStart = async () => {
    if (name.trim().length < 2) return;
    const trimmedName = name.trim();
    setIsChecking(true);
    const exists = await checkNameExists(trimmedName);
    
    if (exists) {
      setPendingName(trimmedName);
      setShowConfirmModal(true);
    } else {
      setCustomerName(trimmedName.toUpperCase());
      navigate('/menu');
    }
    setIsChecking(false);
  };

  const handleConfirmYes = () => {
    setCustomerName(pendingName.toUpperCase());
    setShowConfirmModal(false);
    navigate('/menu');
  };

  const handleConfirmNo = () => {
    setShowConfirmModal(false);
    setShowDifferentNameForm(true);
    setDifferentName('');
  };

  const handleDifferentNameSubmit = async () => {
    if (differentName.trim().length < 2) return;
    const trimmedName = differentName.trim();
    setIsChecking(true);
    const exists = await checkNameExists(trimmedName);
    
    if (exists) {
      setPendingName(trimmedName);
      setShowDifferentNameForm(false);
      setShowConfirmModal(true);
    } else {
      setCustomerName(trimmedName.toUpperCase());
      setShowDifferentNameForm(false);
      navigate('/menu');
    }
    setIsChecking(false);
  };

  const handleCheckOrder = () => {
    if (checkName.trim().length >= 2) {
      navigate('/check-order', { state: { searchName: checkName.trim() } });
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-20 -right-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Logo & Brand */}
      <motion.div 
        className="mb-8 relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <img 
            src="/kuramalogo.png" 
            alt="kur𝛂ma Logo" 
            className="w-28 h-28 object-contain drop-shadow-xl"
          />
          {/* Glow effect */}
          <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-2xl -z-10" />
        </motion.div>
        
        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center"
        >
          <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 drop-shadow-sm">
            kur𝛂ma
          </h1>
          <p className="text-xs font-medium text-orange-400/80 tracking-[0.3em] uppercase mt-1">
            Coffee
          </p>
          <p className="text-[10px] text-gray-400 mt-2 tracking-wide">
            Brewed with passion, served with love
          </p>
        </motion.div>
      </motion.div>

      {/* Subtitle */}
      <motion.div 
        className="text-center mb-8 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-gray-500 text-lg">
          {showCheckOrder ? 'Masukkan nama untuk cek pesanan' : 'Selamat datang! Atas nama siapa pesanan ini?'}
        </p>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!showCheckOrder ? (
          <motion.div
            key="main-form"
            className="w-full max-w-sm relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Name Input - Clean Design */}
            <motion.div
              className="relative mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <input
                id="customerName"
                name="customerName"
                type="text"
                placeholder="Masukkan nama"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !isChecking && handleStart()}
                className="w-full h-14 text-lg text-center bg-white border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 text-gray-700 placeholder:text-orange-300 transition-all font-medium"
                style={{ boxShadow: '0 4px 0 0 #E4E4E7' }}
                disabled={isChecking}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
              />
              <AnimatePresence>
                {name.length >= 2 && !isChecking && (
                  <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                    style={{ boxShadow: '0 2px 0 0 #D4D4D8' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Utensils className="w-4 h-4 text-orange-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Start Button - 3D */}
            <motion.button
              onClick={handleStart}
              disabled={name.trim().length < 2 || isChecking}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              style={{
                boxShadow: name.trim().length >= 2 && !isChecking ? button3D : '0 2px 0 0 #18181B'
              }}
              whileHover={name.trim().length >= 2 && !isChecking ? { scale: 1.02 } : {}}
              whileTap={name.trim().length >= 2 && !isChecking ? { scale: 0.98, y: 4 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {isChecking ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Mulai Pesan
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Check Order Button - Outline 3D */}
            <motion.button
              onClick={() => setShowCheckOrder(true)}
              className="w-full h-12 bg-white text-orange-600 font-semibold rounded-2xl flex items-center justify-center gap-2 border-2 border-orange-200"
              style={{ boxShadow: button3DOrange }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98, y: 2 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Search className="w-4 h-4" />
              Cek Pesanan Saya
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="check-form"
            className="w-full max-w-sm relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <motion.div
              className="relative mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <input
                type="text"
                placeholder="Masukkan nama pemesan"
                value={checkName}
                onChange={(e) => setCheckName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckOrder()}
                className="w-full h-14 text-lg text-center bg-white border-2 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 text-gray-700 placeholder:text-blue-300 transition-all"
                style={{ boxShadow: '0 4px 0 0 #E4E4E7' }}
                autoFocus
              />
            </motion.div>

            <motion.button
              onClick={handleCheckOrder}
              disabled={checkName.trim().length < 2}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              style={{
                boxShadow: checkName.trim().length >= 2 
                  ? '0 6px 0 0 #27272A, 0 8px 24px rgba(0, 0, 0, 0.24)'
                  : '0 2px 0 0 #27272A'
              }}
              whileHover={checkName.trim().length >= 2 ? { scale: 1.02 } : {}}
              whileTap={checkName.trim().length >= 2 ? { scale: 0.98, y: 4 } : {}}
            >
              Cek Pesanan
              <Search className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={() => setShowCheckOrder(false)}
              className="w-full h-12 text-gray-500 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ← Kembali
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login */}
      <motion.button
        onClick={() => navigate('/admin/login')}
        className="mt-auto text-sm text-gray-400 hover:text-orange-500 transition-colors relative z-10"
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Admin Login
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
              style={{ boxShadow: card3D }}
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: '0 4px 0 0 #E4E4E7' }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <HelpCircle className="w-8 h-8 text-orange-500" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                Nama Sudah Terdaftar
              </h2>
              <p className="text-gray-500 text-center mb-6">
                Ada pesanan atas nama <span className="font-semibold text-orange-600">"{pendingName}"</span>.<br />
                Apakah ini Anda?
              </p>

              <div className="space-y-3">
                <motion.button
                  onClick={handleConfirmYes}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl"
                  style={{ boxShadow: button3D }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 4 }}
                >
                  Ya, Ini Saya
                </motion.button>
                <motion.button
                  onClick={handleConfirmNo}
                  className="w-full h-14 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200"
                  style={{ boxShadow: '0 2px 0 0 #E5E7EB' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 2 }}
                >
                  Bukan, Ini Orang Lain
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDifferentNameForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDifferentNameForm(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
              style={{ boxShadow: card3D }}
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: '0 4px 0 0 #E4E4E7' }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <User className="w-8 h-8 text-blue-500" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                Masukkan Nama Lain
              </h2>
              <p className="text-gray-500 text-center mb-6">
                Silakan masukkan nama Anda yang berbeda
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={differentName}
                  onChange={(e) => setDifferentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && differentName.trim().length >= 2 && handleDifferentNameSubmit()}
                  className="w-full h-14 text-lg text-center bg-white border-2 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 text-gray-700 placeholder:text-blue-300 transition-all"
                  style={{ boxShadow: '0 4px 0 0 #E4E4E7' }}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={handleDifferentNameSubmit}
                  disabled={differentName.trim().length < 2 || isChecking}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50"
                  style={{ 
                    boxShadow: differentName.trim().length >= 2 && !isChecking
                      ? '0 6px 0 0 #27272A, 0 8px 16px rgba(0, 0, 0, 0.24)' 
                      : '0 2px 0 0 #27272A' 
                  }}
                  whileHover={differentName.trim().length >= 2 && !isChecking ? { scale: 1.02 } : {}}
                  whileTap={differentName.trim().length >= 2 && !isChecking ? { scale: 0.98, y: 4 } : {}}
                >
                  {isChecking ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto"
                    />
                  ) : (
                    'Lanjutkan'
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowDifferentNameForm(false);
                    setDifferentName('');
                  }}
                  className="w-full h-14 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200"
                  style={{ boxShadow: '0 2px 0 0 #E5E7EB' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, y: 2 }}
                >
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Footer */}
      <motion.div 
        className="mt-auto flex flex-col items-center py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2 opacity-40">
          <img src="/kuramalogo.png" alt="kur𝛂ma" className="w-5 h-5 object-contain" />
          <span className="text-xs font-bold tracking-wider text-gray-400">kur𝛂ma</span>
        </div>
        <p className="text-[10px] text-gray-300 mt-1">Coffee</p>
      </motion.div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </motion.div>
  );
}

