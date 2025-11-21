import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bold, Italic, List, ListOrdered, Code, Quote, 
  Eye, EyeOff, Heading1, Heading2, Type, Link as LinkIcon,
  Mic, MicOff, Terminal, CheckSquare, Search, X, ArrowRight, RefreshCw,
  Undo, Redo
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface ToolbarBtnProps {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ onClick, icon: Icon, title, active, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
      active 
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
        : disabled
          ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
          : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400'
    } ${className || ''}`}
    title={title}
    aria-label={title}
  >
    <Icon className="w-4 h-4" />
  </button>
);

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  
  // Find & Replace State
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // History State
  // We use refs for the logic to avoid stale closures in timeouts, but state to trigger re-renders for buttons
  const historyRef = useRef<string[]>([value || '']);
  const historyPointerRef = useRef(0);
  const historyTimeoutRef = useRef<any>(null);
  // This state is purely to force re-renders when history changes so buttons update
  const [, setHistoryTick] = useState(0);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const text = value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    setStats({ words, chars });
  }, [value]);

  // Keyboard Shortcut for Find
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Find: Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (!isPreview) {
            e.preventDefault();
            setShowFindReplace(true);
            setTimeout(() => findInputRef.current?.focus(), 100);
        }
      }
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
         e.preventDefault();
         handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)) {
         e.preventDefault();
         handleRedo();
      }
      // Escape
      if (e.key === 'Escape' && showFindReplace) {
          setShowFindReplace(false);
          textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreview, showFindReplace]); // Dependencies required for closure access

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          insertTextAtCursor(finalTranscript + ' ');
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
          if (isRecording) {
             // Optional: restart if it stops unexpectedly but user wanted it on
             // recognitionRef.current.start();
          }
      };
    }
  }, [isRecording]);

  // --- History Logic ---

  const addToHistory = (newValue: string) => {
    // If we are not at the end of history (did undo), remove future history
    const currentHistory = historyRef.current.slice(0, historyPointerRef.current + 1);
    
    // Avoid duplicates
    if (currentHistory[currentHistory.length - 1] !== newValue) {
        currentHistory.push(newValue);
        historyRef.current = currentHistory;
        historyPointerRef.current = currentHistory.length - 1;
        setHistoryTick(t => t + 1);
    }
  };

  const handleValueChange = (newValue: string, immediate = false) => {
    onChange(newValue); // Always update parent immediately

    if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
    }

    if (immediate) {
        addToHistory(newValue);
    } else {
        // Debounce history update for typing
        historyTimeoutRef.current = setTimeout(() => {
            addToHistory(newValue);
        }, 1000);
    }
  };

  const handleUndo = () => {
    // Capture current unsaved changes before undoing if they exist
    const currentVal = value || '';
    const lastSavedVal = historyRef.current[historyPointerRef.current];
    
    if (currentVal !== lastSavedVal) {
        addToHistory(currentVal);
    }

    if (historyPointerRef.current > 0) {
        historyPointerRef.current -= 1;
        const prevValue = historyRef.current[historyPointerRef.current];
        onChange(prevValue);
        setHistoryTick(t => t + 1);
    }
  };

  const handleRedo = () => {
    if (historyPointerRef.current < historyRef.current.length - 1) {
        historyPointerRef.current += 1;
        const nextValue = historyRef.current[historyPointerRef.current];
        onChange(nextValue);
        setHistoryTick(t => t + 1);
    }
  };

  // --- Editor Logic ---

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    const currentVal = value || '';

    if (!textarea) {
        handleValueChange(currentVal + textToInsert, false);
        return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const newText = `${before}${textToInsert}${after}`;
    handleValueChange(newText, false); // Speech treated as typing (debounced)
    
    setTimeout(() => {
      if(document.activeElement === textarea) {
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }
    }, 0);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    handleValueChange(newText, true); // Immediate history
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const url = window.prompt('Enter the URL:', 'https://');
    
    if (url === null) return;

    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const linkText = selection || 'link';
    const formattedLink = `[${linkText}](${url})`;
    const newText = `${before}${formattedLink}${after}`;
    
    handleValueChange(newText, true); // Immediate history

    setTimeout(() => {
      textarea.focus();
      if (!selection) {
        textarea.setSelectionRange(start + 1, start + 1 + linkText.length);
      } else {
        textarea.setSelectionRange(start + formattedLink.length, start + formattedLink.length);
      }
    }, 0);
  };

  // Find and Replace Functions
  const findNext = () => {
    const textarea = textareaRef.current;
    if (!textarea || !findText) return;

    const content = textarea.value;
    let searchStartIndex = textarea.selectionEnd;
    
    let index = content.indexOf(findText, searchStartIndex);
    
    if (index === -1) {
        // Wrap around
        index = content.indexOf(findText, 0);
    }

    if (index !== -1) {
        textarea.focus();
        textarea.setSelectionRange(index, index + findText.length);
        // Scroll to selection (basic implementation)
        const fullText = textarea.value;
        const lines = fullText.substr(0, index).split("\n").length;
        const lineHeight = 24; // Approximation
        textarea.scrollTop = (lines - 1) * lineHeight; 
    }
  };

  const replace = () => {
    const textarea = textareaRef.current;
    if (!textarea || !findText) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = textarea.value;
    const selectedText = content.substring(start, end);

    // Only replace if current selection matches findText
    if (selectedText === findText) {
        const newContent = content.substring(0, start) + replaceText + content.substring(end);
        handleValueChange(newContent, true);
    } else {
        findNext();
    }
  };

  const replaceAll = () => {
      if (!findText) return;
      // Escape special regex characters in findText
      const escapedFindText = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedFindText, 'g');
      const newContent = value.replace(regex, replaceText);
      handleValueChange(newContent, true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-0 px-6 pt-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <ToolbarBtn 
            onClick={handleUndo} 
            icon={Undo} 
            title="Undo (Ctrl+Z)" 
            disabled={historyPointerRef.current <= 0} 
          />
          <ToolbarBtn 
            onClick={handleRedo} 
            icon={Redo} 
            title="Redo (Ctrl+Y)" 
            disabled={historyPointerRef.current >= historyRef.current.length - 1} 
          />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2 flex-shrink-0" />

          <ToolbarBtn onClick={() => insertFormat('**', '**')} icon={Bold} title="Bold Text" />
          <ToolbarBtn onClick={() => insertFormat('*', '*')} icon={Italic} title="Italic Text" />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2 flex-shrink-0" />
          
          <ToolbarBtn onClick={() => insertFormat('# ')} icon={Heading1} title="Heading 1" />
          <ToolbarBtn onClick={() => insertFormat('## ')} icon={Heading2} title="Heading 2" />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2 flex-shrink-0" />
          
          <ToolbarBtn onClick={() => insertFormat('- ')} icon={List} title="Bulleted List" />
          <ToolbarBtn onClick={() => insertFormat('1. ')} icon={ListOrdered} title="Numbered List" />
          <ToolbarBtn onClick={() => insertFormat('- [ ] ')} icon={CheckSquare} title="Task List" />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2 flex-shrink-0" />
          
          <ToolbarBtn onClick={() => insertFormat('> ')} icon={Quote} title="Blockquote" />
          <ToolbarBtn onClick={insertLink} icon={LinkIcon} title="Insert Link" />
          <ToolbarBtn onClick={() => insertFormat('`', '`')} icon={Code} title="Inline Code" />
          <ToolbarBtn onClick={() => insertFormat('```\n', '\n```')} icon={Terminal} title="Code Block" />
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2 flex-shrink-0" />
          
          <ToolbarBtn 
             onClick={() => {
               setShowFindReplace(!showFindReplace);
               if (!showFindReplace) setTimeout(() => findInputRef.current?.focus(), 100);
             }} 
             icon={Search} 
             title="Find and Replace (Ctrl+F)"
             active={showFindReplace} 
          />

          <ToolbarBtn 
            onClick={toggleRecording} 
            icon={isRecording ? MicOff : Mic}
            title={isRecording ? "Stop Recording" : "Start Dictation"}
            className={isRecording ? 'bg-red-50 text-red-600 animate-pulse ring-1 ring-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:ring-red-900 dark:text-red-400' : ''}
            active={isRecording}
          />
        </div>

        <button 
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? "Switch to Edit Mode" : "Switch to Preview Mode"}
          aria-label={isPreview ? "Switch to Edit Mode" : "Switch to Preview Mode"}
          className={`flex-shrink-0 ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isPreview 
              ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:ring-indigo-700' 
              : 'text-slate-500 hover:bg-slate-100 border border-slate-200 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}
        >
          {isPreview ? (
            <>
              <EyeOff className="w-4 h-4" /> Edit
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Preview
            </>
          )}
        </button>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && !isPreview && (
         <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2 z-10 shadow-sm">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input 
                    ref={findInputRef}
                    type="text" 
                    value={findText} 
                    onChange={(e) => setFindText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && findNext()}
                    placeholder="Find..."
                    className="text-sm outline-none w-32 sm:w-48 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 bg-transparent"
                />
            </div>
            <button onClick={findNext} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm text-slate-600 dark:text-slate-300" title="Find Next">
                <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input 
                    type="text" 
                    value={replaceText} 
                    onChange={(e) => setReplaceText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && replace()}
                    placeholder="Replace..."
                    className="text-sm outline-none w-32 sm:w-48 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 bg-transparent"
                />
            </div>
            <button onClick={replace} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                Replace
            </button>
            <button onClick={replaceAll} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                Replace All
            </button>

            <button onClick={() => setShowFindReplace(false)} className="ml-auto p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors">
                <X className="w-4 h-4" />
            </button>
         </div>
       )}

      {/* Editor / Preview Area */}
      <div className="flex-1 relative overflow-hidden px-6">
        {isPreview ? (
          <div className="h-full w-full overflow-y-auto prose prose-slate dark:prose-invert prose-indigo max-w-none py-4 pr-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*No content*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id="markdown-textarea"
            value={value}
            onChange={(e) => handleValueChange(e.target.value, false)}
            placeholder="Start typing your note or use the microphone to dictate..."
            className="w-full h-full resize-none text-lg text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 border-none outline-none bg-transparent leading-relaxed font-mono pt-4"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 font-medium transition-colors">
        <div className="flex items-center gap-4">
            {isRecording && (
                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 animate-pulse font-semibold">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
                    Recording...
                </span>
            )}
        </div>
        <div className="flex items-center gap-6 font-mono text-xs sm:text-sm">
          <span title="Word Count" className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-sans">Words</span>
            <strong className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 min-w-[2rem] text-center">
              {stats.words}
            </strong>
          </span>
          <span title="Character Count" className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-sans">Chars</span>
            <strong className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 min-w-[2rem] text-center">
              {stats.chars}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};