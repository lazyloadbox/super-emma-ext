import React, { useState } from 'react';
import { Button } from './button';
import { X } from 'lucide-react';

interface SaveChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chatName: string) => void;
  defaultName?: string;
}

export const SaveChatDialog: React.FC<SaveChatDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = ''
}) => {
  const [chatName, setChatName] = useState(defaultName);

  const handleSave = () => {
    if (chatName.trim()) {
      onSave(chatName.trim());
      setChatName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setChatName('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Save Chat Session
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chat Name
          </label>
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a name for this chat session..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!chatName.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}; 