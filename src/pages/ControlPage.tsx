import { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Trophy, Users, RotateCcw, Upload } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { eventApi, categoryApi, participantApi, drawingApi } from '../services/api';
import { emitCategoryChange, emitDrawingStart, emitDrawingRoll, emitWinnerSelected } from '../services/socket';
import type { Event, PrizeCategory, Participant } from '../types';

interface ControlPageProps {
  eventId: number;
}

export function ControlPage({ eventId }: ControlPageProps) {
  const { isConnected, winners } = useSocket(eventId);

  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<PrizeCategory[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PrizeCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);

  const rollingInterval = useRef<number | null>(null);
  const rollingTimeout = useRef<number | null>(null);

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

    // Rolling animation
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

    // Auto stop after 3-5 seconds
    const duration = 3000 + Math.random() * 2000;
    rollingTimeout.current = window.setTimeout(() => {
      handleStopDrawing();
    }, duration);
  };

  const handleStopDrawing = async () => {
    if (!selectedCategory) return;

    if (rollingInterval.current) clearInterval(rollingInterval.current);
    if (rollingTimeout.current) clearTimeout(rollingTimeout.current);

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

  const handleForceStop = () => {
    if (rollingInterval.current) clearInterval(rollingInterval.current);
    if (rollingTimeout.current) clearTimeout(rollingTimeout.current);
    setIsRolling(false);
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
    } catch (error) {
      alert('Gagal import');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{event?.name}</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <label className="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="p-4 grid lg:grid-cols-2 gap-4">
        {/* Categories */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Kategori Hadiah
          </h2>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              disabled={isRolling}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedCategory?.id === cat.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-200'
              } ${isRolling ? 'opacity-50' : ''}`}
            >
              <p className="font-semibold">{cat.name}</p>
              <p className="text-sm text-gray-500">{cat.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-purple-600 flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> {cat.winner_count}
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {cat.eligible_count}
                </span>
                {cat.is_completed && <span className="text-green-600">✓ Selesai</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <h2 className="font-semibold">Kontrol Pengundian</h2>

          {selectedCategory ? (
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Kategori Aktif</p>
                <p className="text-xl font-bold">{selectedCategory.name}</p>
                <p className="text-gray-600">{selectedCategory.description}</p>
              </div>

              <button
                onClick={handleStartDrawing}
                disabled={isRolling || selectedCategory.is_completed}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6" />
                {isRolling ? 'Mengundi...' : 'Mulai Pengundian'}
              </button>

              <button
                onClick={handleForceStop}
                disabled={!isRolling}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Square className="w-6 h-6" /> Stop
              </button>

              <button
                onClick={handleReset}
                disabled={isRolling || !selectedCategory.winners?.length}
                className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Reset Kategori
              </button>

              {/* Winners */}
              {selectedCategory.winners && selectedCategory.winners.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Pemenang</h3>
                  {selectedCategory.winners.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400 text-white rounded-full flex items-center justify-center font-bold">
                          {w.position}
                        </div>
                        <div>
                          <p className="font-semibold">{w.participant.name}</p>
                          <p className="text-sm text-gray-500 font-mono">{w.participant.coupon_code}</p>
                        </div>
                      </div>
                      <button onClick={() => handleReroll(w.id)} disabled={isRolling} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Pilih kategori untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}