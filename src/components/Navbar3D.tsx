import { motion } from 'framer-motion';
import { ChevronLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Brand Component
function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/kuramalogo-white.png" 
        alt="kur𝛂ma" 
        className={`object-contain drop-shadow-md ${small ? 'w-8 h-8' : 'w-10 h-10'}`}
      />
      <span className={`font-black tracking-wider text-white ${small ? 'text-lg' : 'text-xl'}`}>
        kur𝛂ma
      </span>
    </div>
  );
}

interface Navbar3DProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  showHome?: boolean;
  rightContent?: React.ReactNode;
}

export function Navbar3D({ title, showBack = true, backTo, showHome = true, rightContent }: Navbar3DProps) {
  const navigate = useNavigate();

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-3xl mb-6"
      style={{
        boxShadow: '0 4px 0 0 #18181B, 0 8px 16px rgba(0, 0, 0, 0.18)'
      }}
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        {/* Left - Back Button */}
        <div className="w-12">
          {showBack && (
            <motion.button 
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, y: 2 }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>

        {/* Center - Title */}
        <h1 className="text-lg font-bold text-white">
          {title}
        </h1>

        {/* Right - Home or Custom */}
        <div className="w-12 flex justify-end">
          {rightContent ? (
            rightContent
          ) : showHome ? (
            <motion.button 
              onClick={() => navigate('/admin/dashboard')}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, y: 2 }}
            >
              <Home className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </motion.header>
  );
}

// Simple version for customer pages
export function CustomerNavbar3D({ 
  title, 
  showBack = true, 
  backTo,
  rightIcon
}: { 
  title: string; 
  showBack?: boolean; 
  backTo?: string;
  rightIcon?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 mb-6"
      style={{
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 4px 0 0 #18181B, 0 8px 16px rgba(0, 0, 0, 0.18)'
      }}
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-5 py-4 flex items-center justify-between">
        {/* Left */}
        <div className="w-10">
          {showBack ? (
            <motion.button 
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, y: 2 }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
          ) : null}
        </div>

        {/* Center - Show Brand on homepage, title on other pages */}
        {showBack ? (
          <h1 className="text-lg font-bold text-white">
            {title}
          </h1>
        ) : (
          <BrandLogo small />
        )}

        {/* Right */}
        <div className="w-10 flex justify-end">
          {rightIcon && (
            <motion.div
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, y: 2 }}
            >
              {rightIcon}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

