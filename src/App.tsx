import { useState } from 'react';
import { DisplayPage } from './pages/DisplayPage';
import { ControlPage } from './pages/ControlPage';

function App() {
  const [mode, setMode] = useState<'select' | 'display' | 'control'>('select');
  const [eventId] = useState(1);

  const handleBack = () => {
    setMode('select');
  };

  if (mode === 'display') {
    return <DisplayPage eventId={eventId} onBack={handleBack} />;
  }

  if (mode === 'control') {
    return <ControlPage eventId={eventId} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-2 text-[#1E293B]">🎰 Undian System</h1>
        <p className="text-[#64748B] text-center mb-8">Pilih mode aplikasi</p>

        <div className="space-y-4">
          <button
            onClick={() => setMode('display')}
            className="w-full py-4 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] transition"
          >
            📺 Display Mode
            <p className="text-sm font-normal opacity-90">Untuk LCD/Monitor</p>
          </button>

          <button
            onClick={() => setMode('control')}
            className="w-full py-4 bg-[#22C55E] text-white font-semibold rounded-xl hover:bg-[#16A34A] transition"
          >
            🎮 Control Mode
            <p className="text-sm font-normal opacity-90">Untuk Tablet/HP</p>
          </button>
        </div>

        <p className="text-center text-[#64748B] text-sm mt-6">
          Event ID: {eventId}
        </p>
      </div>
    </div>
  );
}

export default App;