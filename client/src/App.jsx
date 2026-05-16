import React, { useEffect, useState } from 'react';
import { socket, connectSocket, connectGuest } from './services/socket';
import RadarView from './components/RadarView';
import FlightList from './components/FlightList';
import LogPanel from './components/LogPanel';
import LoginForm from './components/LoginForm';
import PassengerDashboard from './components/PassengerDashboard';
import RunwayStatus from './components/RunwayStatus';
import { Plane, TowerControl, Radio } from 'lucide-react';

function App() {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState('login'); // 'login', 'controller', 'passenger'

  useEffect(() => {
    // Check localStorage for token
    const token = localStorage.getItem('atc_token');
    if (token) {
      connectSocket(token);
      setIsAuthenticated(true);
      setViewMode('controller');
    }

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error("Connection Error:", err.message);
      // If auth failed, potential logout
      if (err.message === "Unauthorized") {
        setIsAuthenticated(false);
        setViewMode('login');
      }
    });

    socket.on('gameState', (data) => {
      setGameState(data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('gameState');
    };
  }, []);

  const handleLoginSuccess = (token) => {
    localStorage.setItem('atc_token', token);
    connectSocket(token);
    setIsAuthenticated(true);
    setViewMode('controller');
  };

  const handleGuestLogin = () => {
    connectGuest();
    setViewMode('passenger');
  };

  const handleLogout = () => {
    localStorage.removeItem('atc_token');
    socket.disconnect();
    setIsAuthenticated(false);
    setViewMode('login');
    setGameState(null);
  };

  // --- RENDERING ---

  if (viewMode === 'passenger') {
    return <PassengerDashboard gameState={gameState} onLogout={handleLogout} />;
  }

  if (viewMode === 'login') {
    return <LoginForm onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
  }

  // --- CONTROLLER VIEW ---

  const { aircrafts = [], runways = [], logs = [] } = gameState || {};

  const handleCommand = (type, aircraftId, payload) => {
    socket.emit('command', { type, aircraftId, payload });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]">
            <TowerControl size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-none">ATC COMMAND</h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Airport Traffic Control System v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <a href="http://localhost:3001/export" className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors">
              CSV
            </a>
            <a href="http://localhost:3001/export/pdf" className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded border border-slate-700 hover:bg-emerald-900/30 text-emerald-400 border-emerald-900/50 transition-colors">
              PDF Report
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono uppercase tracking-wider ml-2"
            >
              [ Logout ]
            </button>
          </div>

          <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full ${connected ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'SYSTEM ONLINE' : 'CONNECTION LOST'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 grid grid-cols-12 gap-4 h-[calc(100vh-80px)]">
        {/* Left Panel: Flight List & Controls */}
        <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          {/* 1. Active Flights (Flexible Height - Larger) */}
          <div className="min-h-0 overflow-hidden flex flex-col" style={{ flex: 2 }}>
            <FlightList
              aircrafts={aircrafts}
              runways={runways}
              onCommand={handleCommand}
            />
          </div>

          {/* 2. Runway Status (Fixed Height content) */}
          <div className="shrink-0">
            <RunwayStatus runways={runways} aircrafts={aircrafts} />
          </div>

          {/* 3. Short Logs (Remaining Height - Smaller) */}
          <div className="min-h-0 overflow-hidden flex flex-col" style={{ flex: 1 }}>
            <LogPanel logs={logs} />
          </div>
        </div>

        {/* Center Panel: Radar View */}
        <div className="col-span-9 h-full bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded border border-slate-700/50">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">RADAR ACTIVE</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded border border-slate-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">SCANNING...</span>
          </div>

          <RadarView aircrafts={aircrafts} runways={runways} />
        </div>
      </main>
    </div>
  );
}

export default App;
