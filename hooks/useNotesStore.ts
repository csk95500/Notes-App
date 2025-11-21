import { useState, useEffect, useCallback } from 'react';
import { Note, Folder, Reminder, RepeatFrequency } from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'ideas', name: 'Ideas', icon: '💡' },
];

export const useNotesStore = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('mindnote_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('mindnote_folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('mindnote_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means 'All Notes'

  // Persistence
  useEffect(() => {
    localStorage.setItem('mindnote_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('mindnote_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('mindnote_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Note Actions
  const addNote = (folderId: string | null = null) => {
    // Ensure folderId is a string or null.
    // This prevents React Event objects from being passed in if onClick={addNote} is used directly.
    const safeFolderId = (typeof folderId === 'string') ? folderId : null;

    const newNote: Note = {
      id: generateId(),
      folderId: safeFolderId || selectedFolderId,
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      tags: []
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setReminders(prev => prev.filter(r => r.noteId !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  // Folder Actions
  const addFolder = (name: string) => {
    const newFolder: Folder = { id: generateId(), name };
    setFolders([...folders, newFolder]);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Move notes to 'Uncategorized' (null folder)
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
  };

  // Reminder Actions
  const addReminder = (noteId: string, triggerTime: number, frequency: RepeatFrequency, message: string) => {
    const newReminder: Reminder = {
      id: generateId(),
      noteId,
      triggerTime,
      frequency,
      isActive: true,
      message
    };
    setReminders([...reminders, newReminder]);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Computed
  const filteredNotes = notes
    .filter(n => {
      const matchesFolder = selectedFolderId ? n.folderId === selectedFolderId : true;
      const matchesSearch = searchQuery 
        ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesFolder && matchesSearch;
    })
    .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
    });

  return {
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
  };
};