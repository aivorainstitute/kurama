import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Sparkles,
  Shield,
  User,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ModernLoginProps {
  setIsAdmin: (value: boolean) => void;
}

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
      
      {/* Animated shapes */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        
        {/* Floating circles */}
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
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

// Glass Card Component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Card */}
      <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden">
        {/* Inner gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  showPasswordToggle,
  onTogglePassword
}: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ElementType;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/70 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Icon className="w-5 h-5 text-white/40 group-focus-within:text-orange-400 transition-colors" />
        </div>
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 
                     focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] 
                     transition-all duration-300"
        />
        
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white/70 transition-colors"
          >
            {type === 'password' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ModernLogin({ setIsAdmin }: ModernLoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        toast.success('Login berhasil!', {
          icon: <Sparkles className="w-4 h-4 text-orange-400" />
        });
        navigate('/admin/dashboard');
      } else {
        toast.error('Username atau password salah');
      }
      setIsLoading(false);
    }, 1500);
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
        className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline">Kembali</span>
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo Section */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <img 
                  src="/logo.png" 
                  alt="KURAMA" 
                  className="w-12 h-12 object-contain"
                />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Admin Login
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/50"
            >
              Masuk ke dashboard admin KURAMA
            </motion.p>
          </div>

          {/* Login Form */}
          <GlassCard className="group">
            <form onSubmit={handleLogin} className="space-y-6">
              <InputField
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                icon={User}
              />
              
              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                showPasswordToggle
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-5 h-5 rounded-md bg-white/5 border border-white/20 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all" />
                    <svg 
                      className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/50 group-hover:text-white/70 transition-colors">Ingat saya</span>
                </label>
                
                <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors">
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white font-bold text-lg overflow-hidden group disabled:opacity-70"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Masuk
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Security Badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-6 border-t border-white/5"
            >
              <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
                <Shield className="w-4 h-4" />
                <span>Koneksi aman dengan enkripsi SSL</span>
              </div>
            </motion.div>
          </GlassCard>

          {/* Help Text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-white/30 text-sm mt-8"
          >
            Butuh bantuan? Hubungi{' '}
            <a href="#" className="text-orange-400/70 hover:text-orange-400 transition-colors">
              support@kurama.id
            </a>
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 right-8 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white/60 text-sm">Sistem Online</span>
        </motion.div>
      </div>
    </div>
  );
}
