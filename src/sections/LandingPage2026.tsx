import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Coffee, 
  Clock,
  MapPin,
  Star,
  Instagram,
  Phone,
  ChevronRight,
  Bean,
  CupSoda,
  Croissant,
  Sparkles
} from 'lucide-react';

// Gradient Background - Warm Coffee Tones
function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100" />
      
      {/* Animated gradient orbs - Coffee colors only */}
      <motion.div 
        className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-[100px]"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-orange-200/30 rounded-full blur-[80px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -bottom-40 right-1/3 w-[500px] h-[500px] bg-amber-300/20 rounded-full blur-[90px]"
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6B3C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Glass Card Component
function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`group ${className}`}
    >
      <div className="relative bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-[0_8px_32px_rgba(251,146,60,0.08)] hover:shadow-[0_12px_40px_rgba(251,146,60,0.15)] transition-all duration-500">
        {children}
      </div>
    </motion.div>
  );
}

// Hero Section
function HeroSection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GradientBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-orange-200/50 backdrop-blur-sm mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Since 2024</span>
            </motion.div>
            
            {/* Logo & Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-5xl md:text-7xl font-black text-amber-950 tracking-tight mb-4">
                KURAMA
              </h1>
              <p className="text-xl md:text-2xl text-amber-700/80 font-light">
                Coffee & Cozy Space
              </p>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-amber-800/70 text-lg mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              Tempat nyaman untuk menikmati kopi specialty, 
              makanan lezat, dan suasana hangat bersama teman.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={() => navigate('/customer')}
                className="group px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Pesan Sekarang
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/70 backdrop-blur text-amber-800 font-semibold rounded-2xl border border-orange-200/50 hover:bg-white/90 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Admin Login
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Right Content - Logo Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-300/30 to-orange-300/30 rounded-full blur-3xl scale-110" />
              
              {/* Logo Container */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img 
                  src="/logokurama.png" 
                  alt="KURAMA Coffee" 
                  className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
                />
              </motion.div>
              
              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-16 h-16 bg-white/80 backdrop-blur rounded-2xl shadow-lg flex items-center justify-center"
                animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Coffee className="w-8 h-8 text-amber-600" />
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 w-14 h-14 bg-white/80 backdrop-blur rounded-2xl shadow-lg flex items-center justify-center"
                animate={{ y: [0, 5, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              >
                <Bean className="w-7 h-7 text-amber-700" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Coffee,
      title: 'Kopi Specialty',
      description: 'Biji kopi pilihan dari petani lokal, diolah dengan teknik roasting terbaik.',
    },
    {
      icon: Croissant,
      title: 'Pastry Fresh',
      description: 'Roti dan kue segar setiap hari, dipanggang dengan bahan berkualitas.',
    },
    {
      icon: CupSoda,
      title: 'Minuman Segar',
      description: 'Berbagai pilihan minuman non-kopi yang menyegarkan untuk semua selera.',
    },
  ];

  return (
    <section className="relative py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 font-semibold tracking-wider uppercase text-sm">Our Menu</span>
          <h2 className="text-4xl md:text-5xl font-bold text-amber-950 mt-3">
            Nikmati Kelezatan
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <GlassCard key={index} delay={index * 0.1}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">{feature.title}</h3>
              <p className="text-amber-700/70 leading-relaxed">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Info Section
function InfoSection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-50/50" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image Placeholder with Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
              <img 
                src="/logokurama.png" 
                alt="KURAMA" 
                className="w-48 h-48 object-contain opacity-50"
              />
              {/* Decorative elements */}
              <div className="absolute top-6 left-6 w-20 h-20 bg-white/40 rounded-full blur-xl" />
              <div className="absolute bottom-6 right-6 w-32 h-32 bg-orange-300/30 rounded-full blur-2xl" />
            </div>
          </motion.div>
          
          {/* Right - Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-amber-600 font-semibold tracking-wider uppercase text-sm">Tentang Kami</span>
            <h2 className="text-4xl md:text-5xl font-bold text-amber-950 mt-3 mb-6">
              Ruang Nyaman <br/> untuk Berbagi Cerita
            </h2>
            <p className="text-amber-800/70 text-lg mb-8 leading-relaxed">
              KURAMA hadir sebagai tempat berkumpul yang nyaman, dengan kopi berkualitas 
              dan makanan lezat. Kami percaya setiap cangkir kopi punya cerita, 
              dan kami ingin menjadi bagian dari cerita Anda.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                { icon: Clock, text: 'Buka Setiap Hari: 08.00 - 22.00' },
                { icon: MapPin, text: 'Jl. Raya No. 123, Jakarta' },
                { icon: Phone, text: '+62 812-3456-7890' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-amber-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <motion.button
              onClick={() => navigate('/customer')}
              className="group flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors"
              whileHover={{ x: 5 }}
            >
              Lihat Menu Lengkap
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    { name: 'Andi', text: 'Kopinya enak banget, tempatnya juga nyaman buat kerja.', rating: 5 },
    { name: 'Sarah', text: 'Pastry-nya fresh dan kopi-nya selalu konsisten.', rating: 5 },
    { name: 'Budi', text: 'Pelayanan ramah, suasananya cozy. Recommended!', rating: 5 },
  ];

  return (
    <section className="relative py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 font-semibold tracking-wider uppercase text-sm">Testimoni</span>
          <h2 className="text-4xl md:text-5xl font-bold text-amber-950 mt-3">
            Apa Kata Mereka
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <GlassCard key={index} delay={index * 0.1}>
              <div className="flex gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-amber-800/80 mb-4 leading-relaxed">"{item.text}"</p>
              <p className="font-semibold text-amber-900">- {item.name}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-600" />
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Kunjungi KURAMA Hari Ini
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Rasakan kopi terbaik dan suasana nyaman bersama orang tersayang.
          </p>
          
          <motion.button
            onClick={() => navigate('/customer')}
            className="px-10 py-5 bg-white text-amber-700 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Pesan Sekarang
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="relative py-12 bg-amber-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logokurama.png" alt="KURAMA" className="w-10 h-10 object-contain" />
            <div>
              <span className="text-xl font-bold text-white block">KURAMA</span>
              <span className="text-xs text-amber-400">Coffee & Cozy Space</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </a>
          </div>
          
          <p className="text-amber-400/60 text-sm">
            2024 KURAMA Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage2026() {
  return (
    <div className="min-h-screen bg-amber-50">
      <HeroSection />
      <FeaturesSection />
      <InfoSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
