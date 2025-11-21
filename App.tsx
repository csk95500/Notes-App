import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { useNotesStore } from './hooks/useNotesStore';
import { ReminderModal } from './components/ReminderModal';
import { AIModal } from './components/AIModal';
import { MarkdownEditor } from './components/MarkdownEditor';
import { Note, RepeatFrequency, AIAction, Reminder } from './types';
import { 
  Search, 
  Menu, 
  Bell, 
  Calendar, 
  Sparkles, 
  Pin, 
  PinOff, 
  Trash2, 
  Clock, 
  MoreVertical,
  X,
  FileText,
  Download
} from 'lucide-react';
import { generateAIContent } from './services/geminiService';

const App: React.FC = () => {
  const {
    notes,
    folders,
    reminders,
    selectedNoteId,
    selectedFolderId,
    searchQuery,
    setSearchQuery,
    setSelectedNoteId,
    setSelectedFolderId,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    deleteFolder,
    addReminder,
    deleteReminder,
    updateReminder,
    filteredNotes
  } = useNotesStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showRemindersPanel, setShowRemindersPanel] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mindnote_theme') === 'dark' ||
        (!('mindnote_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mindnote_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mindnote_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Current Note state
  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Reminder Check Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach(reminder => {
        if (reminder.isActive && reminder.triggerTime <= now) {
          // Trigger Reminder
          new Notification('MindNote Reminder', {
            body: reminder.message,
            icon: '/favicon.ico'
          });
          
          alert(`Reminder: ${reminder.message}`);

          // Handle Repeat
          if (reminder.frequency !== RepeatFrequency.NONE) {
            let nextTime = reminder.triggerTime;
            const day = 24 * 60 * 60 * 1000;
            if (reminder.frequency === RepeatFrequency.DAILY) nextTime += day;
            if (reminder.frequency === RepeatFrequency.WEEKLY) nextTime += day * 7;
            if (reminder.frequency === RepeatFrequency.MONTHLY) nextTime += day * 30;
            
            updateReminder(reminder.id, { triggerTime: nextTime });
          } else {
            // Disable non-repeating
            updateReminder(reminder.id, { isActive: false });
          }
        }
      });
    }, 30000); // Check every 30s

    // Request Notification Permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [reminders, updateReminder]);

  // Handlers
  const handleSaveReminder = (date: string, time: string, frequency: RepeatFrequency) => {
    if (!activeNote) return;
    const triggerTime = new Date(`${date}T${time}`).getTime();
    addReminder(activeNote.id, triggerTime, frequency, activeNote.title || 'Untitled Note');
  };

  const handleAIExecute = async (action: AIAction, prompt?: string) => {
    if (!activeNote) return;
    setIsAIProcessing(true);
    const result = await generateAIContent(action, activeNote.content, prompt);
    
    if (action === AIAction.SUMMARIZE || action === AIAction.ACTION_ITEMS || action === AIAction.GENERATE_IDEAS) {
        // Append to note for these actions
        const newContent = activeNote.content + `\n\n---\n**AI ${action}:**\n${result}\n---`;
        updateNote(activeNote.id, { content: newContent });
    } else if (action === AIAction.CONTINUE) {
        const newContent = activeNote.content + " " + result;
        updateNote(activeNote.id, { content: newContent });
    } else if (action === AIAction.FIX_GRAMMAR) {
        const newContent = `Original:\n${activeNote.content}\n\n---\n**Fixed Version:**\n${result}`;
        updateNote(activeNote.id, { content: newContent });
    }

    setIsAIProcessing(false);
    setIsAIModalOpen(false);
  };

  const handleExport = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title || 'Untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Reminder Modal */}
      <ReminderModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSave={handleSaveReminder}
      />

      {/* AI Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onExecute={handleAIExecute}
        isLoading={isAIProcessing}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col h-full
      `}>
        <Sidebar 
          folders={folders}
          notes={notes}
          selectedFolderId={selectedFolderId}
          selectedNoteId={selectedNoteId}
          onSelectFolder={setSelectedFolderId}
          onSelectNote={setSelectedNoteId}
          onAddFolder={addFolder}
          onDeleteFolder={deleteFolder}
          onAddNote={addNote}
          isDarkMode={darkMode}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Note List (Middle Column) */}
        <div className="flex h-full">
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 hidden md:flex">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No notes found.
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`
                      p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group
                      ${selectedNoteId === note.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold text-sm truncate pr-2 ${selectedNoteId === note.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {note.title || 'Untitled Note'}
                      </h3>
                      {note.isPinned && <Pin className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-8 mb-2">
                      {note.content || 'No additional text'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Editor (Right Column) */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 h-full w-full min-w-0">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>
              <span className="font-semibold text-slate-800 dark:text-slate-200">MindNote</span>
              <div className="w-6"></div> {/* Spacer */}
            </div>

            {activeNote ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hidden sm:flex">
                    <span>{folders.find(f => f.id === activeNote.folderId)?.name || 'All Notes'}</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">Last edited {new Date(activeNote.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <button 
                      onClick={() => updateNote(activeNote.id, { isPinned: !activeNote.isPinned })}
                      className={`p-2 rounded-lg transition-colors ${activeNote.isPinned ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      title="Pin Note"
                    >
                      {activeNote.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    
                    <button 
                      onClick={() => setIsReminderModalOpen(true)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-colors relative"
                      title="Set Reminder"
                    >
                      <Bell className="w-4 h-4" />
                      {reminders.some(r => r.noteId === activeNote.id && r.isActive) && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                      )}
                    </button>

                    <button 
                      onClick={handleExport}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-colors"
                      title="Export as Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setIsAIModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ask AI</span>
                    </button>
                  </div>
                </div>

                {/* Title Input */}
                <div className="px-6 pt-6 pb-2">
                   <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    placeholder="Untitled Note"
                    className="w-full text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 border-none outline-none bg-transparent"
                  />
                </div>
                
                {/* Markdown Editor */}
                <div className="flex-1 overflow-hidden">
                   <MarkdownEditor 
                      value={activeNote.content} 
                      onChange={(val) => updateNote(activeNote.id, { content: val })}
                   />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                   <FileText className="w-10 h-10 text-slate-200 dark:text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-400 dark:text-slate-500">Select a note or create a new one</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Reminder Panel Toggle (Bottom Right) */}
        <div className="absolute bottom-6 right-6">
             <button 
                onClick={() => setShowRemindersPanel(!showRemindersPanel)}
                className="bg-slate-900 dark:bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:scale-105 transition-transform relative"
             >
                <Calendar className="w-5 h-5" />
                {reminders.filter(r => r.isActive).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-indigo-600">
                        {reminders.filter(r => r.isActive).length}
                    </span>
                )}
             </button>
        </div>

        {/* Reminders Slide-over Panel */}
        {showRemindersPanel && (
            <div className="absolute bottom-20 right-6 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-5 z-40">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Active Reminders
                    </h3>
                    <button onClick={() => setShowRemindersPanel(false)}>
                        <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                    {reminders.filter(r => r.isActive).length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-slate-500 text-xs py-4">No active reminders</p>
                    ) : (
                        reminders.filter(r => r.isActive).map(r => (
                            <div key={r.id} className="p-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg group relative">
                                <div className="pr-6">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.message}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {new Date(r.triggerTime).toLocaleString()} 
                                        {r.frequency !== RepeatFrequency.NONE && <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">{r.frequency}</span>}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteReminder(r.id)}
                                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;