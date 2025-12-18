import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface DisplayPageProps {
  eventId:  number;
}

export function DisplayPage({ eventId }: DisplayPageProps) {
  const { isConnected, isDrawing, currentCategory, rollingParticipants, winners } = useSocket(eventId);
  const prevWinnersRef = useRef(0);

  useEffect(() => {
    if (winners.length > 0 && winners. length !== prevWinnersRef.current) {
      console.log('🎉 Winners announced! ');
    }
    prevWinnersRef.current = winners. length;
  }, [winners]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Connection Status */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isConnected ?  'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Waiting State */}
        {! currentCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity:  1 }} className="text-center">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4">Pengundian Hadiah</h1>
            <p className="text-xl text-white/60">Menunggu pengundian dimulai...</p>
          </motion. div>
        )}

        {/* Category Info */}
        {currentCategory && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-2">{currentCategory.name}</h2>
            <p className="text-2xl text-white/70">{currentCategory.description}</p>
            <p className="text-lg text-yellow-400 mt-2">{currentCategory.winner_count} Pemenang</p>
          </motion. div>
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
                  className="bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-yellow-400/50"
                >
                  <p className="text-white/60 text-sm mb-2">Pemenang #{i + 1}</p>
                  <p className="text-3xl font-bold truncate">{p. name}</p>
                  <p className="text-yellow-400 font-mono">{p.coupon_code}</p>
                </motion. div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
              <p className="text-xl">Mengundi pemenang...</p>
            </div>
          </div>
        )}

        {/* Winners Display */}
        <AnimatePresence>
          {! isDrawing && winners.length > 0 && (
            <motion.div
              initial={{ opacity:  0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl"
            >
              <h2 className="text-5xl font-bold text-yellow-400 text-center mb-8">🎉 SELAMAT!  🎉</h2>
              <div className="grid gap-6" style={{
                gridTemplateColumns: `repeat(${Math. min(winners.length, 3)}, 1fr)`
              }}>
                {winners.map((winner, i) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, y: 50, rotateY: -90 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-center"
                  >
                    <Trophy className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-white/80 text-sm">Pemenang #{winner.position}</p>
                    <p className="text-3xl font-bold truncate">{winner. participant.name}</p>
                    <p className="font-mono text-lg">{winner.participant. coupon_code}</p>
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