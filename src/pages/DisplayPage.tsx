import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface DisplayPageProps {
  eventId: number;
  onBack: () => void;
}

export function DisplayPage({ eventId, onBack }: DisplayPageProps) {
  const { isConnected, isDrawing, currentCategory, rollingParticipants, winners } = useSocket(eventId);
  const prevWinnersRef = useRef(0);
  const [isMuted] = useState(true); // Placeholder for sound toggle

  useEffect(() => {
    if (winners.length > 0 && winners.length !== prevWinnersRef.current) {
      console.log('🎉 Winners announced!');
      // Placeholder for sound effect
      if (!isMuted) {
        // Future: play winner.mp3
      }
    }
    prevWinnersRef.current = winners.length;
  }, [winners, isMuted]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Header with Banner */}
      <div className="bg-white border-b border-[#E2E8F0]">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-[#3B82F6] to-[#22C55E] flex items-center justify-center relative overflow-hidden">
          <img 
            src="/images/banner-event.png" 
            alt="Event Banner"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="relative z-10 text-white text-center">
            <h1 className="text-5xl font-bold drop-shadow-lg">Pengundian Hadiah</h1>
          </div>
        </div>
        
        {/* Header Controls */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Waiting State */}
        {!currentCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Trophy className="w-24 h-24 text-[#F59E0B] mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4 text-[#1E293B]">Pengundian Hadiah</h1>
            <p className="text-xl text-[#64748B]">Menunggu pengundian dimulai...</p>
          </motion.div>
        )}

        {/* Category Info */}
        {currentCategory && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-2 text-[#1E293B]">{currentCategory.name}</h2>
            <p className="text-2xl text-[#64748B]">{currentCategory.description}</p>
            <p className="text-lg text-[#F59E0B] mt-2 font-semibold">{currentCategory.winner_count} Pemenang</p>
          </motion.div>
        )}

        {/* Rolling Display */}
        {isDrawing && rollingParticipants.length > 0 && (
          <div className="w-full max-w-4xl">
            <div className="grid gap-6" style={{
              gridTemplateColumns: `repeat(${Math.min(rollingParticipants.length, 3)}, 1fr)`
            }}>
              {rollingParticipants.map((p, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                  className="bg-white rounded-xl p-8 border-2 border-[#3B82F6] shadow-lg"
                >
                  <p className="text-[#64748B] text-sm mb-2">Pemenang #{i + 1}</p>
                  <p className="text-3xl font-bold truncate text-[#1E293B]">{p.name}</p>
                  <p className="text-[#3B82F6] font-mono text-lg">{p.coupon_code}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
              <p className="text-xl text-[#1E293B]">Mengundi pemenang...</p>
            </div>
          </div>
        )}

        {/* Winners Display - Compact List Format */}
        <AnimatePresence>
          {!isDrawing && winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl"
            >
              <h2 className="text-5xl font-bold text-[#22C55E] text-center mb-8">🎉 SELAMAT! 🎉</h2>
              
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-lg p-6 space-y-3">
                {winners.map((winner, i) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] hover:border-[#22C55E] transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {winner.position}
                      </div>
                      <div className="flex-1">
                        <span className="font-mono text-[#3B82F6] font-semibold">{winner.participant.coupon_code}</span>
                        <span className="text-[#64748B] mx-2">-</span>
                        <span className="font-semibold text-[#1E293B]">{winner.participant.name}</span>
                      </div>
                    </div>
                    <Trophy className="w-6 h-6 text-[#F59E0B]" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}