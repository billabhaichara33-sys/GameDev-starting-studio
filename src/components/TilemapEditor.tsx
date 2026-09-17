import React, { useState, useRef, useEffect } from 'react';
import { GameProject, TileData } from '../types';
import { Grid, Paintbrush, Eraser, Trash2, Check, Sparkles, Layers, Shield } from 'lucide-react';

interface TilemapEditorProps {
  project: GameProject;
  onUpdateProject: (project: GameProject) => void;
}

const TILE_PALETTE: { type: TileData['tileType']; label: string; color: string; solid: boolean; icon: string }[] = [
  { type: 'grass', label: 'Grass Turf', color: '#16a34a', solid: true, icon: '🌱' },
  { type: 'dirt', label: 'Deep Soil', color: '#854d0e', solid: true, icon: '🟤' },
  { type: 'stone', label: 'Stone Brick', color: '#475569', solid: true, icon: '🧱' },
  { type: 'metal', label: 'Iron Grate', color: '#64748b', solid: true, icon: '⚙️' },
  { type: 'hazard', label: 'Spike Hazard', color: '#ef4444', solid: false, icon: '⚠️' },
  { type: 'water', label: 'Water Pool', color: '#0284c7', solid: false, icon: '💧' },
  { type: 'coin', label: 'Gold Ore', color: '#eab308', solid: false, icon: '🪙' },
  { type: 'cloud', label: 'Cloud Vapour', color: '#cbd5e1', solid: false, icon: '☁️' }
];

export const TilemapEditor: React.FC<TilemapEditorProps> = ({ project, onUpdateProject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBrush, setSelectedBrush] = useState<TileData['tileType']>('grass');
  const [isErasing, setIsErasing] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const tileSize = project.tilemap?.tileSize || 32;
  const tiles = project.tilemap?.tiles || [];

  const cols = Math.floor((project.settings.canvasWidth || 800) / tileSize);
  const rows = Math.floor((project.settings.canvasHeight || 450) / tileSize);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = project.settings.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tileSize, 0);
      ctx.lineTo(c * tileSize, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * tileSize);
      ctx.lineTo(canvas.width, r * tileSize);
      ctx.stroke();
    }

    // Draw Placed Tiles
    tiles.forEach(tile => {
      ctx.fillStyle = tile.color;
      ctx.fillRect(tile.x * tileSize + 1, tile.y * tileSize + 1, tileSize - 2, tileSize - 2);

      // Tile texture detail
      if (tile.solid) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(tile.x * tileSize + 2, tile.y * tileSize + 2, tileSize - 4, 3);
      }
      if (tile.tileType === 'hazard') {
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.moveTo(tile.x * tileSize + tileSize / 2, tile.y * tileSize + 2);
        ctx.lineTo(tile.x * tileSize + 4, tile.y * tileSize + tileSize - 2);
        ctx.lineTo(tile.x * tileSize + tileSize - 4, tile.y * tileSize + tileSize - 2);
        ctx.closePath();
        ctx.fill();
      }
    });
  }, [tiles, tileSize, cols, rows, project.settings.backgroundColor]);

  const handlePaint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    const tileX = Math.floor(clickX / tileSize);
    const tileY = Math.floor(clickY / tileSize);

    if (tileX < 0 || tileX >= cols || tileY < 0 || tileY >= rows) return;

    const brushDef = TILE_PALETTE.find(p => p.type === selectedBrush)!;

    onUpdateProject({
      ...project,
      tilemap: {
        tileSize,
        tiles: isErasing
          ? tiles.filter(t => !(t.x === tileX && t.y === tileY))
          : [
              ...tiles.filter(t => !(t.x === tileX && t.y === tileY)),
              {
                id: `tile_${tileX}_${tileY}`,
                x: tileX,
                y: tileY,
                tileType: selectedBrush,
                color: brushDef.color,
                solid: brushDef.solid
              }
            ]
      }
    });
  };

  const handleClearTilemap = () => {
    if (confirm('Clear all painted tiles in this scene?')) {
      onUpdateProject({
        ...project,
        tilemap: {
          tileSize,
          tiles: []
        }
      });
    }
  };

  const handleGeneratePlatformPreset = () => {
    // Generate starter level ground and floating platforms
    const newTiles: TileData[] = [];
    const groundY = rows - 2;
    for (let c = 0; c < cols; c++) {
      newTiles.push({
        id: `tile_${c}_${groundY}`,
        x: c,
        y: groundY,
        tileType: 'grass',
        color: '#16a34a',
        solid: true
      });
      newTiles.push({
        id: `tile_${c}_${groundY + 1}`,
        x: c,
        y: groundY + 1,
        tileType: 'dirt',
        color: '#854d0e',
        solid: true
      });
    }

    // Floating stone platform
    const midX = Math.floor(cols / 2);
    for (let c = midX - 3; c <= midX + 3; c++) {
      newTiles.push({
        id: `tile_${c}_${groundY - 4}`,
        x: c,
        y: groundY - 4,
        tileType: 'stone',
        color: '#475569',
        solid: true
      });
    }

    onUpdateProject({
      ...project,
      tilemap: {
        tileSize,
        tiles: newTiles
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-['Space_Grotesk']">Tilemap Level Painter</h2>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Tile Size: {tileSize}px</span>
            <span>•</span>
            <span>Grid: {cols} × {rows}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{tiles.length} Tiles Placed</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-generate-tile-preset"
            onClick={handleGeneratePlatformPreset}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Ground & Platforms</span>
          </button>

          <button
            id="btn-clear-tilemap"
            onClick={handleClearTilemap}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Map</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Brush & Tool Palette */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Draw Tools</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-brush-paint"
                onClick={() => setIsErasing(false)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  !isErasing
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                <span>Paint Brush</span>
              </button>

              <button
                id="btn-brush-erase"
                onClick={() => setIsErasing(true)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isErasing
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span>Eraser</span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tile Palette</div>
            <div className="space-y-1.5">
              {TILE_PALETTE.map(tile => {
                const isSelected = selectedBrush === tile.type && !isErasing;
                return (
                  <button
                    key={tile.type}
                    id={`tile-palette-${tile.type}`}
                    onClick={() => {
                      setSelectedBrush(tile.type);
                      setIsErasing(false);
                    }}
                    className={`w-full p-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{tile.icon}</span>
                      <span className="font-semibold text-slate-200">{tile.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tile.solid ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                          <Shield className="w-2.5 h-2.5" /> Solid
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Passable</span>
                      )}
                      <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: tile.color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Day 1 Tilemap Concept
            </p>
            <p className="text-[11px] leading-relaxed">
              Tiles are automatically converted into solid collision boxes in the game engine physics loop!
            </p>
          </div>
        </div>

        {/* Center Canvas Viewport */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-slate-950/80">
          <div className="rounded-xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-900">
            <canvas
              ref={canvasRef}
              width={project.settings.canvasWidth || 800}
              height={project.settings.canvasHeight || 450}
              onMouseDown={(e) => {
                setIsMouseDown(true);
                handlePaint(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (isMouseDown) handlePaint(e.clientX, e.clientY);
              }}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
              className="cursor-crosshair block max-w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
