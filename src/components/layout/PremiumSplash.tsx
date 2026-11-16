import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFounders } from '@/hooks/useFamily';

export default function PremiumSplash({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const { data: founders = [] } = useFounders();

  const founderHead = founders[0];
  const founderPartner = founders[1];
  const founderPhoto =
    founderHead?.profile_photo_url ||
    founderPartner?.profile_photo_url ||
    '/uploads/founders.jpg';

  useEffect(() => {
    // Check if splash was already shown in this session
    const shown = sessionStorage.getItem('KKKC_premium_splash_viewed');
    if (shown) {
      setVisible(false);
      onComplete?.();
      return;
    }

    // Auto-dismiss smoothly after 3.8 seconds – guaranteed
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3800);

    // Safety fallback: dismiss after 5 seconds no matter what
    const safetyTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('KKKC_premium_splash_viewed', 'true');
    setVisible(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="premium-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12100e] text-white cursor-pointer select-none overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 45%, rgba(200, 135, 31, 0.22) 0%, rgba(18, 16, 14, 0.96) 65%, #0d0b0a 100%)',
          }}
        >
          {/* Subtle geometric luxury pattern overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Central Luxury Container */}
          <div className="relative flex flex-col items-center text-center px-6 max-w-xl z-10">
            {/* Top Malayalam Association Name with subtle golden shimmer */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4"
            >
             
            </motion.div>

            {/* Medallion: Founders Portrait with Glowing Golden Aura */}
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-5"
            >
              {/* Outer pulsing gold ambient glow */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-amber-600/30 via-amber-400/20 to-transparent blur-xl animate-pulse" />

              {/* Decorative ornate gold ring */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_35px_rgba(200,135,31,0.35)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 border border-amber-200/40">
                  <img
                    src={founderPhoto}
                    alt="KKKC Founders"
                    className="w-full h-full object-cover object-top filter contrast-105"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/uploads/founders.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Heritage Crest Seal icon with Estd. 2007 */}
              <div className="absolute -bottom-2.5 inset-x-0 flex justify-center">
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-stone-950 text-[10px] sm:text-xs font-bold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-lg border border-amber-300/70">
                  Estd. 2007
                </span>
              </div>
              
            </motion.div>

            {/* Title: KKKC in Royal Serif with Shimmer */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-1"
            >
              
              <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-wider bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(200,135,31,0.4)]">
                K K K C
              </h1>
            </motion.div>

            {/* Sub-label with luxury gold letter-spacing */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, letterSpacing: '0.38em' }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-xs sm:text-sm font-medium uppercase text-amber-300/90 mb-3"
            >
              F A M I L Y &nbsp; H E R I T A G E
            </motion.p>

            {/* Fine Golden Divider */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 110, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-3.5"
            />

            {/* Malayalam Location & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-1"
            >
              <p className="text-xs sm:text-sm text-stone-300 font-medium font-['Manjari','Noto_Sans_Malayalam',sans-serif] tracking-wider">
                ചേവായൂർ, കോഴിക്കോട് - 673 017
              </p>
              <p className="font-serif italic text-xs sm:text-xs text-amber-200/70 tracking-wide">
                Our Roots, Our Story, Our Living Legacy
              </p>
            </motion.div>

            {/* Subtle Progress Bar & Enter Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              <div className="w-36 h-[2px] bg-stone-800/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  className="w-full h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                />
              </div>
              <span className="text-[10px] text-stone-500 tracking-widest uppercase">
                Tap anywhere to enter
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
