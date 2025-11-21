import React, { useState } from 'react';
import { RepeatFrequency } from '../types';
import { X, Clock, Calendar } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, time: string, frequency: RepeatFrequency) => void;
  initialDate?: string;
  initialTime?: string;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSave, initialDate, initialTime }) => {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime || '12:00');
  const [frequency, setFrequency] = useState<RepeatFrequency>(RepeatFrequency.NONE);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(date, time, frequency);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Set Reminder
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repeat</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(RepeatFrequency).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    frequency === freq
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm shadow-blue-200 dark:shadow-none"
          >
            Save Reminder
          </button>
        </div>
      </div>
    </div>
  );
};