import React, { useState } from 'react';
import { 
  Zap, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Volume2, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight,
  ChevronDown,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { LogicRule, LogicAction, LogicCondition, GameProject } from '../types';

interface VisualLogicEditorProps {
  project: GameProject;
  onUpdateRules: (rules: LogicRule[]) => void;
}

const LOGIC_RECIPES = [
  {
    name: 'Collect Coin for +10 Score',
    rule: {
      name: 'Coin Grabber',
      enabled: true,
      event: { type: 'on_collision' as const, param: 'coin' },
      conditions: [],
      actions: [
        { type: 'change_var' as const, target: 'score', param: 10 },
        { type: 'play_sound' as const, target: 'coin' },
        { type: 'destroy' as const }
      ]
    }
  },
  {
    name: 'Fire Laser on Spacebar',
    rule: {
      name: 'Laser Cannon',
      enabled: true,
      event: { type: 'key_pressed' as const, param: 'Space' },
      conditions: [],
      actions: [
        { type: 'play_sound' as const, target: 'laser' },
        { type: 'shoot' as const }
      ]
    }
  },
  {
    name: 'Touch Castle Gate to Win',
    rule: {
      name: 'Victory Reach',
      enabled: true,
      event: { type: 'on_collision' as const, param: 'goal' },
      conditions: [],
      actions: [
        { type: 'play_sound' as const, target: 'win' },
        { type: 'win' as const, param: 'Stage Cleared!' }
      ]
    }
  },
  {
    name: 'Hurt on Hazard Spikes',
    rule: {
      name: 'Spike Damage',
      enabled: true,
      event: { type: 'on_collision' as const, param: 'hazard' },
      conditions: [],
      actions: [
        { type: 'change_var' as const, target: 'lives', param: -1 },
        { type: 'play_sound' as const, target: 'hit' }
      ]
    }
  }
];

export const VisualLogicEditor: React.FC<VisualLogicEditorProps> = ({
  project,
  onUpdateRules
}) => {
  const [rules, setRules] = useState<LogicRule[]>(project.logicRules || []);
  const [showRecipes, setShowRecipes] = useState(false);

  const saveRules = (newRules: LogicRule[]) => {
    setRules(newRules);
    onUpdateRules(newRules);
  };

  const handleToggleRule = (index: number) => {
    const updated = [...rules];
    updated[index].enabled = !updated[index].enabled;
    saveRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    saveRules(updated);
  };

  const handleAddNewRule = () => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      name: `Custom Rule #${rules.length + 1}`,
      enabled: true,
      event: {
        type: 'on_collision',
        param: 'coin'
      },
      conditions: [],
      actions: [
        { type: 'change_var', target: 'score', param: 10 },
        { type: 'play_sound', target: 'coin' },
        { type: 'destroy' }
      ]
    };
    saveRules([...rules, newRule]);
  };

  const handleAddRecipe = (recipe: typeof LOGIC_RECIPES[0]) => {
    const rule: LogicRule = {
      id: `rule-${Date.now()}`,
      ...recipe.rule
    };
    saveRules([...rules, rule]);
    setShowRecipes(false);
  };

  const handleAddCondition = (ruleIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].conditions.push({
      target: 'score',
      operator: '>=',
      value: 10
    });
    saveRules(updated);
  };

  const handleAddAction = (ruleIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].actions.push({
      type: 'play_sound',
      target: 'coin'
    });
    saveRules(updated);
  };

  return (
    <div id="visual-logic-root" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Educational Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Visual Game Logic Builder</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Assemble how your game behaves using beginner-friendly <strong>Events</strong>, <strong>Conditions</strong>, and <strong>Actions</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-recipe-toggle"
              onClick={() => setShowRecipes(!showRecipes)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Premade Recipes</span>
            </button>

            <button
              id="btn-add-new-rule"
              onClick={handleAddNewRule}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Logic Block</span>
            </button>
          </div>
        </div>

        {/* Visual Anatomy Explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center font-bold text-[10px]">1</span>
            <div><strong>WHEN (Event):</strong> Player touches coin or presses Space</div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-[10px]">2</span>
            <div><strong>IF (Condition):</strong> Check variable (e.g. Has Key == true)</div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-[10px]">3</span>
            <div><strong>THEN (Action):</strong> Add Score, Play Sound, Win Game!</div>
          </div>
        </div>

        {/* Recipes Dropdown Modal / Strip */}
        {showRecipes && (
          <div className="mt-3 p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="text-xs font-bold text-indigo-300">Choose a Quick Beginner Recipe to Insert:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LOGIC_RECIPES.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => handleAddRecipe(rec)}
                  className="p-2.5 rounded-lg bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left text-xs text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium">{rec.name}</span>
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No logic rules configured yet!</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add a rule to define what happens when a player touches coins, enemies, flags, or presses keyboard buttons.
            </p>
            <button
              onClick={handleAddNewRule}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium cursor-pointer"
            >
              Add First Rule
            </button>
          </div>
        ) : (
          rules.map((rule, rIdx) => (
            <div
              key={rule.id}
              id={`logic-rule-card-${rIdx}`}
              className={`rounded-xl border transition-all p-5 space-y-4 ${rule.enabled ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-900/40 border-slate-800/40 opacity-70'}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRule(rIdx)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-indigo-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[rIdx].name = e.target.value;
                      saveRules(updated);
                    }}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-indigo-500"
                  />
                </div>

                <button
                  id={`btn-delete-rule-${rIdx}`}
                  onClick={() => handleDeleteRule(rIdx)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Event Block (WHEN) */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs">
                <span className="font-bold text-sky-400 uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20">
                  WHEN
                </span>

                <select
                  value={rule.event.type}
                  onChange={(e) => {
                    const updated = [...rules];
                    updated[rIdx].event.type = e.target.value as any;
                    saveRules(updated);
                  }}
                  className="bg-slate-950 border border-sky-500/40 rounded px-2 py-1 text-slate-200 font-medium"
                >
                  <option value="on_collision">Player Collides With</option>
                  <option value="key_pressed">Keyboard Key Pressed</option>
                  <option value="on_start">Game Level Starts</option>
                </select>

                {rule.event.type === 'on_collision' && (
                  <select
                    value={rule.event.param || 'coin'}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[rIdx].event.param = e.target.value;
                      saveRules(updated);
                    }}
                    className="bg-slate-950 border border-sky-500/40 rounded px-2 py-1 text-sky-300 font-medium capitalize"
                  >
                    <option value="coin">Coin / Gem</option>
                    <option value="enemy">Enemy Slime / Drone</option>
                    <option value="hazard">Hazard / Spikes</option>
                    <option value="goal">Goal Flag / Chest</option>
                    <option value="door">Locked Door</option>
                    <option value="key">Bronze / Gold Key</option>
                  </select>
                )}

                {rule.event.type === 'key_pressed' && (
                  <select
                    value={rule.event.param || 'Space'}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[rIdx].event.param = e.target.value;
                      saveRules(updated);
                    }}
                    className="bg-slate-950 border border-sky-500/40 rounded px-2 py-1 text-sky-300 font-medium"
                  >
                    <option value="Space">Spacebar (Fire / Jump)</option>
                    <option value="ArrowUp">Up Arrow</option>
                    <option value="KeyZ">Z Key</option>
                    <option value="KeyX">X Key</option>
                  </select>
                )}
              </div>

              {/* Conditions Block (IF) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400">Conditions (Optional)</span>
                  <button
                    onClick={() => handleAddCondition(rIdx)}
                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add IF Condition</span>
                  </button>
                </div>

                {rule.conditions.map((cond, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <span className="font-bold text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-500/20">IF</span>
                    <select
                      value={cond.target}
                      onChange={(e) => {
                        const updated = [...rules];
                        updated[rIdx].conditions[cIdx].target = e.target.value;
                        saveRules(updated);
                      }}
                      className="bg-slate-950 border border-amber-500/40 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="score">Score</option>
                      <option value="lives">Lives</option>
                      <option value="hasKey">Has Key</option>
                      <option value="coins">Coins</option>
                    </select>

                    <select
                      value={cond.operator}
                      onChange={(e) => {
                        const updated = [...rules];
                        updated[rIdx].conditions[cIdx].operator = e.target.value as any;
                        saveRules(updated);
                      }}
                      className="bg-slate-950 border border-amber-500/40 rounded px-2 py-1 text-slate-200 font-mono"
                    >
                      <option value="==">== (Equals)</option>
                      <option value="!=">!= (Not equals)</option>
                      <option value=">">&gt; (Greater than)</option>
                      <option value="<">&lt; (Less than)</option>
                      <option value=">=">&gt;= (Greater or equal)</option>
                    </select>

                    <input
                      type="text"
                      value={String(cond.value)}
                      onChange={(e) => {
                        const updated = [...rules];
                        const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                        updated[rIdx].conditions[cIdx].value = val;
                        saveRules(updated);
                      }}
                      className="w-20 bg-slate-950 border border-amber-500/40 rounded px-2 py-1 text-amber-300 font-mono"
                    />

                    <button
                      onClick={() => {
                        const updated = [...rules];
                        updated[rIdx].conditions.splice(cIdx, 1);
                        saveRules(updated);
                      }}
                      className="ml-auto text-slate-500 hover:text-rose-400 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions Block (THEN) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">Actions to Execute</span>
                  <button
                    onClick={() => handleAddAction(rIdx)}
                    className="text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add THEN Action</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {rule.actions.map((act, aIdx) => (
                    <div key={aIdx} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                      <span className="font-bold text-emerald-400 uppercase px-2 py-0.5 rounded bg-emerald-500/20">THEN</span>

                      <select
                        value={act.type}
                        onChange={(e) => {
                          const updated = [...rules];
                          updated[rIdx].actions[aIdx].type = e.target.value as any;
                          saveRules(updated);
                        }}
                        className="bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-slate-200"
                      >
                        <option value="change_var">Change Variable</option>
                        <option value="play_sound">Play Sound Effect</option>
                        <option value="shoot">Shoot Projectile Laser</option>
                        <option value="destroy">Destroy Target Entity</option>
                        <option value="win">Win Game</option>
                        <option value="game_over">Game Over</option>
                        <option value="message">Show HUD Banner</option>
                      </select>

                      {act.type === 'change_var' && (
                        <>
                          <select
                            value={act.target || 'score'}
                            onChange={(e) => {
                              const updated = [...rules];
                              updated[rIdx].actions[aIdx].target = e.target.value;
                              saveRules(updated);
                            }}
                            className="bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-slate-200"
                          >
                            <option value="score">Score</option>
                            <option value="lives">Lives</option>
                            <option value="coins">Coins</option>
                            <option value="hasKey">Has Key</option>
                          </select>
                          <span className="text-slate-400">by</span>
                          <input
                            type="number"
                            value={act.param ?? 10}
                            onChange={(e) => {
                              const updated = [...rules];
                              updated[rIdx].actions[aIdx].param = Number(e.target.value);
                              saveRules(updated);
                            }}
                            className="w-16 bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 font-mono"
                          />
                        </>
                      )}

                      {act.type === 'play_sound' && (
                        <select
                          value={act.target || 'coin'}
                          onChange={(e) => {
                            const updated = [...rules];
                            updated[rIdx].actions[aIdx].target = e.target.value;
                            saveRules(updated);
                          }}
                          className="bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300"
                        >
                          <option value="coin">Coin Chime</option>
                          <option value="jump">Jump Sweep</option>
                          <option value="laser">Laser Beam</option>
                          <option value="explosion">Explosion Boom</option>
                          <option value="hit">Hit Damage</option>
                          <option value="win">Victory Fanfare</option>
                        </select>
                      )}

                      {act.type === 'message' && (
                        <input
                          type="text"
                          value={act.param || ''}
                          placeholder="e.g. Secret area found!"
                          onChange={(e) => {
                            const updated = [...rules];
                            updated[rIdx].actions[aIdx].param = e.target.value;
                            saveRules(updated);
                          }}
                          className="flex-1 min-w-[140px] bg-slate-950 border border-emerald-500/40 rounded px-2 py-1 text-slate-200"
                        />
                      )}

                      <button
                        onClick={() => {
                          const updated = [...rules];
                          updated[rIdx].actions.splice(aIdx, 1);
                          saveRules(updated);
                        }}
                        className="ml-auto text-slate-500 hover:text-rose-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
