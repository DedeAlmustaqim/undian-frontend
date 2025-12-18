import { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Trophy, Users, RotateCcw, Upload, ArrowLeft } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { eventApi, categoryApi, participantApi, drawingApi } from '../services/api';
import { emitCategoryChange, emitDrawingStart, emitDrawingRoll, emitWinnerSelected } from '../services/socket';
import type { Event, PrizeCategory, Participant } from '../types';

interface ControlPageProps {
  eventId: number;
  onBack: () => void;
}

export function ControlPage({ eventId, onBack }: ControlPageProps) {
  const { isConnected, winners } = useSocket(eventId);

  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<PrizeCategory[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PrizeCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);

  const rollingInterval = useRef<number | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventRes, categoriesRes, participantsRes] = await Promise.all([
          eventApi.getById(eventId),
          categoryApi.getAll(eventId),
          participantApi.getAll(eventId),
        ]);
        setEvent(eventRes.data);
        setCategories(categoriesRes.data);
        setParticipants(participantsRes.data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  // Refresh categories when winners change
  useEffect(() => {
    if (winners.length > 0 && selectedCategory) {
      categoryApi.getAll(eventId).then(res => {
        setCategories(res.data);
        const updated = res.data.find(c => c.id === selectedCategory.id);
        if (updated) setSelectedCategory(updated);
      });
    }
  }, [winners, eventId, selectedCategory]);

  const handleSelectCategory = (category: PrizeCategory) => {
    if (isRolling) return;
    setSelectedCategory(category);
    emitCategoryChange(eventId, category);
  };

  const getEligibleParticipants = (): Participant[] => {
    if (!selectedCategory) return [];
    const winnerIds = new Set(selectedCategory.winners?.map(w => w.participant.id) || []);
    return participants.filter(p => p.is_eligible && !winnerIds.has(p.id));
  };

  const handleStartDrawing = async () => {
    if (!selectedCategory || isRolling) return;

    const eligible = getEligibleParticipants();
    if (eligible.length === 0) {
      alert('Tidak ada peserta eligible!');
      return;
    }

    setIsRolling(true);
    emitDrawingStart(eventId, selectedCategory);

    // Rolling animation - continues until manual STOP
    rollingInterval.current = window.setInterval(() => {
      const count = selectedCategory.winner_count;
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      const rolling = shuffled.slice(0, Math.min(count, shuffled.length)).map(p => ({
        id: p.id,
        name: p.name,
        coupon_code: p.coupon_code,
      }));
      emitDrawingRoll(eventId, rolling);
    }, 100);
  };

  const handleStopDrawing = async () => {
    if (!selectedCategory) return;

    if (rollingInterval.current) clearInterval(rollingInterval.current);

    try {
      const response = await drawingApi.selectWinners(eventId, selectedCategory.id);
      emitWinnerSelected(eventId, selectedCategory.id, response.data);

      // Refresh
      const categoriesRes = await categoryApi.getAll(eventId);
      setCategories(categoriesRes.data);
      const updated = categoriesRes.data.find(c => c.id === selectedCategory.id);
      if (updated) setSelectedCategory(updated);
    } catch (error) {
      console.error('Failed to select winners:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const handleReroll = async (winnerId: number) => {
    if (!selectedCategory) return;
    try {
      await drawingApi.reroll(eventId, selectedCategory.id, winnerId);
      const categoriesRes = await categoryApi.getAll(eventId);
      setCategories(categoriesRes.data);
      const updated = categoriesRes.data.find(c => c.id === selectedCategory.id);
      if (updated) setSelectedCategory(updated);
    } catch (error) {
      console.error('Failed to reroll:', error);
    }
  };

  const handleReset = async () => {
    if (!selectedCategory || !confirm('Reset semua pemenang di kategori ini?')) return;
    try {
      await drawingApi.reset(eventId, selectedCategory.id);
      const categoriesRes = await categoryApi.getAll(eventId);
      setCategories(categoriesRes.data);
      const updated = categoriesRes.data.find(c => c.id === selectedCategory.id);
      if (updated) setSelectedCategory(updated);
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const res = await participantApi.import(eventId, e.target.files[0]);
      alert(`Berhasil import ${res.data.imported_count} peserta`);
      const participantsRes = await participantApi.getAll(eventId);
      setParticipants(participantsRes.data);
    } catch {
      alert('Gagal import');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header with Banner */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0]">
        {/* Banner - Small */}
        <div className="h-24 bg-gradient-to-r from-[#3B82F6] to-[#22C55E] flex items-center justify-center relative overflow-hidden">
          <img 
            src="/images/banner-event.png" 
            alt="Event Banner"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="relative z-10 text-white text-center">
            <h1 className="text-2xl font-bold drop-shadow-lg">{event?.name}</h1>
          </div>
        </div>
        
        {/* Header Controls */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
              <span className="text-[#64748B]">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          <label className="cursor-pointer px-3 py-2 bg-[#F8FAFC] hover:bg-[#E2E8F0] rounded-lg flex items-center gap-2 text-sm transition">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="p-4 grid lg:grid-cols-2 gap-4">
        {/* Categories */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-[#1E293B]">
            <Trophy className="w-5 h-5 text-[#F59E0B]" /> Kategori Hadiah
          </h2>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              disabled={isRolling}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedCategory?.id === cat.id
                  ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                  : 'border-[#E2E8F0] bg-white hover:border-[#3B82F6]/30'
              } ${isRolling ? 'opacity-50' : ''}`}
            >
              <p className="font-semibold text-[#1E293B]">{cat.name}</p>
              <p className="text-sm text-[#64748B]">{cat.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-[#3B82F6] flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> {cat.winner_count}
                </span>
                <span className="text-[#22C55E] flex items-center gap-1">
                  <Users className="w-4 h-4" /> {cat.eligible_count}
                </span>
                {cat.is_completed && <span className="text-[#22C55E]">✓ Selesai</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <h2 className="font-semibold text-[#1E293B]">Kontrol Pengundian</h2>

          {selectedCategory ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
              <div className="bg-[#3B82F6]/5 rounded-lg p-4 border border-[#3B82F6]/20">
                <p className="text-sm text-[#64748B]">Kategori Aktif</p>
                <p className="text-xl font-bold text-[#1E293B]">{selectedCategory.name}</p>
                <p className="text-[#64748B]">{selectedCategory.description}</p>
              </div>

              <button
                onClick={handleStartDrawing}
                disabled={isRolling || selectedCategory.is_completed}
                className="w-full py-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                <Play className="w-6 h-6" />
                {isRolling ? 'Mengundi...' : 'MULAI'}
              </button>

              <button
                onClick={handleStopDrawing}
                disabled={!isRolling}
                className="w-full py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                <Square className="w-6 h-6" /> STOP
              </button>

              <button
                onClick={handleReset}
                disabled={isRolling || !selectedCategory.winners?.length}
                className="w-full py-3 border-2 border-[#E2E8F0] hover:border-[#64748B] rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition text-[#1E293B]"
              >
                <RotateCcw className="w-5 h-5" /> Reset Kategori
              </button>

              {/* Winners - Compact List Format */}
              {selectedCategory.winners && selectedCategory.winners.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#1E293B]">Pemenang</h3>
                  {selectedCategory.winners.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:border-[#22C55E] transition">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {w.position}
                        </div>
                        <div className="flex-1">
                          <span className="font-mono text-[#3B82F6] font-semibold text-sm">{w.participant.coupon_code}</span>
                          <span className="text-[#64748B] mx-2">-</span>
                          <span className="font-semibold text-[#1E293B] text-sm">{w.participant.name}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReroll(w.id)} 
                        disabled={isRolling} 
                        className="p-2 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition"
                        title="Reroll"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
              <Trophy className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
              <p className="text-[#64748B]">Pilih kategori untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}