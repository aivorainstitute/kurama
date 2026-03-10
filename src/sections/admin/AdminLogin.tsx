import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginProps {
  setIsAdmin: (value: boolean) => void;
}

export default function AdminLogin({ setIsAdmin }: AdminLoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        setIsAdmin(true);
        toast.success('Login berhasil!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Username atau password salah');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Brand & Lock Icon */}
      <motion.div 
        className="mb-8 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4"
        >
          <img 
            src="/kuramalogo.png" 
            alt="kur𝛂ma" 
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
        </motion.div>
        
        {/* Brand Name */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
            kur𝛂ma
          </h1>
          <p className="text-xs font-medium text-orange-400/80 tracking-[0.3em] uppercase">
            Admin Portal
          </p>
        </div>

        <motion.div 
          className="w-16 h-16 bg-gradient-to-br from-orange-100 to-white rounded-2xl flex items-center justify-center"
          style={{ boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2)' }}
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Lock className="w-8 h-8 text-orange-500" strokeWidth={1.5} />
            </motion.div>
            <motion.div 
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        className="text-2xl font-bold text-gray-800 mb-2 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Selamat Datang
      </motion.h1>
      <motion.p 
        className="text-gray-500 mb-10 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Silakan masuk untuk mengelola stok<br/>& pesanan
      </motion.p>

      {/* Login Form */}
      <motion.form 
        onSubmit={handleLogin} 
        className="w-full max-w-sm space-y-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-2">
          <label className="text-orange-500 text-sm uppercase tracking-wider font-medium">
            USERNAME / EMAIL
          </label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
          >
            <input
              type="text"
              placeholder="admin@zenfood.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-14 text-base bg-white border-2 border-orange-200 rounded-2xl px-4 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-700 placeholder:text-orange-300 transition-all"
            />
          </motion.div>
        </div>

        <div className="space-y-2">
          <label className="text-orange-500 text-sm uppercase tracking-wider font-medium">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 text-base bg-white border-2 border-orange-200 rounded-2xl px-4 pr-12 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-700 placeholder:text-orange-300 transition-all"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600"
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          style={{
            boxShadow: isLoading ? 'none' : '0 6px 0 0 #C2410C, 0 8px 24px rgba(249, 115, 22, 0.4)'
          }}
          whileHover={!isLoading ? { 
            scale: 1.02,
            boxShadow: '0 4px 0 0 #C2410C, 0 6px 16px rgba(249, 115, 22, 0.4)'
          } : {}}
          whileTap={!isLoading ? { 
            scale: 0.98,
            y: 4,
            boxShadow: '0 0 0 0 #C2410C, 0 2px 8px rgba(249, 115, 22, 0.4)'
          } : {}}
        >
          {isLoading ? (
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              Memuat...
            </motion.div>
          ) : 'Masuk'}
        </motion.button>
      </motion.form>

      {/* Forgot Password */}
      <motion.button 
        className="mt-6 text-orange-400 hover:text-orange-600 transition-colors text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
      >
        Lupa kata sandi?
      </motion.button>

      {/* Footer */}
      <motion.div 
        className="mt-auto pt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-xs text-orange-300 uppercase tracking-widest">
          ANTRI ADMIN DASHBOARD
        </p>
      </motion.div>

      {/* Back to Customer */}
      <motion.button
        onClick={() => navigate('/')}
        className="mt-4 text-sm text-orange-400 hover:text-orange-600 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
      >
        Kembali ke Customer App
      </motion.button>
    </motion.div>
  );
}
