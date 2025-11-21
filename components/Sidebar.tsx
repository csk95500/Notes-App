import React, { useState } from 'react';
import { Folder as FolderIcon, Layers, Plus, Trash2, ChevronRight, Hash, LayoutGrid, Sun, Moon } from 'lucide-react';
import { Folder, Note } from '../types';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectNote: (id: string) => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onAddNote: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
  onSelectFolder,
  onSelectNote,
  onAddFolder,
  onDeleteFolder,
  onAddNote,
  isDarkMode,
  onToggleTheme
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  // Group notes by folder for display count
  const getNoteCount = (folderId: string | null) => {
    return notes.filter(n => n.folderId === folderId).length;
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none transition-colors duration-200">
      {/* App Header */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <h1 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-indigo-600 dark:text-indigo-500" />
          MindNote AI
        </h1>
      </div>

      {/* Action Button */}
      <div className="p-4">
        <button
          onClick={() => onAddNote()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        
        {/* Main Links */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFolderId === null
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4" />
              All Notes
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
              {notes.length}
            </span>
          </button>
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Folders</span>
            <button 
              onClick={() => setIsCreatingFolder(true)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => onSelectFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {folder.icon ? (
                        <span className="w-4 h-4 flex items-center justify-center text-base leading-none">{folder.icon}</span>
                    ) : (
                        <FolderIcon className={`w-4 h-4 ${selectedFolderId === folder.id ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''}`} />
                    )}
                    <span className="truncate max-w-[120px]">{folder.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:hidden">
                    {getNoteCount(folder.id)}
                  </span>
                </button>
                <button
                   onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                   className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="px-3 py-1">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                  placeholder="Folder Name"
                  className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
         <button
           onClick={onToggleTheme}
           className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mb-2"
         >
           <span className="flex items-center gap-2">
             {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             {isDarkMode ? 'Dark Mode' : 'Light Mode'}
           </span>
         </button>
         <div className="text-xs text-slate-300 dark:text-slate-600 text-center">
            MindNote v1.1
         </div>
      </div>
    </div>
  );
};