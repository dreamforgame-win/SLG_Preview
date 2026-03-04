import React, { useState, useRef, useEffect } from 'react';
import { Unit, Team, UnitType, SkillType, LogEntry, Prop, PropType, FormationType } from './types';
import { CLASS_DATA, SKILL_DATA, PROP_DATA, FORMATION_DATA } from './constants';

const CELL_SIZE = 60;
const COLS = 15;
const ROWS = 5;

export default function BattleSimulator({ onBack }: { onBack: () => void }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, msg: '> 等待指挥官部署防线...', color: 'text-[#0f0]' },
    { id: 1, msg: '> 提示：如果未装配技能，兵种只会进行普攻。', color: 'text-[#0f0]' },
  ]);
  const [timeTick, setTimeTick] = useState(0);
  const [hoveredSkill, setHoveredSkill] = useState<SkillType | null>(null);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [playerFormation, setPlayerFormation] = useState<FormationType>('Normal');
  const [enemyFormation, setEnemyFormation] = useState<FormationType>('Normal');

  const [hoveredPlayerFormation, setHoveredPlayerFormation] = useState<FormationType | null>(null);
  const [hoveredEnemyFormation, setHoveredEnemyFormation] = useState<FormationType | null>(null);

  const unitsRef = useRef<Unit[]>([]);
  const propsRef = useRef<Prop[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  const timeTickRef = useRef(0);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    timeTickRef.current = timeTick;
  }, [timeTick]);

  const addLog = (msg: string, color: string = 'text-[#0f0]') => {
    const prefix = battleStarted ? `[${timeTickRef.current}s] ` : `[部署] `;
    setLogs((prev) => {
      const newLogs = [...prev, { id: Date.now() + Math.random(), msg: `${prefix}${msg}`, color }];
      return newLogs.length > 100 ? newLogs.slice(newLogs.length - 100) : newLogs;
    });
  };

  const addLogRef = (msg: string, color: string = 'text-[#0f0]') => {
    const prefix = battleStarted ? `[${timeTickRef.current}s] ` : `[部署] `;
    logsRef.current = [...logsRef.current, { id: Date.now() + Math.random(), msg: `${prefix}${msg}`, color }];
    if (logsRef.current.length > 100) {
      logsRef.current = logsRef.current.slice(logsRef.current.length - 100);
    }
    setLogs([...logsRef.current]);
  };

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDragStart = (e: React.DragEvent, type: UnitType | PropType, isProp: boolean = false) => {
    if (battleStarted) {
      e.preventDefault();
      return;
    }
    if (isProp) {
      e.dataTransfer.setData('propType', type);
    } else {
      e.dataTransfer.setData('type', type);
    }
  };

  const handleBoardUnitDragStart = (e: React.DragEvent, unitId: string) => {
    if (battleStarted) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('unitId', unitId);
  };

  const handleBoardPropDragStart = (e: React.DragEvent, propId: string) => {
    if (battleStarted) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('propId', propId);
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (battleStarted) return;

    const type = e.dataTransfer.getData('type') as UnitType;
    const propType = e.dataTransfer.getData('propType') as PropType;
    const unitId = e.dataTransfer.getData('unitId');
    const propId = e.dataTransfer.getData('propId');

    if (unitId) {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      if (unit.team === 'player' && x >= 5) {
        addLog('我方单位只能部署在左侧阵区！', 'text-red-500');
        return;
      }
      if (unit.team === 'enemy' && x < 10) {
        addLog('敌方单位只能部署在右侧阵区！', 'text-red-500');
        return;
      }

      if (units.some((u) => u.id !== unitId && u.x === x && u.y === y && u.hp > 0)) {
        addLog('该位置已有单位部署！', 'text-red-500');
        return;
      }

      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, x, y } : u)));
      return;
    }

    if (propId) {
      const prop = props.find((p) => p.id === propId);
      if (!prop) return;

      if (x < 5 || x >= 10) {
        addLog('物件只能部署在中间的备战阵区！', 'text-red-500');
        return;
      }

      if (props.some((p) => p.id !== propId && p.x === x && p.y === y && p.active)) {
        addLog('该位置已有物件部署！', 'text-red-500');
        return;
      }

      setProps((prev) => prev.map((p) => (p.id === propId ? { ...p, x, y } : p)));
      return;
    }

    if (propType && PROP_DATA[propType]) {
      if (x < 5 || x >= 10) {
        addLog('物件只能部署在中间的备战阵区！', 'text-red-500');
        return;
      }
      if (props.some((p) => p.x === x && p.y === y && p.active)) {
        addLog('该位置已有物件部署！', 'text-red-500');
        return;
      }
      const id = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const hp = propType === 'Obstacle' ? 100 : undefined;
      setProps((prev) => [...prev, { id, type: propType, x, y, active: true, hp, maxHp: hp, team: 'player' }]);
      addLog(`部署了 ${PROP_DATA[propType].name} 至坐标 (${x},${y})`);
      return;
    }

    if (!type || !CLASS_DATA[type]) return;

    if (units.some((u) => u.x === x && u.y === y && u.hp > 0)) {
      addLog('该位置已有单位部署！', 'text-red-500');
      return;
    }

    const team: Team = x < 5 ? 'player' : 'enemy';
    if (x >= 5 && x < 10) {
      addLog('备战阵区不可部署兵种！', 'text-red-500');
      return;
    }

    if (units.filter((u) => u.team === team).length >= 4) {
      addLog(team === 'player' ? '我方最多上阵4人！' : '敌方最多上阵4人！', 'text-red-500');
      return;
    }

    const id = `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const facing = x < 5 ? 1 : -1;

    const newUnit: Unit = {
      id,
      team,
      type,
      x,
      y,
      facing,
      skills: [],
      hp: CLASS_DATA[type].maxHp,
      maxHp: CLASS_DATA[type].maxHp,
      atk: CLASS_DATA[type].atk,
      range: CLASS_DATA[type].range,
      cdTimer: 0,
    };

    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitId(id);
    addLog(`部署了 ${CLASS_DATA[type].name} 至坐标 (${x},${y})`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!battleStarted) e.preventDefault();
  };

  const toggleSkill = (skill: SkillType) => {
    if (!selectedUnitId || battleStarted) return;
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === selectedUnitId) {
          const hasSkill = u.skills.includes(skill);
          if (hasSkill) {
            return { ...u, skills: u.skills.filter((s) => s !== skill) };
          } else if (u.skills.length < 2) {
            return { ...u, skills: [...u.skills, skill] };
          }
        }
        return u;
      })
    );
  };

  const removeSelectedUnit = () => {
    if (!selectedUnitId || battleStarted) return;
    setUnits((prev) => prev.filter((u) => u.id !== selectedUnitId));
    setSelectedUnitId(null);
  };

  const startBattle = () => {
    if (units.filter((u) => u.team === 'player').length === 0 || units.filter((u) => u.team === 'enemy').length === 0) {
      alert('必须确保双方阵营至少有 1 名单位才能开战！');
      return;
    }

    // Apply formation buffs
    setUnits(prev => prev.map(u => {
      const isPlayer = u.team === 'player';
      const formation = isPlayer ? playerFormation : enemyFormation;
      const row = isPlayer ? 5 - u.x : u.x - 9;
      const col = isPlayer ? u.y + 1 : 5 - u.y;
      
      let newHp = u.hp;
      let newMaxHp = u.maxHp;
      let newAtk = u.atk;
      let newRange = u.range;

      if (formation === 'WhiteTiger' && (row === 3 || row === 4)) {
        newAtk = Math.floor(newAtk * 1.05);
      } else if (formation === 'AzureDragon' && (row === 2 || row === 3) && u.type === 'Spear') {
        newRange += 1;
      } else if (formation === 'BlackTortoise' && row === 1 && u.type === 'Sword') {
        newMaxHp = Math.floor(newMaxHp * 1.2);
        newHp = newMaxHp;
      } else if (formation === 'VermilionBird') {
        if (row === 1 && col === 3) {
          newMaxHp = Math.floor(newMaxHp * 1.1);
          newHp = newMaxHp;
        }
        if (row === 3 && (col === 1 || col === 5)) {
          newAtk = Math.floor(newAtk * 1.1);
        }
        if (row === 5 && col === 3) {
          newRange += 1;
        }
      }

      return { ...u, hp: newHp, maxHp: newMaxHp, atk: newAtk, range: newRange };
    }));

    setBattleStarted(true);
    setSelectedUnitId(null);
    addLog('=========================', 'text-yellow-400');
    addLog('沙盘锁定，开始动态对冲演算！', 'text-yellow-400');
  };

  const resetBattle = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (!battleStarted) return;

    const getDistance = (u1: Unit, u2: Unit) => Math.abs(u1.x - u2.x) + Math.abs(u1.y - u2.y);
    const isOccupied = (x: number, y: number, currentUnits: Unit[], currentProps: Prop[]) => {
      if (currentUnits.some((u) => u.hp > 0 && u.x === x && u.y === y)) return true;
      if (currentProps.some((p) => p.type === 'Obstacle' && p.x === x && p.y === y && p.active)) return true;
      return false;
    };

    const interval = setInterval(() => {
      setTimeTick((prev) => prev + 1);
      timeTickRef.current += 1;

      let currentUnits = [...unitsRef.current];
      let currentProps = [...propsRef.current];

      // Clear old states
      currentUnits.forEach((u) => {
        u.isAttacking = false;
        u.isCasting = false;
        u.activeSkill = undefined;
        if (u.floatingTexts) {
          u.floatingTexts = u.floatingTexts.filter((ft) => Date.now() - ft.id < 1000);
        }
      });
      currentProps.forEach((p) => {
        if (p.type === 'Obstacle' && p.hp !== undefined && p.hp <= 0) {
          p.active = false;
        }
      });

      const activeUnits = currentUnits.filter((u) => u.hp > 0);

      const pAlive = activeUnits.some((u) => u.team === 'player');
      const eAlive = activeUnits.some((u) => u.team === 'enemy');

      if (!pAlive || !eAlive) {
        clearInterval(interval);
        addLogRef(pAlive ? '战斗结束：我方阵型大获全胜！' : '战斗结束：我方阵地被击溃！', 'text-yellow-400');
        return;
      }

      const unitsToProcess = currentUnits.filter((u) => u.hp > 0);

      for (let i = 0; i < unitsToProcess.length; i++) {
        const unitId = unitsToProcess[i].id;
        const unitIndex = currentUnits.findIndex((u) => u.id === unitId);
        if (unitIndex === -1) continue;
        const unit = currentUnits[unitIndex];

        if (unit.hp <= 0) continue;

        unit.cdTimer += 1;
        unit.activeSkill = undefined;

        if (unit.cdTimer >= 5 && unit.skills.length > 0) {
          const skillKey = unit.skills[Math.floor(Math.random() * unit.skills.length)];
          const f = unit.facing;
          unit.activeSkill = SKILL_DATA[skillKey].name;
          unit.isCasting = true;
          unit.castTrigger = Date.now() + Math.random();

          addLogRef(`💥 [${CLASS_DATA[unit.type].name}] 触发装配技能 【${SKILL_DATA[skillKey].name}】`, 'text-[#00d2ff]');
          let hitCount = 0;

          if (skillKey === 'Heal') {
            currentUnits.forEach((t) => {
              if (t.team === unit.team && t.hp > 0) {
                if (Math.abs(t.x - unit.x) <= 1 && Math.abs(t.y - unit.y) <= 1) {
                  const healAmount = t.maxHp * 0.1;
                  t.hp = Math.min(t.maxHp, t.hp + healAmount);
                  t.floatingTexts = [...(t.floatingTexts || []), { id: Date.now() + Math.random(), text: `+${Math.floor(healAmount)}`, color: 'text-green-500' }];
                  hitCount++;
                }
              }
            });
            addLogRef(`  -> 治愈了 ${hitCount} 名友军 10% 血量`, 'text-[#ccc]');
          } else if (skillKey === 'Charge') {
            currentUnits.forEach((t) => {
              if (t.team !== unit.team && t.hp > 0) {
                if (t.y === unit.y && (t.x - unit.x) * f > 0 && Math.abs(t.x - unit.x) <= 3) {
                  const damage = unit.atk * 0.5;
                  t.hp -= damage;
                  t.floatingTexts = [...(t.floatingTexts || []), { id: Date.now() + Math.random(), text: `-${Math.floor(damage)}`, color: 'text-red-500' }];
                  hitCount++;
                }
              }
            });
            addLogRef(`  -> 贯穿了 ${hitCount} 名沿途敌人`, 'text-[#ccc]');
          } else if (skillKey === 'ArrowRain') {
            currentUnits.forEach((t) => {
              if (t.team !== unit.team && t.hp > 0) {
                const dx = (t.x - unit.x) * f;
                const dy = Math.abs(t.y - unit.y);
                if (dx >= 1 && dx <= 3 && dy <= 1) {
                  const damage = unit.atk * 0.5;
                  t.hp -= damage;
                  t.floatingTexts = [...(t.floatingTexts || []), { id: Date.now() + Math.random(), text: `-${Math.floor(damage)}`, color: 'text-red-500' }];
                  hitCount++;
                }
              }
            });
            addLogRef(`  -> 箭雨覆盖了 ${hitCount} 个目标`, 'text-[#ccc]');
          } else if (skillKey === 'Knockback') {
            currentUnits.forEach((t) => {
              if (t.team !== unit.team && t.hp > 0) {
                if (Math.abs(t.x - unit.x) <= 1 && Math.abs(t.y - unit.y) <= 1) {
                  const damage = unit.atk * 0.2;
                  t.hp -= damage;
                  t.floatingTexts = [...(t.floatingTexts || []), { id: Date.now() + Math.random(), text: `-${Math.floor(damage)}`, color: 'text-red-500' }];
                  hitCount++;
                  const pushX = t.x + unit.facing;
                  if (pushX >= 0 && pushX < COLS && !isOccupied(pushX, t.y, currentUnits, currentProps)) {
                    t.x = pushX;
                  }
                }
              }
            });
            addLogRef(`  -> 震退了 ${hitCount} 名近身敌人`, 'text-[#ccc]');
          }
          unit.cdTimer = 0;
          continue;
        }

        const enemies = currentUnits.filter((u) => u.team !== unit.team && u.hp > 0);
        if (enemies.length === 0) continue;

        // Check if already in range of any enemy
        const enemiesInRange = enemies.filter((e) => getDistance(unit, e) <= unit.range);
        if (enemiesInRange.length > 0) {
          enemiesInRange.sort((a, b) => a.hp - b.hp);
          const target = enemiesInRange[0];
          unit.isAttacking = true;
          unit.attackTrigger = Date.now() + Math.random();
          target.hp -= unit.atk;
          target.floatingTexts = [...(target.floatingTexts || []), { id: Date.now() + Math.random(), text: `-${unit.atk}`, color: 'text-red-500' }];
          addLogRef(`${CLASS_DATA[unit.type].name}(${unit.team === 'player' ? '我' : '敌'}) 普攻 -> 命中, 造成 ${unit.atk} 伤害`, 'text-[#ccc]');
          continue;
        }

        // BFS Pathfinding
        const findPath = (allowObstacles: boolean) => {
          const queue = [{ x: unit.x, y: unit.y, path: [] as { x: number; y: number }[] }];
          const visited = new Set<string>();
          visited.add(`${unit.x},${unit.y}`);

          // Target cells are any walkable cells from which an enemy can be attacked
          const targetCells = new Set<string>();
          enemies.forEach((e) => {
            for (let x = 0; x < COLS; x++) {
              for (let y = 0; y < ROWS; y++) {
                if (Math.abs(x - e.x) + Math.abs(y - e.y) <= unit.range) {
                  if ((x === unit.x && y === unit.y) || !isOccupied(x, y, currentUnits, currentProps)) {
                    targetCells.add(`${x},${y}`);
                  }
                }
              }
            }
          });

          if (targetCells.size === 0) return null;

          while (queue.length > 0) {
            const curr = queue.shift()!;

            if (targetCells.has(`${curr.x},${curr.y}`)) {
              return curr.path;
            }

            const neighbors = [
              { x: curr.x + 1, y: curr.y },
              { x: curr.x - 1, y: curr.y },
              { x: curr.x, y: curr.y + 1 },
              { x: curr.x, y: curr.y - 1 },
            ];

            for (const n of neighbors) {
              if (n.x < 0 || n.x >= COLS || n.y < 0 || n.y >= ROWS) continue;
              const key = `${n.x},${n.y}`;
              if (visited.has(key)) continue;

              const isUnit = currentUnits.some((u) => u.hp > 0 && u.x === n.x && u.y === n.y);
              const prop = currentProps.find((p) => p.active && p.x === n.x && p.y === n.y);
              const isObstacle = prop?.type === 'Obstacle';

              if (isUnit) continue;
              if (isObstacle) {
                if (prop.team === unit.team) continue;
                if (!allowObstacles) continue;
              }

              visited.add(key);
              queue.push({ x: n.x, y: n.y, path: [...curr.path, n] });
            }
          }
          return null;
        };

        let path = findPath(false);
        if (!path) {
          path = findPath(true);
        }

        if (path && path.length > 0) {
          const nextStep = path[0];
          const prop = currentProps.find((p) => p.active && p.type === 'Obstacle' && p.x === nextStep.x && p.y === nextStep.y);
          
          if (prop && prop.hp !== undefined) {
            // Attack obstacle
            unit.isAttacking = true;
            unit.attackTrigger = Date.now() + Math.random();
            prop.hp -= unit.atk;
            addLogRef(`${CLASS_DATA[unit.type].name} 攻击障碍，造成 ${unit.atk} 伤害`, 'text-[#ccc]');
          } else {
            // Move
            unit.x = nextStep.x;
            unit.y = nextStep.y;

            if (unit.team === 'enemy') {
              const trapIndex = currentProps.findIndex((p) => p.type === 'Trap' && p.x === unit.x && p.y === unit.y && p.active);
              if (trapIndex !== -1) {
                const damage = Math.min(unit.maxHp * 0.05, 200);
                unit.hp -= damage;
                unit.floatingTexts = [...(unit.floatingTexts || []), { id: Date.now() + Math.random(), text: `-${Math.floor(damage)}`, color: 'text-red-500' }];
                addLogRef(`敌方 ${CLASS_DATA[unit.type].name} 踩中陷阱，受到 ${Math.floor(damage)} 伤害`, 'text-[#ccc]');
                currentProps[trapIndex].active = false;
              }
            }
          }
        }
      }

      setUnits([...currentUnits]);
      setProps([...currentProps]);
    }, 1000);

    return () => clearInterval(interval);
  }, [battleStarted]);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const getHighlightedCells = () => {
    if (!selectedUnit || !hoveredSkill) return [];
    const cells: { x: number; y: number }[] = [];
    const f = selectedUnit.facing;

    if (hoveredSkill === 'Heal' || hoveredSkill === 'Knockback') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          cells.push({ x: selectedUnit.x + dx, y: selectedUnit.y + dy });
        }
      }
    } else if (hoveredSkill === 'Charge') {
      for (let dx = 1; dx <= 3; dx++) {
        cells.push({ x: selectedUnit.x + dx * f, y: selectedUnit.y });
      }
    } else if (hoveredSkill === 'ArrowRain') {
      for (let dx = 1; dx <= 3; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          cells.push({ x: selectedUnit.x + dx * f, y: selectedUnit.y + dy });
        }
      }
    }

    return cells.filter((c) => c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS);
  };

  const highlightedCells = getHighlightedCells();

  const getCellBuff = (team: Team, x: number, y: number, formation: FormationType) => {
    const row = team === 'player' ? 5 - x : x - 9;
    const col = team === 'player' ? y + 1 : 5 - y;

    if (formation === 'WhiteTiger' && (row === 3 || row === 4)) return '攻击+5%';
    if (formation === 'AzureDragon' && (row === 2 || row === 3)) return '枪兵射程+1';
    if (formation === 'BlackTortoise' && row === 1) return '刀兵血量+20%';
    if (formation === 'VermilionBird') {
      if (row === 1 && col === 3) return '血量+10%';
      if (row === 3 && (col === 1 || col === 5)) return '攻击+10%';
      if (row === 5 && col === 3) return '射程+1';
    }
    return null;
  };

  return (
    <div className="h-screen bg-[#1e1e24] text-white p-5 flex flex-col items-center font-sans select-none overflow-hidden">
      <div className="w-full max-w-[1200px] flex flex-col h-full gap-4">
        <div className="flex-shrink-0 relative">
          <button 
            onClick={onBack}
            className="absolute left-0 top-1 bg-[#444] text-white px-3 py-1 rounded text-sm hover:bg-[#555] transition-colors"
          >
            ← 返回大地图
          </button>
          <h2 className="text-xl font-bold tracking-wide mb-1 text-white text-center">自定义阵地 - 战局模拟器</h2>
          <div className="text-[#aaa] text-[13px] text-center">
            【1.拖拽兵种至阵区】 → 【2.布置备战物件】 → 【3.选择阵法与技能】 → 【4.开始演算】
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center w-full flex-1 min-h-0">
          {/* Top Panel: Battlefield */}
          <div className="w-full flex justify-center items-start gap-6 flex-shrink-0">
            {/* Left: Player Formations */}
            <div className="flex flex-col gap-2 w-[120px] pt-8">
              <div className="text-[#00ff88] text-sm font-bold text-center mb-1">我方阵法</div>
              {(Object.keys(FORMATION_DATA) as FormationType[]).map(f => (
                <div
                  key={f}
                  className={`p-2 border-2 rounded cursor-pointer text-xs text-center transition-colors ${playerFormation === f ? 'bg-[#00ff88] text-black border-[#00ff88] font-bold' : 'bg-[#222] text-white border-[#444] hover:border-[#00ff88]'}`}
                  onClick={() => !battleStarted && setPlayerFormation(f)}
                  onMouseEnter={() => !battleStarted && setHoveredPlayerFormation(f)}
                  onMouseLeave={() => !battleStarted && setHoveredPlayerFormation(null)}
                >
                  {FORMATION_DATA[f].name}
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <div className="flex justify-between font-bold text-sm mb-2 w-full px-4">
                <span className="text-[#00ff88] w-1/3 text-center">我方阵区 (5x5)</span>
                <span className="text-yellow-400 w-1/3 text-center">备战阵区 (5x5)</span>
                <span className="text-[#ff4d4d] w-1/3 text-center">敌方阵区 (5x5)</span>
              </div>
              <div
                className="relative bg-[#111] border-2 border-[#555] rounded-lg overflow-hidden mx-auto"
                style={{ width: CELL_SIZE * COLS, height: CELL_SIZE * ROWS }}
              >
                {/* Grid Background */}
                <div className="absolute inset-0 grid grid-cols-15 grid-rows-5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                  {Array.from({ length: ROWS * COLS }).map((_, i) => {
                    const x = i % COLS;
                    const y = Math.floor(i / COLS);
                    const isPlayerArea = x < 5;
                    const isPrepArea = x >= 5 && x < 10;
                    const isEnemyArea = x >= 10;
                    const isHighlighted = highlightedCells.some((c) => c.x === x && c.y === y);
                    
                    let bgClass = '';
                    if (isPlayerArea) bgClass = 'bg-[rgba(0,255,136,0.08)]';
                    else if (isPrepArea) bgClass = 'bg-[rgba(255,255,0,0.05)]';
                    else if (isEnemyArea) bgClass = 'bg-[rgba(255,77,77,0.08)]';

                    let buffText = null;
                    if (isPlayerArea) buffText = getCellBuff('player', x, y, hoveredPlayerFormation || playerFormation);
                    if (isEnemyArea) buffText = getCellBuff('enemy', x, y, hoveredEnemyFormation || enemyFormation);

                  return (
                    <div
                      key={i}
                      className={`border border-white/10 border-dashed box-border transition-colors duration-200 relative ${bgClass} ${isHighlighted ? 'bg-yellow-400/30 border-yellow-400/50' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, x, y)}
                    >
                      {buffText && !battleStarted && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[8px] text-white/50 text-center leading-tight px-1">{buffText}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

                {/* Props */}
                {props.map((p) => {
                  if (!p.active) return null;
                  return (
                    <div
                      key={p.id}
                      draggable={!battleStarted}
                      onDragStart={(e) => handleBoardPropDragStart(e, p.id)}
                      className="absolute flex flex-col items-center justify-center rounded-lg text-[13px] font-bold z-10 bg-[#222] border-2 border-[#555] cursor-pointer group"
                      style={{
                        width: CELL_SIZE - 8,
                        height: CELL_SIZE - 8,
                        left: p.x * CELL_SIZE + 4,
                        top: p.y * CELL_SIZE + 4,
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-[#555]">
                        {PROP_DATA[p.type].desc}
                      </div>
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{PROP_DATA[p.type].icon}</span>
                        <span className="text-[10px] text-[#aaa]">{PROP_DATA[p.type].name}</span>
                      </div>
                      {p.hp !== undefined && (
                        <div className="absolute bottom-0 w-[80%] h-[4px] bg-[#333] rounded-[2px] overflow-hidden mb-1">
                          <div
                            className="h-full bg-[#aaa] transition-all duration-200"
                            style={{ width: `${Math.max(0, (p.hp / (p.maxHp || 100)) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Units */}
                {units.map((u) => {
                  if (u.hp <= 0) return null;
                  const isSelected = u.id === selectedUnitId;
                  const isPlayer = u.team === 'player';
                  const hpPercent = Math.max(0, (u.hp / u.maxHp) * 100);
                  const attackAnimClass = u.attackTrigger ? (isPlayer ? 'animate-attack-right' : 'animate-attack-left') : '';
                  const castAnimClass = u.castTrigger ? 'animate-skill-cast' : '';

                  return (
                    <div
                      key={u.id}
                      draggable={!battleStarted}
                      onDragStart={(e) => handleBoardUnitDragStart(e, u.id)}
                      onClick={() => !battleStarted && setSelectedUnitId(u.id)}
                      onMouseEnter={() => setHoveredUnitId(u.id)}
                      onMouseLeave={() => setHoveredUnitId(null)}
                      className={`absolute rounded-lg text-[13px] font-bold cursor-pointer transition-all duration-300 z-20
                        ${isPlayer ? 'bg-[rgba(0,100,50,0.9)] border-2 border-[#00ff88]' : 'bg-[rgba(100,0,0,0.9)] border-2 border-[#ff4d4d]'}
                        ${isSelected ? 'shadow-[0_0_15px_#fff,inset_0_0_10px_rgba(255,255,255,0.5)] scale-105 z-30' : 'hover:scale-105'}
                      `}
                      style={{
                        width: CELL_SIZE - 8,
                        height: CELL_SIZE - 8,
                        left: u.x * CELL_SIZE + 4,
                        top: u.y * CELL_SIZE + 4,
                      }}
                    >
                      {/* Tooltip */}
                      {hoveredUnitId === u.id && u.skills.length > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none border border-[#555]">
                          {u.skills.map(s => SKILL_DATA[s].name).join(', ')}
                        </div>
                      )}

                      {/* Floating Texts */}
                      {u.floatingTexts?.map((ft) => (
                        <div key={ft.id} className={`absolute top-0 left-1/2 -translate-x-1/2 text-sm font-bold pointer-events-none z-40 animate-float-up ${ft.color}`}>
                          {ft.text}
                        </div>
                      ))}

                      {/* Animated Inner Div */}
                      <div key={`anim-${u.attackTrigger}-${u.castTrigger}`} className={`w-full h-full flex flex-col items-center justify-center ${attackAnimClass} ${castAnimClass}`}>
                        {/* Skill Indicator */}
                        <div className={`absolute -top-[15px] text-[12px] text-yellow-400 font-bold whitespace-nowrap transition-opacity duration-200 ${u.activeSkill ? 'opacity-100' : 'opacity-0'}`}>
                          {u.activeSkill}
                        </div>

                        <div className="flex flex-col items-center leading-tight">
                          <span>{CLASS_DATA[u.type].icon} {CLASS_DATA[u.type].name}</span>
                        </div>

                        <div className="text-[10px] mt-[2px]">
                          {Math.floor(u.hp)}/{u.maxHp}
                        </div>
                        <div className="w-[80%] h-[5px] bg-[#333] rounded-[3px] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${isPlayer ? 'bg-[#00ff88]' : 'bg-[#ff4d4d]'}`}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Enemy Formations */}
            <div className="flex flex-col gap-2 w-[120px] pt-8">
              <div className="text-[#ff4d4d] text-sm font-bold text-center mb-1">敌方阵法</div>
              {(Object.keys(FORMATION_DATA) as FormationType[]).map(f => (
                <div
                  key={f}
                  className={`p-2 border-2 rounded cursor-pointer text-xs text-center transition-colors ${enemyFormation === f ? 'bg-[#ff4d4d] text-white border-[#ff4d4d] font-bold' : 'bg-[#222] text-white border-[#444] hover:border-[#ff4d4d]'}`}
                  onClick={() => !battleStarted && setEnemyFormation(f)}
                  onMouseEnter={() => !battleStarted && setHoveredEnemyFormation(f)}
                  onMouseLeave={() => !battleStarted && setHoveredEnemyFormation(null)}
                >
                  {FORMATION_DATA[f].name}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Panels: Setup and Controls */}
          <div className="w-full flex-1 grid grid-cols-3 gap-5 items-stretch min-h-0">
            {/* Col 1: Setup */}
            <div className={`bg-[#2b2b36] p-4 rounded-[10px] border border-[#444] flex flex-col gap-4 transition-opacity duration-300 overflow-y-auto ${battleStarted ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <h3 className="text-[#00d2ff] text-sm font-medium border-b border-[#555] pb-1 mb-2 m-0">1. 兵种招募池 (拖拽上阵)</h3>
                <div className="flex gap-2 justify-around mb-1">
                  {(Object.keys(CLASS_DATA) as UnitType[]).map((type) => (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, type)}
                      className="w-[50px] h-[50px] bg-[#333] border-2 border-[#777] rounded-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:border-[#aaa] transition-colors"
                    >
                      <span className="text-base leading-none mb-1">{CLASS_DATA[type].icon}</span>
                      <span className="text-[10px]">{CLASS_DATA[type].name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#888] text-center">* 我方及敌方最多各上阵 4 人</div>
              </div>

              <div>
                <h3 className="text-[#00d2ff] text-sm font-medium border-b border-[#555] pb-1 mb-2 m-0">1.5 备战物件 (拖拽至中场)</h3>
                <div className="flex gap-2 justify-around">
                  {(Object.keys(PROP_DATA) as PropType[]).map((type) => (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, type, true)}
                      className="w-[50px] h-[50px] bg-[#333] border-2 border-[#777] rounded-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:border-[#aaa] transition-colors relative group"
                    >
                      <span className="text-base leading-none mb-1">{PROP_DATA[type].icon}</span>
                      <span className="text-[10px]">{PROP_DATA[type].name}</span>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {PROP_DATA[type].desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 2: Tactics */}
            <div className={`bg-[#2b2b36] p-4 rounded-[10px] border border-[#444] flex flex-col gap-2 transition-opacity duration-300 ${battleStarted ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-[#00d2ff] text-sm font-medium border-b border-[#555] pb-1 m-0">2. 战术装配 (最多2个)</h3>
              <div className="bg-[#1a1a2e] p-3 rounded-lg border border-[#333] flex-1 flex flex-col">
                {!selectedUnit ? (
                  <div className="text-[#888] text-center m-auto text-xs">请在沙盘中点击选中一个单位</div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className={`font-bold mb-2 text-xs ${selectedUnit.team === 'player' ? 'text-[#00ff88]' : 'text-[#ff4d4d]'}`}>
                      已选中：{CLASS_DATA[selectedUnit.type].name} ({selectedUnit.team === 'player' ? '我方' : '敌方'})
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                      {(Object.keys(SKILL_DATA) as SkillType[]).map((key) => {
                        const isChecked = selectedUnit.skills.includes(key);
                        const isDisabled = !isChecked && selectedUnit.skills.length >= 2;
                        return (
                          <label
                            key={key}
                            onMouseEnter={() => setHoveredSkill(key)}
                            onMouseLeave={() => setHoveredSkill(null)}
                            className={`flex items-start gap-1.5 text-xs cursor-pointer transition-opacity ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
                          >
                            <input
                              type="checkbox"
                              className="mt-[1px] cursor-pointer"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => toggleSkill(key)}
                            />
                            <div>
                              <span className="font-bold">{SKILL_DATA[key].name}</span>: 
                              <span className="text-[#ccc] ml-1">{SKILL_DATA[key].desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      onClick={removeSelectedUnit}
                      className="mt-2 w-full bg-[#ff4d4d] text-white border-none py-1.5 px-2 rounded cursor-pointer text-xs hover:bg-[#ff3333] transition-colors flex-shrink-0"
                    >
                      🗑️ 撤回该兵种
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Col 3: Controls & Logs */}
            <div className="bg-[#2b2b36] p-4 rounded-[10px] border border-[#444] flex flex-col gap-3">
              <h3 className="text-[#00d2ff] text-sm font-medium border-b border-[#555] pb-1 m-0">3. 战斗演算中心</h3>
              
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={startBattle}
                  disabled={battleStarted}
                  className="flex-1 bg-[#00ff88] text-black font-bold py-2 px-3 border-none rounded cursor-pointer text-sm disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed"
                >
                  ▶ 开始演算
                </button>
                <button
                  onClick={resetBattle}
                  className="flex-1 bg-[#444] text-white font-bold py-2 px-3 border-none rounded cursor-pointer text-sm hover:bg-[#555]"
                >
                  ↺ 清空重置
                </button>
              </div>

              <h3 className="text-[#00d2ff] text-xs font-medium border-b border-[#555] pb-1 m-0 mt-1">实战日志</h3>
              <div
                ref={logContainerRef}
                className="flex-1 bg-[#050505] text-[#0f0] font-mono text-[10px] p-2 overflow-y-auto rounded border border-[#333] leading-[1.4] min-h-0 max-h-[280px]"
              >
                {logs.map((log) => (
                  <div key={log.id} className={log.color}>
                    {log.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
