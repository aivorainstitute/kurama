import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Clock, 
  Shield, 
  Smartphone,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Coffee,
  UtensilsCrossed,
  ChefHat
} from 'lucide-react';

// Gradient Mesh Background
function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      
      {/* Animated gradient orbs */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/30 rounded-full blur-[120px]"
        animate={{ 
          x: [0, 50, 0], 
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]"
        animate={{ 
          x: [0, -40, 0], 
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px]"
        animate={{ 
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Floating Elements
function FloatingElements() {
  const elements = [
    { icon: Coffee, delay: 0, x: '10%', y: '20%' },
    { icon: UtensilsCrossed, delay: 0.5, x: '85%', y: '15%' },
    { icon: ChefHat, delay: 1, x: '15%', y: '70%' },
    { icon: Star, delay: 1.5, x: '80%', y: '75%' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((item, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: 1,
            y: [0, -20, 0]
          }}
          transition={{ 
            delay: item.delay,
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <item.icon className="w-8 h-8 text-orange-400" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Glass Card Component
function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className={`relative group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-500 hover:border-white/20">
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
      <GradientMesh />
      <FloatingElements />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-white/80">Next-Gen Food Ordering 2026</span>
        </motion.div>
        
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <img 
                src="/logo.png" 
                alt="KURAMA" 
                className="w-24 h-24 object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
              KURAMA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mt-4 font-light tracking-wide">
            Experience the Future of Dining
          </p>
        </motion.div>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
        >
          <motion.button
            onClick={() => navigate('/customer')}
            className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white font-bold text-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Pesan Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-full text-white font-semibold text-lg border border-white/20 backdrop-blur-xl hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Admin Login
          </motion.button>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-20"
        >
          {[
            { value: '10K+', label: 'Happy Customers' },
            { value: '500+', label: 'Menu Items' },
            { value: '4.9', label: 'App Rating' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Features Bento Grid
function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Order in seconds with our optimized workflow. No more waiting in long queues.',
      size: 'large',
      color: 'from-orange-500/20 to-amber-500/20'
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track your order status live from kitchen to pickup.',
      size: 'small',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Multiple payment options with end-to-end encryption.',
      size: 'small',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Seamless experience across all devices. Native-like performance.',
      size: 'medium',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Users,
      title: 'Group Orders',
      description: 'Split bills and order together with friends and colleagues effortlessly.',
      size: 'medium',
      color: 'from-rose-500/20 to-orange-500/20'
    }
  ];

  return (
    <section className="relative py-32 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-orange-400 font-semibold tracking-wider uppercase text-sm">Features</span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mt-4">
            Why Choose <span className="text-orange-400">KURAMA</span>?
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlassCard 
              key={index}
              delay={index * 0.1}
              className={feature.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Menu Preview Section
function MenuPreviewSection() {
  const categories = [
    { name: 'Signatures', items: '12 items', image: 'bg-gradient-to-br from-orange-400 to-red-500' },
    { name: 'Coffee', items: '8 items', image: 'bg-gradient-to-br from-amber-600 to-orange-700' },
    { name: 'Food', items: '20 items', image: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { name: 'Desserts', items: '15 items', image: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  ];

  return (
    <section className="relative py-32 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-slate-900 to-slate-900" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-orange-400 font-semibold tracking-wider uppercase text-sm">Menu</span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mt-4">
            Delicious <span className="text-orange-400">Choices</span>
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden mb-4">
                <div className={`absolute inset-0 ${cat.image} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                  <p className="text-white/70 text-sm">{cat.items}</p>
                </div>
              </div>
            </motion.div>
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
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)`,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to <span className="text-orange-400">Order</span>?
          </h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the future of food ordering today.
          </p>
          
          <motion.button
            onClick={() => navigate('/customer')}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white font-bold text-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Now
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="relative py-12 bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="KURAMA" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white">KURAMA</span>
          </div>
          
          <p className="text-white/40 text-sm">
            2026 KURAMA Food Ordering. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            {['About', 'Contact', 'Privacy'].map((link) => (
              <a key={link} href="#" className="text-white/40 hover:text-white transition-colors text-sm">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage2026() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <MenuPreviewSection />
      <CTASection />
      <Footer />
    </div>
  );
}
