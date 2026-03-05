import React, { useState, useMemo } from 'react';
import { Official } from '../data/officials';

interface Appointments {
  chief: string | null;
  deputies: (string | null)[];
  disciples: (string | null)[];
}

interface AppointmentModalProps {
  building: { q: number; r: number; type: string; appointments?: Appointments };
  allBuildings: any[];
  officials: Official[];
  onClose: () => void;
  onResetSkill: (officialId: string) => void;
  onSave: (appointments: Appointments) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ building, allBuildings, officials, onClose, onResetSkill, onSave }) => {
  const [appointments, setAppointments] = useState<Appointments>(
    building.appointments || { chief: null, deputies: [null, null], disciples: [null, null, null, null, null] }
  );
  
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'chief' | 'deputy' | 'disciple', index: number } | null>(null);

  // Find which officials are already appointed ANYWHERE
  const appointedOfficialIds = useMemo(() => {
    const ids = new Set<string>();
    allBuildings.forEach(b => {
      if (b.appointments) {
        if (b.appointments.chief) ids.add(b.appointments.chief);
        b.appointments.deputies.forEach((d: string | null) => d && ids.add(d));
        b.appointments.disciples.forEach((d: string | null) => d && ids.add(d));
      }
    });
    return ids;
  }, [allBuildings]);

  // Calculate current hex bonuses
  const currentBonuses = useMemo(() => {
    let politics = 0;
    let knowledge = 0;
    let charm = 0;
    let output = 0;
    let defense = 0;

    const addOfficialStats = (id: string | null, multiplier: number) => {
      if (!id) return;
      const off = officials.find(o => o.id === id);
      if (off) {
        politics += off.politics * multiplier;
        knowledge += off.knowledge * multiplier;
        charm += off.charm * multiplier;

        // Fixed skill
        if (off.fixedSkill.effectTarget === 'current_hex') {
          if (off.fixedSkill.effectType === 'add_politics') politics += off.fixedSkill.effectValue;
          if (off.fixedSkill.effectType === 'add_knowledge') knowledge += off.fixedSkill.effectValue;
          if (off.fixedSkill.effectType === 'add_charm') charm += off.fixedSkill.effectValue;
          if (off.fixedSkill.effectType === 'add_output') output += off.fixedSkill.effectValue;
          if (off.fixedSkill.effectType === 'add_defense') defense += off.fixedSkill.effectValue;
        }
      }
    };

    addOfficialStats(appointments.chief, 1);
    appointments.deputies.forEach(d => addOfficialStats(d, 0.5));
    appointments.disciples.forEach(d => addOfficialStats(d, 0.2));

    return { politics: Math.floor(politics), knowledge: Math.floor(knowledge), charm: Math.floor(charm), output, defense };
  }, [appointments]);

  const handleAppoint = (officialId: string) => {
    if (!selectedSlot) return;
    
    const newAppts = { ...appointments };
    
    // Remove official from any existing slot in THIS building to avoid duplicates
    if (newAppts.chief === officialId) newAppts.chief = null;
    newAppts.deputies = newAppts.deputies.map(d => d === officialId ? null : d);
    newAppts.disciples = newAppts.disciples.map(d => d === officialId ? null : d);

    if (selectedSlot.type === 'chief') {
      newAppts.chief = officialId;
    } else if (selectedSlot.type === 'deputy') {
      newAppts.deputies[selectedSlot.index] = officialId;
    } else if (selectedSlot.type === 'disciple') {
      newAppts.disciples[selectedSlot.index] = officialId;
    }
    
    setAppointments(newAppts);
    setSelectedSlot(null);
  };

  const handleRemove = (type: 'chief' | 'deputy' | 'disciple', index: number = 0) => {
    const newAppts = { ...appointments };
    if (type === 'chief') newAppts.chief = null;
    if (type === 'deputy') newAppts.deputies[index] = null;
    if (type === 'disciple') newAppts.disciples[index] = null;
    setAppointments(newAppts);
  };

  const renderSlot = (title: string, type: 'chief' | 'deputy' | 'disciple', index: number = 0, officialId: string | null) => {
    const official = officialId ? officials.find(o => o.id === officialId) : null;
    const isSelected = selectedSlot?.type === type && selectedSlot?.index === index;
    
    return (
      <div 
        className={`border p-2 rounded cursor-pointer flex flex-col items-center justify-center min-h-[80px] relative transition-colors ${isSelected ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-[#444] bg-[#222] hover:border-[#666]'}`}
        onClick={() => setSelectedSlot({ type, index })}
      >
        <div className="text-xs text-[#888] absolute top-1 left-2">{title}</div>
        {official ? (
          <>
            <div className="font-bold text-[#00d2ff] mt-3">{official.name}</div>
            <div className="text-[10px] text-[#aaa] flex gap-2">
              <span>政:{official.politics}</span>
              <span>学:{official.knowledge}</span>
              <span>魅:{official.charm}</span>
            </div>
            <button 
              className="absolute top-1 right-1 text-red-500 hover:text-red-400 text-xs"
              onClick={(e) => { e.stopPropagation(); handleRemove(type, index); }}
            >
              ✕
            </button>
          </>
        ) : (
          <div className="text-[#555] mt-3 text-sm">点击委任</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📜</span> 地块委任 (坐标: {building.q}, {building.r})
          </h2>
          <button onClick={onClose} className="text-[#888] hover:text-white text-xl">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Slots & Stats */}
          <div className="w-1/2 p-4 flex flex-col gap-4 overflow-y-auto border-r border-[#333]">
            
            <div className="bg-[#222] p-3 rounded border border-[#444]">
              <h3 className="text-sm font-bold text-[#00d2ff] mb-2 border-b border-[#333] pb-1">当前地块加成汇总</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between"><span>政务:</span> <span className="text-white font-mono">{currentBonuses.politics}</span></div>
                <div className="flex justify-between"><span>学识:</span> <span className="text-white font-mono">{currentBonuses.knowledge}</span></div>
                <div className="flex justify-between"><span>魅力:</span> <span className="text-white font-mono">{currentBonuses.charm}</span></div>
                <div className="flex justify-between"><span>产出:</span> <span className="text-[#00ff88] font-mono">+{currentBonuses.output}%</span></div>
                <div className="flex justify-between"><span>防御:</span> <span className="text-[#ff9900] font-mono">+{currentBonuses.defense}%</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#aaa] mb-2">主官 (100%属性加成)</h3>
              {renderSlot('主官', 'chief', 0, appointments.chief)}
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#aaa] mb-2">副官 (50%属性加成)</h3>
              <div className="grid grid-cols-2 gap-2">
                {appointments.deputies.map((dep, i) => (
                  <React.Fragment key={i}>
                    {renderSlot(`副官 ${i+1}`, 'deputy', i, dep)}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#aaa] mb-2">门生 (20%属性加成)</h3>
              <div className="grid grid-cols-2 gap-2">
                {appointments.disciples.map((dis, i) => (
                  <React.Fragment key={i}>
                    {renderSlot(`门生 ${i+1}`, 'disciple', i, dis)}
                  </React.Fragment>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Official Roster */}
          <div className="w-1/2 p-4 flex flex-col bg-[#111]">
            <h3 className="text-sm font-bold text-[#aaa] mb-3 flex justify-between items-center">
              <span>文官名册</span>
              {selectedSlot && <span className="text-[#00ff88] text-xs animate-pulse">请选择要委任的文官</span>}
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {officials.map(official => {
                const isAppointedHere = 
                  appointments.chief === official.id || 
                  appointments.deputies.includes(official.id) || 
                  appointments.disciples.includes(official.id);
                
                const isAppointedElsewhere = !isAppointedHere && appointedOfficialIds.has(official.id);

                return (
                  <div 
                    key={official.id}
                    className={`p-3 rounded border flex flex-col gap-2 transition-colors ${
                      isAppointedElsewhere ? 'opacity-50 border-[#333] bg-[#1a1a1a]' : 
                      isAppointedHere ? 'border-[#00d2ff] bg-[#00d2ff]/10' :
                      selectedSlot ? 'border-[#444] bg-[#222] hover:border-[#00ff88] cursor-pointer' : 'border-[#444] bg-[#222]'
                    }`}
                    onClick={() => {
                      if (selectedSlot && !isAppointedElsewhere) {
                        handleAppoint(official.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-white text-lg">{official.name}</div>
                      {isAppointedElsewhere && <span className="text-xs bg-[#333] px-2 py-1 rounded text-[#888]">已在其他地块委任</span>}
                      {isAppointedHere && <span className="text-xs bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-1 rounded">当前地块</span>}
                    </div>
                    
                    <div className="flex gap-4 text-sm text-[#ccc]">
                      <span>政务: <span className="text-white">{official.politics}</span></span>
                      <span>学识: <span className="text-white">{official.knowledge}</span></span>
                      <span>魅力: <span className="text-white">{official.charm}</span></span>
                    </div>
                    
                    <div className="text-xs space-y-1 mt-1">
                      <div className="text-[#ff9900]">
                        <span className="font-bold">[{official.fixedSkill.name}]</span> {official.fixedSkill.description}
                      </div>
                      <div className="text-[#00ff88]">
                        <span className="font-bold">[{official.randomSkill.name}]</span> {official.randomSkill.description}
                        <button className="ml-2 text-[#888] hover:text-white underline" onClick={(e) => {
                          e.stopPropagation();
                          onResetSkill(official.id);
                        }}>重置</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#333] bg-[#111] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded font-bold text-[#aaa] hover:text-white hover:bg-[#333] transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => onSave(appointments)}
            className="px-6 py-2 rounded font-bold bg-[#00ff88] text-black hover:bg-[#00cc66] transition-colors"
          >
            确认委任
          </button>
        </div>

      </div>
    </div>
  );
};
