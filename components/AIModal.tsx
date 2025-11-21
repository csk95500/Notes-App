import React, { useState } from 'react';
import { Sparkles, X, Loader2, ChevronRight } from 'lucide-react';
import { AIAction } from '../types';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (action: AIAction, prompt?: string) => Promise<void>;
  isLoading: boolean;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onExecute, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);

  if (!isOpen) return null;

  const actions = [
    { type: AIAction.SUMMARIZE, label: 'Summarize Note', desc: 'Create a concise summary of the current note.' },
    { type: AIAction.CONTINUE, label: 'Continue Writing', desc: 'Let AI write the next paragraph for you.' },
    { type: AIAction.FIX_GRAMMAR, label: 'Fix Grammar', desc: 'Correct spelling and grammar errors.' },
    { type: AIAction.ACTION_ITEMS, label: 'Find Action Items', desc: 'Extract tasks and to-dos from the text.' },
    { type: AIAction.GENERATE_IDEAS, label: 'Generate Ideas', desc: 'Brainstorm ideas related to this note.' },
  ];

  const handleActionClick = (action: AIAction) => {
    if (action === AIAction.GENERATE_IDEAS) {
      setSelectedAction(action);
    } else {
      onExecute(action);
    }
  };

  const handleCustomSubmit = () => {
    if (selectedAction && customPrompt) {
      onExecute(selectedAction, customPrompt);
      setCustomPrompt('');
      setSelectedAction(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Gemini AI Assistant
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-purple-100 text-sm">
            Enhance your writing and organization with Google's Gemini AI.
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">Thinking...</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Gemini is processing your request.</p>
            </div>
          ) : selectedAction === AIAction.GENERATE_IDEAS ? (
            <div className="space-y-4">
              <button 
                onClick={() => setSelectedAction(null)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 flex items-center gap-1"
              >
                &larr; Back to options
              </button>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">What kind of ideas do you need?</h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., Blog post topics about React, Marketing strategies for a coffee shop..."
                className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customPrompt.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Generate Ideas
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {actions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleActionClick(action.type)}
                  className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{action.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};