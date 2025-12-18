import { useState } from 'react';
import { DisplayPage } from './pages/DisplayPage';
import { ControlPage } from './pages/ControlPage';

function App() {
  const [mode, setMode] = useState<'select' | 'display' | 'control'>('select');
  const [eventId] = useState(1);

  if (mode === 'display') {
    return <DisplayPage eventId={eventId} />;
  }

  if (mode === 'control') {
    return <ControlPage eventId={eventId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-2">🎰 Undian System</h1>
        <p className="text-gray-500 text-center mb-8">Pilih mode aplikasi</p>

        <div className="space-y-4">
          <button
            onClick={() => setMode('display')}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            📺 Display Mode
            <p className="text-sm font-normal opacity-80">Untuk LCD/Monitor</p>
          </button>

          <button
            onClick={() => setMode('control')}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            🎮 Control Mode
            <p className="text-sm font-normal opacity-80">Untuk Tablet/HP</p>
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Event ID: {eventId}
        </p>
      </div>
    </div>
  );
}

export default App;