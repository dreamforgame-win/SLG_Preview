import React, { useState } from 'react';
import WorldMap from './WorldMap';
import BattleSimulator from './BattleSimulator';

export default function App() {
  const [view, setView] = useState<'map' | 'battle'>('map');

  return (
    <>
      {view === 'map' && <WorldMap onEnterBattle={() => setView('battle')} />}
      {view === 'battle' && <BattleSimulator onBack={() => setView('map')} />}
    </>
  );
}
