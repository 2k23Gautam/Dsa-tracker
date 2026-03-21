import { motion } from 'framer-motion';
import Logo from './Logo.jsx';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-[#020617]"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, filter: 'blur(12px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1] // Custom snappy ease wrapper
        }}
        className="flex flex-col items-center gap-8"
      >
        <Logo layout="col" title="DSA" highlight="Tracker" />
        
        {/* Loading Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
