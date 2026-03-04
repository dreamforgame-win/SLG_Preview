import React, { useState, useEffect, useRef, useMemo } from 'react';

const COLS = 50;
const ROWS = 50;
const R = 15;
const W = Math.sqrt(3) * R;
const H = 2 * R;

type TerrainType = 'plain' | 'mountain' | 'city' | 'pass';

interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  cityId?: string;
  regionId?: string;
  isPlayerCity?: boolean;
}

interface CityData {
  id: string;
  name: string;
  level: number;
  cells: {q: number, r: number}[];
  color: string;
  regionIndex: number;
}

function offsetToCube(col: number, row: number) {
  const x = col - (row - (row & 1)) / 2;
  const z = row;
  const y = -x - z;
  return { x, y, z };
}

function cubeDistance(a: any, b: any) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

function hexDistance(col1: number, row1: number, col2: number, row2: number) {
  return cubeDistance(offsetToCube(col1, row1), offsetToCube(col2, row2));
}

function getNeighbors(c: number, r: number) {
  const isOdd = r % 2 !== 0;
  const dirs = isOdd ? 
    [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]] :
    [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];
  
  return dirs.map(d => ({ q: c + d[0], r: r + d[1] }))
             .filter(n => n.q >= 0 && n.q < COLS && n.r >= 0 && n.r < ROWS);
}

const cityColors = [
  'rgba(255, 87, 51, 0.4)', 'rgba(51, 255, 87, 0.4)', 'rgba(51, 87, 255, 0.4)', 
  'rgba(255, 51, 168, 0.4)', 'rgba(168, 51, 255, 0.4)', 'rgba(51, 255, 245, 0.4)', 
  'rgba(255, 143, 51, 0.4)', 'rgba(143, 255, 51, 0.4)', 'rgba(255, 51, 51, 0.4)', 
  'rgba(51, 255, 143, 0.4)', 'rgba(200, 100, 50, 0.4)', 'rgba(50, 200, 100, 0.4)',
  'rgba(100, 50, 200, 0.4)', 'rgba(200, 50, 100, 0.4)', 'rgba(100, 200, 50, 0.4)',
  'rgba(50, 100, 200, 0.4)', 'rgba(200, 200, 50, 0.4)', 'rgba(50, 200, 200, 0.4)',
  'rgba(200, 50, 200, 0.4)', 'rgba(150, 150, 150, 0.4)', 'rgba(255, 255, 0, 0.4)'
];

function generateMapData() {
  const map: HexCell[][] = [];
  for (let c = 0; c < COLS; c++) {
    map[c] = [];
    for (let r = 0; r < ROWS; r++) {
      map[c][r] = { q: c, r: r, terrain: 'plain' };
    }
  }

  // Border & Pass
  for (let c = 0; c < COLS; c++) {
    if (c === 24 || c === 25) {
      map[c][24].terrain = 'pass';
    } else {
      map[c][24].terrain = 'mountain';
    }
  }

  // Random mountains
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (r !== 24 && Math.random() < 0.08) {
        map[c][r].terrain = 'mountain';
      }
    }
  }

  const cities: CityData[] = [];

  // 21 Regions: 7 columns x 3 rows in the spawn zone (r: 25 to 49)
  // Spawn zone width: 50 cols. Each region width ~ 7 cols
  // Spawn zone height: 25 rows. Each region height ~ 8 rows
  const regionCols = 7;
  const regionRows = 3;
  const colStep = Math.floor(COLS / regionCols); // 7
  const rowStep = Math.floor(25 / regionRows); // 8

  for (let i = 0; i < 21; i++) {
    const regionX = i % regionCols;
    const regionY = Math.floor(i / regionCols);
    
    // Center of the region
    const centerQ = Math.floor(regionX * colStep + colStep / 2);
    const centerR = Math.floor(25 + regionY * rowStep + rowStep / 2);

    let level = 1;
    let size = 1;
    let name = `县城 (${i+1}区)`;
    
    // 2、6、16、20号区域为2级城区域 (1-indexed: 2, 6, 16, 20 -> 0-indexed: 1, 5, 15, 19)
    if ([1, 5, 15, 19].includes(i)) {
      level = 2;
      size = 4;
      name = `郡城 (${i+1}区)`;
    }
    // 18号区域为3级城区域 (1-indexed: 18 -> 0-indexed: 17)
    else if (i === 17) {
      level = 3;
      size = 6;
      name = `州府 (${i+1}区)`;
    }

    // Ensure center is plain
    map[centerQ][centerR].terrain = 'plain';

    let cityCells = [{q: centerQ, r: centerR}];
    
    if (size > 1) {
      while(cityCells.length < size) {
        let possible: {q: number, r: number}[] = [];
        for (let cell of cityCells) {
          let ns = getNeighbors(cell.q, cell.r).filter(n => 
            n.r > 24 && 
            !cityCells.some(c => c.q === n.q && c.r === n.r)
          );
          possible.push(...ns);
        }
        if (possible.length > 0) {
          let pick = possible[Math.floor(Math.random() * possible.length)];
          map[pick.q][pick.r].terrain = 'plain'; // Force plain for city expansion
          cityCells.push(pick);
        } else {
          break; // Should not happen with forced plains
        }
      }
    }
    
    cityCells.forEach(cell => {
      map[cell.q][cell.r].terrain = 'city';
      map[cell.q][cell.r].cityId = `city_${i}`;
    });
    cities.push({ id: `city_${i}`, name, level, cells: cityCells, color: cityColors[i], regionIndex: i });
  }

  // Regions
  for (let c = 0; c < COLS; c++) {
    for (let r = 25; r < ROWS; r++) {
      if (map[c][r].terrain === 'city') {
        map[c][r].regionId = map[c][r].cityId;
        continue;
      }
      
      let minDist = Infinity;
      let closestCity = null;
      for (const city of cities) {
        const dist = hexDistance(c, r, city.cells[0].q, city.cells[0].r);
        if (dist < minDist) {
          minDist = dist;
          closestCity = city.id;
        }
      }
      map[c][r].regionId = closestCity || undefined;
    }
  }

  // Player city
  let playerPlaced = false;
  while (!playerPlaced) {
    const q = Math.floor(Math.random() * COLS);
    const r = Math.floor(Math.random() * 24) + 25;
    if (map[q][r].terrain === 'plain') {
      map[q][r].isPlayerCity = true;
      playerPlaced = true;
    }
  }

  return { map, cities };
}

const SAVED_MAP_KEY = 'slg_saved_map_v2';
const SAVED_OCCUPATION_KEY = 'slg_occupation_v2';

export default function WorldMap({ onEnterBattle }: { onEnterBattle: () => void }) {
  const [mapData, setMapData] = useState<{map: HexCell[][], cities: CityData[]} | null>(null);
  const [occupiedCities, setOccupiedCities] = useState<string[]>([]);
  const [occupiedPasses, setOccupiedPasses] = useState<string[]>([]); // "q,r" format
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{q: number, r: number, x: number, y: number} | null>(null);
  const [selectedCity, setSelectedCity] = useState<{id: string, x: number, y: number} | null>(null);
  const [selectedPass, setSelectedPass] = useState<{q: number, r: number, x: number, y: number} | null>(null);
  const [celebration, setCelebration] = useState<{x: number, y: number, text: string} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMap = localStorage.getItem(SAVED_MAP_KEY);
    const savedOcc = localStorage.getItem(SAVED_OCCUPATION_KEY);
    
    let data;
    if (savedMap) {
      try {
        data = JSON.parse(savedMap);
      } catch (e) {
        data = generateMapData();
        localStorage.setItem(SAVED_MAP_KEY, JSON.stringify(data));
      }
    } else {
      data = generateMapData();
      localStorage.setItem(SAVED_MAP_KEY, JSON.stringify(data));
    }
    setMapData(data);

    if (savedOcc) {
      try {
        const occData = JSON.parse(savedOcc);
        setOccupiedCities(occData.cities || []);
        setOccupiedPasses(occData.passes || []);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const saveOccupation = (cities: string[], passes: string[]) => {
    setOccupiedCities(cities);
    setOccupiedPasses(passes);
    localStorage.setItem(SAVED_OCCUPATION_KEY, JSON.stringify({ cities, passes }));
  };

  const handleRegenerate = () => {
    const data = generateMapData();
    localStorage.setItem(SAVED_MAP_KEY, JSON.stringify(data));
    setMapData(data);
    saveOccupation([], []);
    centerOnPlayer(data.map);
  };

  const centerOnPlayer = (currentMap: HexCell[][]) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let px = 0;
      let py = 0;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          if (currentMap[c][r].isPlayerCity) {
            px = W * (c + 0.5 * (r & 1)) + W/2;
            py = H * 0.75 * r + H/2;
            break;
          }
        }
      }
      setTransform({
        x: rect.width / 2 - px,
        y: rect.height / 2 - py,
        scale: 1
      });
    }
  };

  useEffect(() => {
    if (mapData && containerRef.current && transform.x === 0 && transform.y === 0) {
      centerOnPlayer(mapData.map);
    }
  }, [mapData]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => {
      let newScale = prev.scale * scaleChange;
      newScale = Math.max(0.2, Math.min(newScale, 3));
      
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
      const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
      
      return { x: newX, y: newY, scale: newScale };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
      setHoveredCell(null);
    } else if (mapData && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const mapX = (mouseX - transform.x) / transform.scale;
      const mapY = (mouseY - transform.y) / transform.scale;
      
      const r = Math.floor(mapY / (H * 0.75));
      const c = Math.floor((mapX - (r & 1) * W / 2) / W);
      
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        setHoveredCell({ q: c, r: r, x: e.clientX, y: e.clientY });
      } else {
        setHoveredCell(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    if (isDragging || !hoveredCell || !mapData) return;
    
    const cell = mapData.map[hoveredCell.q][hoveredCell.r];
    
    if (cell.terrain === 'city' && cell.cityId) {
      setSelectedCity({ id: cell.cityId, x: e.clientX, y: e.clientY });
      setSelectedPass(null);
    } else if (cell.terrain === 'pass') {
      setSelectedPass({ q: hoveredCell.q, r: hoveredCell.r, x: e.clientX, y: e.clientY });
      setSelectedCity(null);
    } else {
      setSelectedCity(null);
      setSelectedPass(null);
    }
  };

  const canOccupyCity = (cityId: string) => {
    if (!mapData) return false;
    if (occupiedCities.includes(cityId)) return false; // Already occupied
    
    const targetCity = mapData.cities.find(c => c.id === cityId);
    if (!targetCity) return false;

    if (occupiedCities.length === 0) {
      // First occupation: must be level 1
      return targetCity.level === 1;
    }

    // Subsequent occupation: must be adjacent to an occupied city's region
    // Find all cells belonging to the target city's region
    const targetRegionCells: {q: number, r: number}[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 25; r < ROWS; r++) {
        if (mapData.map[c][r].regionId === cityId) {
          targetRegionCells.push({q: c, r});
        }
      }
    }

    // Check if any target region cell is adjacent to any occupied region cell
    for (const cell of targetRegionCells) {
      const neighbors = getNeighbors(cell.q, cell.r);
      for (const n of neighbors) {
        const neighborCell = mapData.map[n.q][n.r];
        if (neighborCell.regionId && occupiedCities.includes(neighborCell.regionId)) {
          return true;
        }
      }
    }

    return false;
  };

  const canOccupyPass = (q: number, r: number) => {
    if (!mapData) return false;
    const passKey = `${q},${r}`;
    if (occupiedPasses.includes(passKey)) return false;

    // Must be adjacent to an occupied region
    const neighbors = getNeighbors(q, r);
    for (const n of neighbors) {
      const neighborCell = mapData.map[n.q][n.r];
      if (neighborCell.regionId && occupiedCities.includes(neighborCell.regionId)) {
        return true;
      }
    }
    return false;
  };

  const handleOccupyCity = () => {
    if (!selectedCity) return;
    if (canOccupyCity(selectedCity.id)) {
      saveOccupation([...occupiedCities, selectedCity.id], occupiedPasses);
      setCelebration({ x: selectedCity.x, y: selectedCity.y, text: '占领成功！' });
      setTimeout(() => setCelebration(null), 2000);
    }
    setSelectedCity(null);
  };

  const handleOccupyPass = () => {
    if (!selectedPass) return;
    if (canOccupyPass(selectedPass.q, selectedPass.r)) {
      const passKey = `${selectedPass.q},${selectedPass.r}`;
      saveOccupation(occupiedCities, [...occupiedPasses, passKey]);
      setCelebration({ x: selectedPass.x, y: selectedPass.y, text: '破关成功！' });
      setTimeout(() => setCelebration(null), 2000);
    }
    setSelectedPass(null);
  };

  const hexPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i - 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      points.push(`${R * Math.cos(angle_rad)},${R * Math.sin(angle_rad)}`);
    }
    return points.join(' ');
  }, []);

  if (!mapData) return <div className="w-full h-screen bg-[#111] text-white flex items-center justify-center">加载地图中...</div>;

  const showRegions = transform.scale < 0.6;
  
  let hoveredCityId: string | null = null;
  if (hoveredCell) {
    const cell = mapData.map[hoveredCell.q][hoveredCell.r];
    if (cell.terrain === 'city') {
      hoveredCityId = cell.cityId || null;
    }
  }

  return (
    <div className="w-full h-screen bg-[#111] overflow-hidden relative" 
         ref={containerRef}
         onWheel={handleWheel}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onClick={handleMouseClick}>
      
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <button 
          onClick={onEnterBattle}
          className="bg-[#00ff88] text-black px-4 py-2 rounded font-bold shadow-[0_0_10px_rgba(0,255,136,0.5)] hover:scale-105 transition-transform cursor-pointer"
        >
          ⚔️ 进入演武 (战局模拟器)
        </button>
        <button 
          onClick={handleRegenerate}
          className="bg-[#444] text-white px-4 py-2 rounded font-bold hover:bg-[#555] transition-colors cursor-pointer border border-[#666]"
        >
          重新生成地图
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-black/50 p-4 rounded text-white text-sm pointer-events-none border border-[#333]">
        <div className="font-bold mb-2 text-[#00d2ff]">图例说明</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#222] border border-[#444]"></div> 平地</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#555] border border-[#777]"></div> 山脉</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#8b4513] border border-[#a0522d]"></div> 关口</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#ffcc00] border border-[#ff9900]"></div> 城市</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[#00ff88] border border-[#00cc66]"></div> 玩家主城</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[rgba(0,100,255,0.4)] border border-[#0066ff]"></div> 已占领区域</div>
        <div className="mt-2 text-xs text-[#aaa]">滚轮缩放，拖拽平移<br/>点击城市/关口进行占领</div>
      </div>

      {hoveredCell && (
        <div 
          className="absolute z-20 bg-black/90 text-white px-3 py-2 rounded border border-[#00d2ff] pointer-events-none shadow-lg"
          style={{ left: hoveredCell.x + 15, top: hoveredCell.y + 15 }}
        >
          {(() => {
            const cell = mapData.map[hoveredCell.q][hoveredCell.r];
            let name = '平地';
            if (cell.terrain === 'mountain') name = '山脉';
            if (cell.terrain === 'pass') name = '关口';
            if (cell.isPlayerCity) name = '玩家主城';
            if (cell.terrain === 'city' && cell.cityId) {
              const city = mapData.cities.find(c => c.id === cell.cityId);
              if (city) name = city.name;
            }
            return (
              <>
                <div className="font-bold text-[#00d2ff]">{name}</div>
                <div className="text-xs text-[#ccc]">坐标: ({hoveredCell.q}, {hoveredCell.r})</div>
              </>
            );
          })()}
        </div>
      )}

      {selectedCity && (
        <div 
          className="absolute z-30 bg-[#222] text-white p-3 rounded border border-[#ff9900] shadow-xl flex flex-col gap-2"
          style={{ left: selectedCity.x + 10, top: selectedCity.y + 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-bold text-center border-b border-[#444] pb-1">
            {mapData.cities.find(c => c.id === selectedCity.id)?.name}
          </div>
          {occupiedCities.includes(selectedCity.id) ? (
            <div className="text-[#00ff88] text-sm text-center py-1">已占领</div>
          ) : (
            <button
              onClick={handleOccupyCity}
              disabled={!canOccupyCity(selectedCity.id)}
              className={`px-4 py-1.5 rounded text-sm font-bold ${
                canOccupyCity(selectedCity.id) 
                  ? 'bg-[#ff9900] text-black hover:bg-[#ffaa33] cursor-pointer' 
                  : 'bg-[#555] text-[#888] cursor-not-allowed'
              }`}
            >
              占领
            </button>
          )}
          {!canOccupyCity(selectedCity.id) && !occupiedCities.includes(selectedCity.id) && (
            <div className="text-[10px] text-[#ff4d4d] max-w-[120px] text-center">
              {occupiedCities.length === 0 ? '首次只能占领1级城' : '必须与已占领区域相邻'}
            </div>
          )}
        </div>
      )}

      {selectedPass && (
        <div 
          className="absolute z-30 bg-[#222] text-white p-3 rounded border border-[#a0522d] shadow-xl flex flex-col gap-2"
          style={{ left: selectedPass.x + 10, top: selectedPass.y + 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-bold text-center border-b border-[#444] pb-1">关口</div>
          {occupiedPasses.includes(`${selectedPass.q},${selectedPass.r}`) ? (
            <div className="text-[#00ff88] text-sm text-center py-1">已破关</div>
          ) : (
            <button
              onClick={handleOccupyPass}
              disabled={!canOccupyPass(selectedPass.q, selectedPass.r)}
              className={`px-4 py-1.5 rounded text-sm font-bold ${
                canOccupyPass(selectedPass.q, selectedPass.r) 
                  ? 'bg-[#8b4513] text-white hover:bg-[#a0522d] cursor-pointer' 
                  : 'bg-[#555] text-[#888] cursor-not-allowed'
              }`}
            >
              破关
            </button>
          )}
          {!canOccupyPass(selectedPass.q, selectedPass.r) && !occupiedPasses.includes(`${selectedPass.q},${selectedPass.r}`) && (
            <div className="text-[10px] text-[#ff4d4d] max-w-[120px] text-center">
              必须与已占领区域相邻
            </div>
          )}
        </div>
      )}

      {celebration && (
        <div 
          className="absolute z-50 text-[#00ff88] font-bold text-2xl animate-bounce pointer-events-none drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]"
          style={{ left: celebration.x - 50, top: celebration.y - 50 }}
        >
          {celebration.text}
        </div>
      )}

      <div 
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: COLS * W + W/2,
          height: ROWS * H * 0.75 + H/4
        }}
        className="absolute top-0 left-0 transition-transform duration-75 ease-out"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {/* Base terrain */}
          {mapData.map.map((col, c) => col.map((cell, r) => {
            const cx = W * (c + 0.5 * (r & 1)) + W/2;
            const cy = H * 0.75 * r + H/2;
            
            let fill = '#222';
            let stroke = '#333';
            
            if (cell.terrain === 'mountain') {
              fill = '#555';
              stroke = '#777';
            } else if (cell.terrain === 'pass') {
              fill = occupiedPasses.includes(`${c},${r}`) ? '#00cc66' : '#8b4513';
              stroke = occupiedPasses.includes(`${c},${r}`) ? '#00ff88' : '#a0522d';
            } else if (cell.terrain === 'city') {
              fill = '#ffcc00';
              stroke = '#ff9900';
            } else if (cell.isPlayerCity) {
              fill = '#00ff88';
              stroke = '#00cc66';
            }

            // Occupation overlay
            let occupationFill = 'transparent';
            if (cell.regionId && occupiedCities.includes(cell.regionId) && cell.terrain !== 'mountain' && cell.terrain !== 'pass') {
              occupationFill = 'rgba(0, 100, 255, 0.4)'; // Semi-transparent blue
            }

            // Region display when zoomed out
            let regionFill = 'transparent';
            if (showRegions && cell.regionId && cell.terrain !== 'mountain' && cell.terrain !== 'pass' && !occupiedCities.includes(cell.regionId)) {
              const city = mapData.cities.find(ct => ct.id === cell.regionId);
              if (city) {
                regionFill = city.color;
              }
            }

            // Hover city region flash
            let hoverFlash = 'transparent';
            if (hoveredCityId && cell.regionId === hoveredCityId && cell.terrain !== 'mountain' && cell.terrain !== 'pass') {
              hoverFlash = 'rgba(255, 255, 100, 0.3)';
            }

            const isHoveredCell = hoveredCell?.q === c && hoveredCell?.r === r;

            return (
              <g key={`${c}-${r}`} transform={`translate(${cx}, ${cy})`}>
                <polygon 
                  points={hexPoints} 
                  fill={fill} 
                  stroke={isHoveredCell ? '#fff' : stroke} 
                  strokeWidth={isHoveredCell ? "2" : "1"}
                />
                {regionFill !== 'transparent' && (
                  <polygon 
                    points={hexPoints} 
                    fill={regionFill} 
                    stroke="none"
                  />
                )}
                {occupationFill !== 'transparent' && (
                  <polygon 
                    points={hexPoints} 
                    fill={occupationFill} 
                    stroke="none"
                  />
                )}
                {hoverFlash !== 'transparent' && (
                  <polygon 
                    points={hexPoints} 
                    fill={hoverFlash} 
                    stroke="none"
                    className="animate-pulse"
                  />
                )}
                {cell.terrain === 'city' && (
                  <text x="0" y="4" fontSize="8" textAnchor="middle" fill="#000" fontWeight="bold" pointerEvents="none">
                    城
                  </text>
                )}
                {cell.isPlayerCity && (
                  <text x="0" y="4" fontSize="8" textAnchor="middle" fill="#000" fontWeight="bold" pointerEvents="none">
                    主
                  </text>
                )}
              </g>
            );
          }))}
          
          <text x={COLS * W / 2} y={10 * H} fontSize="60" fill="rgba(255,255,255,0.1)" textAnchor="middle" fontWeight="bold" pointerEvents="none">
            资 源 州
          </text>
          <text x={COLS * W / 2} y={35 * H} fontSize="60" fill="rgba(255,255,255,0.1)" textAnchor="middle" fontWeight="bold" pointerEvents="none">
            出 生 州
          </text>
        </svg>
      </div>
    </div>
  );
}

