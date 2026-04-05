import GameCanvas from './components/GameCanvas';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="crt-overlay" />
      <div className="scanline" />
      <GameCanvas />
    </div>
  );
}
