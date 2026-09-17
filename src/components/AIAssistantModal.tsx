import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Lightbulb, 
  Terminal,
  RotateCcw
} from 'lucide-react';

interface AIAssistantModalProps {
  initialContext?: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Why does my player fall through the floor?',
  'How do I make a double jump mechanic?',
  'Explain 2D gravity using a simple analogy',
  'What is Delta Time and why do games need it?',
  'How do Axis-Aligned Bounding Box (AABB) collisions work?'
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  initialContext,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 **Hi there, creator! I'm Sparky, your GameDev AI Mentor.**\n\nWhether you're curious about gravity math, wondering why a character isn't jumping, or trying to invent a brand new power-up, ask me anything! I'll guide you step-by-step so you learn how games work under the hood.`
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const newMsgs: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMsgs);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: initialContext,
        })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.response || 'Keep experimenting and testing your levels!' }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: `💡 **Sparky's Quick Tip:** Games update in frames! Remember that variables store your numbers, and events listen for when things collide or keys get pressed. Check your logic rules in the inspector!`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Sparky • GameDev AI Mentor</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                  Gemini 3.8
                </span>
              </div>
              <div className="text-xs text-slate-400">Friendly concepts, hints, and error explanations</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 italic">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Sparky is brewing a beginner-friendly explanation...</span>
            </div>
          )}
        </div>

        {/* Quick Chips */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-950 hover:border-indigo-500/50 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            id="input-ai-prompt"
            type="text"
            value={inputPrompt}
            placeholder="Ask Sparky about physics, game math, bugs, or game mechanics..."
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />

          <button
            id="btn-send-ai-prompt"
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
