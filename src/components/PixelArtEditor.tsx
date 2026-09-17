import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Eye, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Layers, 
  Check,
  Grid,
  ChevronLeft
} from 'lucide-react';
import { SpriteAsset, SpriteFrame } from '../types';

interface PixelArtEditorProps {
  onBack: () => void;
  onSaveToProject?: (sprite: SpriteAsset) => void;
  initialSprite?: SpriteAsset | null;
}

const PALETTES: Record<string, string[]> = {
  'Arcade Classic': [
    '#000000', '#ffffff', '#71717a', '#38bdf8', '#0284c7', 
    '#22c55e', '#15803d', '#facc15', '#ca8a04', '#ef4444', 
    '#b91c1c', '#a855f7', '#7e22ce', '#ec4899', '#f97316', '#78350f'
  ],
  'GameBoy Mint': [
    '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
  ],
  'Neon Cyber': [
    '#0a0a14', '#ffffff', '#00ffcc', '#ff0055', '#ffe600', 
    '#7928ca', '#0070f3', '#50e3c2', '#ff0080', '#79ffe1'
  ]
};

export const PixelArtEditor: React.FC<PixelArtEditorProps> = ({
  onBack,
  onSaveToProject,
  initialSprite
}) => {
  const [gridSize, setGridSize] = useState<number>(initialSprite?.width || 16);
  const [spriteName, setSpriteName] = useState<string>(initialSprite?.name || 'New Sprite');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'bucket'>('pencil');
  const [paletteName, setPaletteName] = useState<string>('Arcade Classic');
  const [selectedColor, setSelectedColor] = useState<string>('#38bdf8');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [onionSkin, setOnionSkin] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(initialSprite?.fps || 4);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const [previewFrameIndex, setPreviewFrameIndex] = useState<number>(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  // Frames state: array of SpriteFrames
  const [frames, setFrames] = useState<SpriteFrame[]>(() => {
    if (initialSprite && initialSprite.frames && initialSprite.frames.length > 0) {
      return initialSprite.frames;
    }
    return [
      { id: 1, pixels: Array(gridSize * gridSize).fill('') }
    ];
  });

  const currentFrame = frames[currentFrameIndex] || frames[0];
  const previousFrame = currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : null;

  // Animation player loop
  useEffect(() => {
    if (!isPlayingAnim || frames.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlayingAnim, fps, frames.length]);

  // Handle drawing on canvas
  const handlePixelAction = (index: number) => {
    const updatedPixels = [...currentFrame.pixels];
    if (currentTool === 'pencil') {
      updatedPixels[index] = selectedColor;
    } else if (currentTool === 'eraser') {
      updatedPixels[index] = '';
    } else if (currentTool === 'bucket') {
      // Flood fill target
      const targetColor = updatedPixels[index];
      if (targetColor === selectedColor) return;
      const fillRecursive = (idx: number) => {
        if (idx < 0 || idx >= updatedPixels.length) return;
        if (updatedPixels[idx] !== targetColor) return;
        updatedPixels[idx] = selectedColor;
        const x = idx % gridSize;
        const y = Math.floor(idx / gridSize);
        if (x > 0) fillRecursive(idx - 1);
        if (x < gridSize - 1) fillRecursive(idx + 1);
        if (y > 0) fillRecursive(idx - gridSize);
        if (y < gridSize - 1) fillRecursive(idx + gridSize);
      };
      fillRecursive(index);
    }

    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...currentFrame,
      pixels: updatedPixels
    };
    setFrames(updatedFrames);
  };

  // Add new frame
  const handleAddFrame = () => {
    const newFrame: SpriteFrame = {
      id: Date.now(),
      pixels: Array(gridSize * gridSize).fill('')
    };
    setFrames([...frames, newFrame]);
    setCurrentFrameIndex(frames.length);
  };

  // Duplicate current frame
  const handleDuplicateFrame = () => {
    const dupFrame: SpriteFrame = {
      id: Date.now(),
      pixels: [...currentFrame.pixels]
    };
    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, dupFrame);
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
  };

  // Delete frame
  const handleDeleteFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== idx);
    setFrames(newFrames);
    if (currentFrameIndex >= newFrames.length) {
      setCurrentFrameIndex(newFrames.length - 1);
    }
  };

  // Clear current frame
  const handleClearFrame = () => {
    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...currentFrame,
      pixels: Array(gridSize * gridSize).fill('')
    };
    setFrames(updatedFrames);
  };

  // Save sprite object
  const handleSave = () => {
    const sprite: SpriteAsset = {
      id: initialSprite?.id || `sprite-${Date.now()}`,
      name: spriteName || 'Custom Sprite',
      width: gridSize,
      height: gridSize,
      frames,
      fps,
      palette: PALETTES[paletteName]
    };
    if (onSaveToProject) {
      onSaveToProject(sprite);
    }
  };

  // Render preview canvas
  const renderPreviewFrame = frames[isPlayingAnim ? previewFrameIndex : currentFrameIndex];

  return (
    <div id="pixel-editor-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-pixel-back"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              id="input-sprite-name"
              type="text"
              value={spriteName}
              onChange={(e) => setSpriteName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-base font-bold text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="text-xs text-slate-400 mt-0.5">Pixel Art & Animation Frame Studio</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Canvas size selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            {[16, 24, 32].map((size) => (
              <button
                key={size}
                id={`btn-size-${size}`}
                onClick={() => {
                  if (confirm('Changing canvas size will reset current frames. Proceed?')) {
                    setGridSize(size);
                    setFrames([{ id: 1, pixels: Array(size * size).fill('') }]);
                    setCurrentFrameIndex(0);
                  }
                }}
                className={`px-2.5 py-1 rounded font-mono cursor-pointer ${gridSize === size ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {size}x{size}
              </button>
            ))}
          </div>

          <button
            id="btn-save-sprite"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Sprite Asset</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Toolbar & Color Palette */}
        <div className="lg:col-span-3 space-y-4">
          {/* Drawing Tools */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="tool-pencil"
                onClick={() => setCurrentTool('pencil')}
                className={`p-2.5 rounded-lg flex flex-col items-center gap-1 text-xs font-medium cursor-pointer border ${currentTool === 'pencil' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Pencil className="w-4 h-4" />
                <span>Pencil</span>
              </button>
              <button
                id="tool-eraser"
                onClick={() => setCurrentTool('eraser')}
                className={`p-2.5 rounded-lg flex flex-col items-center gap-1 text-xs font-medium cursor-pointer border ${currentTool === 'eraser' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                <Eraser className="w-4 h-4" />
                <span>Eraser</span>
              </button>
              <button
                id="tool-bucket"
                onClick={() => setCurrentTool('bucket')}
                className={`p-2.5 rounded-lg flex flex-col items-center gap-1 text-xs font-medium cursor-pointer border ${currentTool === 'bucket' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                <PaintBucket className="w-4 h-4" />
                <span>Fill</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600"
                />
                <span>Pixel Grid</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onionSkin}
                  onChange={(e) => setOnionSkin(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600"
                />
                <span>Onion Skin</span>
              </label>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palette</h3>
              <select
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300"
              >
                {Object.keys(PALETTES).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PALETTES[paletteName].map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedColor(color);
                    if (currentTool === 'eraser') setCurrentTool('pencil');
                  }}
                  className={`w-full aspect-square rounded-md border-2 transition-transform cursor-pointer ${selectedColor === color && currentTool !== 'eraser' ? 'border-white scale-110 shadow-lg' : 'border-slate-800 hover:border-slate-600'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Custom Color Picker input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  if (currentTool === 'eraser') setCurrentTool('pencil');
                }}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{selectedColor}</span>
            </div>
          </div>

          {/* Animation Live Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</h3>
              <button
                id="btn-toggle-anim"
                onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {isPlayingAnim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingAnim ? 'Pause' : 'Play'}</span>
              </button>
            </div>

            {/* Miniature Canvas Preview */}
            <div className="w-32 h-32 mx-auto bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-2 shadow-inner">
              <div 
                className="grid w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`
                }}
              >
                {renderPreviewFrame.pixels.map((color, i) => (
                  <div key={i} style={{ backgroundColor: color || 'transparent' }} />
                ))}
              </div>
            </div>

            {/* FPS Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Speed</span>
                <span className="font-mono text-indigo-400">{fps} FPS</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Center Drawing Canvas */}
        <div className="lg:col-span-9 space-y-4">
          <div 
            id="pixel-canvas-container"
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[440px] shadow-lg select-none"
            onMouseLeave={() => setIsMouseDown(false)}
          >
            <div 
              className="relative aspect-square max-w-[420px] w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                cursor: currentTool === 'eraser' ? 'cell' : 'crosshair'
              }}
              onMouseDown={() => setIsMouseDown(true)}
              onMouseUp={() => setIsMouseDown(false)}
            >
              {currentFrame.pixels.map((color, idx) => {
                const prevColor = onionSkin && previousFrame ? previousFrame.pixels[idx] : null;
                return (
                  <div
                    key={idx}
                    id={`pixel-${idx}`}
                    onMouseDown={() => handlePixelAction(idx)}
                    onMouseEnter={() => {
                      if (isMouseDown) handlePixelAction(idx);
                    }}
                    className={`relative ${showGrid ? 'border-[0.5px] border-slate-800/60' : ''}`}
                    style={{
                      backgroundColor: color || (prevColor ? `${prevColor}33` : 'transparent')
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Animation Timeline & Frame Bar */}
          <div id="animation-timeline" className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Animation Timeline</span>
                <span className="text-xs text-slate-500 font-mono">({frames.length} frames)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-dup-frame"
                  onClick={handleDuplicateFrame}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  id="btn-clear-frame"
                  onClick={handleClearFrame}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
                <button
                  id="btn-add-frame"
                  onClick={handleAddFrame}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Frame</span>
                </button>
              </div>
            </div>

            {/* Frames Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
              {frames.map((frame, idx) => (
                <div
                  key={frame.id}
                  onClick={() => setCurrentFrameIndex(idx)}
                  className={`group relative flex-shrink-0 w-16 h-16 rounded-lg bg-slate-950 border-2 transition-all cursor-pointer p-1 ${idx === currentFrameIndex ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div 
                    className="w-full h-full grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                      gridTemplateRows: `repeat(${gridSize}, 1fr)`
                    }}
                  >
                    {frame.pixels.map((col, pIdx) => (
                      <div key={pIdx} style={{ backgroundColor: col || 'transparent' }} />
                    ))}
                  </div>

                  <span className="absolute bottom-0.5 right-1 text-[10px] font-mono text-slate-400 font-bold">
                    #{idx + 1}
                  </span>

                  {frames.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFrame(idx);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white hidden group-hover:flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
