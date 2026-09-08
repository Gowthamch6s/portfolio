import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import GlowOrbs from './components/GlowOrbs.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Work from './components/Work.jsx';
import Photography from './components/Photography.jsx';
import Contact from './components/Contact.jsx';
import GameModeButton from './components/GameModeButton.jsx';
import FloatingCompanion from './components/FloatingCompanion.jsx';
import TrailConnector from './components/TrailConnector.jsx';

export default function App() {
  const [muted, setMuted] = useState(
    () => localStorage.getItem('portfolio-muted') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('portfolio-muted', String(muted));
  }, [muted]);

  return (
    <div className="relative min-h-screen">
      <GlowOrbs />
      <Navbar
        muted={muted}
        onToggleMuted={() => setMuted((m) => !m)}
      />
      <main className="relative z-10">
        <Hero />
        <TrailConnector fromRight toRight={false} />
        <About />
        <TrailConnector fromRight={false} toRight />
        <Skills />
        <TrailConnector fromRight toRight={false} />
        <Work />
        <TrailConnector fromRight={false} toRight />
        <Photography />
        <TrailConnector fromRight={false} toRight />
        <Contact />
      </main>
      <FloatingCompanion muted={muted} />
      <GameModeButton />
    </div>
  );
}
