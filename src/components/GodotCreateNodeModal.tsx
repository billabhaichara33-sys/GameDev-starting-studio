import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Box, 
  Layers, 
  Video, 
  Sun, 
  Volume2, 
  Sparkles, 
  FileCode, 
  Plus, 
  Check, 
  Maximize2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { EntityType, Node3DType } from '../types';

export interface GodotNodeOption {
  id: string;
  name: string;
  category: '2D' | '3D' | 'UI' | 'Common';
  badgeColor: string;
  description: string;
  is3D: boolean;
  defaultType2D?: EntityType;
  defaultType3D?: Node3DType;
}

const GODOT_NODES: GodotNodeOption[] = [
  // 2D Nodes
  {
    id: 'CharacterBody2D',
    name: 'CharacterBody2D',
    category: '2D',
    badgeColor: '#478cbf',
    description: '2D physics body specialized for characters controlled by script. Supports gravity, floor detection, and move_and_slide().',
    is3D: false,
    defaultType2D: 'player'
  },
  {
    id: 'StaticBody2D',
    name: 'StaticBody2D',
    category: '2D',
    badgeColor: '#478cbf',
    description: '2D physics body for static obstacles and platforms that do not move with physics impulses.',
    is3D: false,
    defaultType2D: 'platform'
  },
  {
    id: 'RigidBody2D',
    name: 'RigidBody2D',
    category: '2D',
    badgeColor: '#478cbf',
    description: '2D physics body driven by a simulated physical world with mass, friction, forces, and restitution.',
    is3D: false,
    defaultType2D: 'box'
  },
  {
    id: 'Area2D',
    name: 'Area2D',
    category: '2D',
    badgeColor: '#22c55e',
    description: '2D region for detecting overlap, collisions, trigger zones, coin pickups, and goal zones.',
    is3D: false,
    defaultType2D: 'coin'
  },
  {
    id: 'Sprite2D',
    name: 'Sprite2D',
    category: '2D',
    badgeColor: '#a855f7',
    description: 'A 2D node that displays a 2D texture or sprite sheet with filtering and modulation.',
    is3D: false,
    defaultType2D: 'player'
  },
  {
    id: 'Camera2D',
    name: 'Camera2D',
    category: '2D',
    badgeColor: '#eab308',
    description: 'Camera node for 2D scenes that translates and zooms to follow players with smooth lerping.',
    is3D: false,
    defaultType2D: 'player'
  },
  {
    id: 'TileMap',
    name: 'TileMap',
    category: '2D',
    badgeColor: '#f97316',
    description: 'Grid-based level builder for painting layered autotiles, walls, and collision terrain.',
    is3D: false,
    defaultType2D: 'platform'
  },
  {
    id: 'GPUParticles2D',
    name: 'GPUParticles2D',
    category: '2D',
    badgeColor: '#ec4899',
    description: '2D particle system node used to generate sparks, explosions, smoke, and magical trails.',
    is3D: false,
    defaultType2D: 'hazard'
  },

  // 3D Nodes
  {
    id: 'MeshInstance3D',
    name: 'MeshInstance3D',
    category: '3D',
    badgeColor: '#ef4444',
    description: 'Node that instances a 3D geometry (Box, Sphere, Cylinder, Capsule, Torus) with PBR StandardMaterial.',
    is3D: true,
    defaultType3D: 'MeshInstance3D'
  },
  {
    id: 'CharacterBody3D',
    name: 'CharacterBody3D',
    category: '3D',
    badgeColor: '#ef4444',
    description: '3D physics body specialized for playable characters with 3D gravity, jumping, and ground raycasts.',
    is3D: true,
    defaultType3D: 'CharacterBody3D'
  },
  {
    id: 'RigidBody3D',
    name: 'RigidBody3D',
    category: '3D',
    badgeColor: '#ef4444',
    description: '3D physics body simulated by physics engine with mass, linear/angular velocity, and bouncing.',
    is3D: true,
    defaultType3D: 'RigidBody3D'
  },
  {
    id: 'DirectionalLight3D',
    name: 'DirectionalLight3D',
    category: '3D',
    badgeColor: '#eab308',
    description: 'Directional sunlight light source with parallel rays, cascade shadow mapping, and day/night coloring.',
    is3D: true,
    defaultType3D: 'DirectionalLight3D'
  },
  {
    id: 'Camera3D',
    name: 'Camera3D',
    category: '3D',
    badgeColor: '#38bdf8',
    description: 'Perspective 3D camera with adjustable FOV, near/far clipping planes, and frustum culling.',
    is3D: true,
    defaultType3D: 'Camera3D'
  },
  {
    id: 'OmniLight3D',
    name: 'OmniLight3D',
    category: '3D',
    badgeColor: '#eab308',
    description: 'Point light source that emits light in all 3D spherical directions with attenuation radius.',
    is3D: true,
    defaultType3D: 'OmniLight3D'
  }
];

interface GodotCreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (node: GodotNodeOption) => void;
  currentWorkspace: '2D' | '3D' | 'Script' | 'AssetLib';
}

export const GodotCreateNodeModal: React.FC<GodotCreateNodeModalProps> = ({
  isOpen,
  onClose,
  onSelectNode,
  currentWorkspace
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<GodotNodeOption>(
    currentWorkspace === '3D' ? GODOT_NODES.find(n => n.is3D)! : GODOT_NODES[0]
  );
  const [filterCategory, setFilterCategory] = useState<'All' | '2D' | '3D'>('All');

  if (!isOpen) return null;

  const filtered = GODOT_NODES.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) || 
                          n.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'All' || n.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-2xl bg-[#202531] border border-[#2e3748] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Modal Header */}
        <div className="h-10 bg-[#171b24] border-b border-[#2e3748] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#599eff]" />
            <span className="font-bold text-white text-xs uppercase tracking-wider font-['Space_Grotesk']">
              Create New Node
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-[#1b202a] border-b border-[#2e3748] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Godot Nodes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#151922] border border-[#2e3748] rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-[#478cbf]"
              autoFocus
            />
          </div>

          <div className="flex items-center bg-[#151922] rounded border border-[#2e3748] overflow-hidden text-xs">
            <button
              onClick={() => setFilterCategory('All')}
              className={`px-2.5 py-1 ${filterCategory === 'All' ? 'bg-[#478cbf] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterCategory('2D')}
              className={`px-2.5 py-1 ${filterCategory === '2D' ? 'bg-[#478cbf] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2D
            </button>
            <button
              onClick={() => setFilterCategory('3D')}
              className={`px-2.5 py-1 ${filterCategory === '3D' ? 'bg-[#478cbf] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              3D
            </button>
          </div>
        </div>

        {/* Split View: Node List & Description */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node List */}
          <div className="w-1/2 border-r border-[#2e3748] overflow-y-auto bg-[#171b24] p-1 space-y-0.5 font-mono text-xs">
            {filtered.map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                onDoubleClick={() => {
                  onSelectNode(node);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                  selectedNode.id === node.id 
                    ? 'bg-[#478cbf] text-white font-bold' 
                    : 'text-slate-300 hover:bg-[#202531]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5" style={{ color: selectedNode.id === node.id ? '#ffffff' : node.badgeColor }} />
                  <span className="text-xs">{node.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  node.is3D ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {node.category}
                </span>
              </button>
            ))}
          </div>

          {/* Node Inspector Description Preview */}
          <div className="w-1/2 p-4 flex flex-col justify-between bg-[#1f2430]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2e3748]">
                <Box className="w-5 h-5 text-[#599eff]" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedNode.name}</h3>
                  <span className="text-[10px] text-slate-400">Class: {selectedNode.category} Node</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedNode.description}
              </p>

              <div className="p-2.5 rounded bg-[#171b24] border border-[#2e3748] text-[11px] font-mono text-slate-400 space-y-1">
                <div>Inherits: <span className="text-white">{selectedNode.is3D ? 'Node3D > Node' : 'Node2D > CanvasItem > Node'}</span></div>
                <div>Runtime: <span className="text-emerald-400">Native 60FPS</span></div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2e3748]">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-[#283040]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSelectNode(selectedNode);
                  onClose();
                }}
                className="px-4 py-1.5 rounded bg-[#478cbf] hover:bg-[#599eff] text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
