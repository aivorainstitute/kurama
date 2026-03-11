import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Sparkles,
  Shield,
  User,
  Loader2,
  Coffee
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ModernLoginProps {
  setIsAdmin: (value: boolean) => void;
  setIsCashier?: (value: boolean) => void;
}

// Animated Background - Warm Coffee Colors
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient - warm tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200" />
      
      {/* Animated shapes - no purple */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        
        <motion.circle
          cx="20%"
          cy="30%"
          r="300"
          fill="url(#grad1)"
          animate={{
            cx: ['20%', '25%', '20%'],
            cy: ['30%', '35%', '30%'],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.circle
          cx="80%"
          cy="70%"
          r="250"
          fill="url(#grad1)"
          animate={{
            cx: ['80%', '75%', '80%'],
            cy: ['70%', '65%', '70%'],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(180,83,9,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,83,9,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

export default function ModernLogin({ setIsAdmin, setIsCashier }: ModernLoginProps) {
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
    
    // Coba login dari database dulu
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();
      
      if (user) {
        // Login dari database berhasil
        if (user.role === 'admin') {
          setIsAdmin(true);
          toast.success('Login admin berhasil!', {
            icon: <Sparkles className="w-4 h-4 text-amber-500" />
          });
          navigate('/admin/dashboard');
        } else if (user.role === 'kasir') {
          setIsCashier?.(true);
          toast.success('Login kasir berhasil!', {
            icon: <Sparkles className="w-4 h-4 text-blue-500" />
          });
          navigate('/cashir');
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      // Database error, fallback ke hardcoded
    }
    
    // Fallback ke hardcoded (kalau tabel users belum ada)
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        setIsAdmin(true);
        toast.success('Login admin berhasil!', {
          icon: <Sparkles className="w-4 h-4 text-amber-500" />
        });
        navigate('/admin/dashboard');
      } else if (username === 'kasir' && password === 'kasir123') {
        setIsCashier?.(true);
        toast.success('Login kasir berhasil!', {
          icon: <Sparkles className="w-4 h-4 text-blue-500" />
        });
        navigate('/cashier');
      } else {
        toast.error('Username atau password salah');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />
      
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-amber-700/60 hover:text-amber-800 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/70 border border-amber-200 flex items-center justify-center group-hover:bg-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline font-medium">Kembali</span>
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 mb-5"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <img 
                  src="/kuramalogo.png" 
                  alt="kur𝛂ma" 
                  className="w-16 h-16 object-contain"
                />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-amber-950 mb-1">
                Admin Login
              </h1>
              <p className="text-amber-700/60">
                kur𝛂ma Coffee & Cozy Space
              </p>
            </motion.div>
          </div>

          {/* Login Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-xl border border-amber-200/50 rounded-3xl p-8 shadow-xl shadow-amber-100"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-amber-400 group-focus-within:text-amber-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full h-12 pl-12 pr-4 bg-white/80 border border-amber-200 rounded-xl text-amber-900 placeholder:text-amber-300 
                             focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 
                             transition-all"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-amber-400 group-focus-within:text-amber-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-12 bg-white/80 border border-amber-200 rounded-xl text-amber-900 placeholder:text-amber-300 
                             focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 
                             transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl 
                         shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300
                         disabled:opacity-70 transition-all mt-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Coffee className="w-5 h-5" />
                      Masuk
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Security Badge */}
            <div className="mt-6 pt-5 border-t border-amber-200/50">
              <div className="flex items-center justify-center gap-2 text-amber-600/50 text-xs">
                <Shield className="w-4 h-4" />
                <span>Koneksi aman dengan enkripsi SSL</span>
              </div>
            </div>
          </motion.div>

          {/* Help Text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-amber-700/40 text-sm mt-6"
          >
            Butuh bantuan? Hubungi{' '}
            <a href="#" className="text-amber-600 hover:text-amber-700 transition-colors">
              support@kurama.id
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
