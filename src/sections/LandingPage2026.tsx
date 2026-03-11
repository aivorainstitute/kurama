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
  Croissant
} from 'lucide-react';

// Monochrome Background
function MonochromeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating elements - monochrome */}
      <motion.div 
        className="absolute top-20 right-10 w-64 h-64 bg-gray-100 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-96 h-96 bg-gray-50 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Glass Card Component - Monochrome
function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`group ${className}`}
    >
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500">
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
      <MonochromeBackground />
      
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-6"
            >
              <span>Est. 2024</span>
            </motion.div>
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-6xl md:text-8xl font-black text-black tracking-tighter mb-4">
                kur𝛂ma
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 font-light tracking-wide">
                Coffee & Cozy Space
              </p>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-lg mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              A comfortable place to enjoy specialty coffee, 
              delicious food, and warm moments with friends.
            </motion.p>
            
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={() => navigate('/customer')}
                className="group px-8 py-4 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Order Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
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
              {/* Logo Container */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img 
                  src="/kuramalogo.png" 
                  alt="kur𝛂ma Coffee" 
                  className="w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl"
                />
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
      title: 'Specialty Coffee',
      description: 'Premium beans from local farmers, roasted with the best techniques.',
    },
    {
      icon: Croissant,
      title: 'Fresh Pastry',
      description: 'Freshly baked bread and cakes every day with quality ingredients.',
    },
    {
      icon: CupSoda,
      title: 'Refreshing Drinks',
      description: 'Various non-coffee beverages that are refreshing for everyone.',
    },
  ];

  return (
    <section className="relative py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-gray-500 font-medium tracking-wider uppercase text-sm">Our Menu</span>
          <h2 className="text-4xl md:text-5xl font-bold text-black mt-3">
            Taste the Goodness
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <GlassCard key={index} delay={index * 0.1}>
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
    <section className="relative py-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-center"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center">
              <img 
                src="/kuramalogo.png" 
                alt="kur𝛂ma" 
                className="w-48 h-48 object-contain opacity-80"
              />
            </div>
          </motion.div>
          
          {/* Right - Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gray-500 font-medium tracking-wider uppercase text-sm">About Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-black mt-3 mb-6">
              A Cozy Space <br/> to Share Stories
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              kur𝛂ma is a comfortable gathering place with quality coffee 
              and delicious food. We believe every cup of coffee has a story, 
              and we want to be part of yours.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                { icon: Clock, text: 'Open Daily: 08:00 - 22:00' },
                { icon: MapPin, text: 'Jl. A. Yani No. 45, Tanjung, Tabalong' },
                { icon: Phone, text: '+62 821-5399-8877' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-black" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <motion.button
              onClick={() => navigate('/customer')}
              className="group flex items-center gap-2 text-black font-semibold hover:text-gray-600 transition-colors"
              whileHover={{ x: 5 }}
            >
              View Full Menu
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
    { name: 'Andi', text: 'The coffee is really good, the place is also comfortable for working.', rating: 5 },
    { name: 'Sarah', text: 'The pastries are fresh and the coffee is always consistent.', rating: 5 },
    { name: 'Budi', text: 'Friendly service, cozy atmosphere. Highly recommended!', rating: 5 },
  ];

  return (
    <section className="relative py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-gray-500 font-medium tracking-wider uppercase text-sm">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-bold text-black mt-3">
            What They Say
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <GlassCard key={index} delay={index * 0.1}>
              <div className="flex gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-black text-black" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">"{item.text}"</p>
              <p className="font-semibold text-black">- {item.name}</p>
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
    <section className="relative py-24 overflow-hidden bg-black">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Visit kur𝛂ma Today
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Experience the best coffee and comfortable atmosphere with your loved ones.
          </p>
          
          <motion.button
            onClick={() => navigate('/customer')}
            className="px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-100 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Order Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="relative py-12 bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/kuramalogo.png" alt="kur𝛂ma" className="w-10 h-10 object-contain invert" />
            <div>
              <span className="text-xl font-bold text-white block">kur𝛂ma</span>
              <span className="text-xs text-gray-500">Coffee & Cozy Space</span>
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
          
          <p className="text-gray-600 text-sm">
            2024 kur𝛂ma Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage2026() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <HeroSection />
      <FeaturesSection />
      <InfoSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
