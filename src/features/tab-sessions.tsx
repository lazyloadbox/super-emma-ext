import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Archive, Trash2, Calendar, RotateCcw, X, Edit2, Check, Filter, ChevronDown, Download, Upload } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { storageUtil, STORAGE_KEYS } from '../lib/storage-util';

interface TabData {
  url: string;
  title: string;
  favIconUrl?: string;
  domain: string;
}

interface TabSession {
  id: string;
  name: string;
  createdAt: string;
  tabs: TabData[];
}

export function TabSessionsFeature() {
  const [sessions, setSessions] = useState<TabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'session' | 'tab';
    sessionId: string;
    tabIndex?: number;
    name: string;
  } | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadSessions();
    
    // Listen for storage changes to update sessions in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.TAB_SESSIONS]) {
        setSessions(changes[STORAGE_KEYS.TAB_SESSIONS].newValue || []);
      }
    };
    
    storageUtil.addChangeListener(STORAGE_KEYS.TAB_SESSIONS, handleStorageChange);
    
    return () => {
      storageUtil.removeChangeListener(STORAGE_KEYS.TAB_SESSIONS, handleStorageChange);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const sessions = await storageUtil.get<TabSession[]>(STORAGE_KEYS.TAB_SESSIONS) || [];
      setSessions(sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSession = (sessionId: string, sessionName: string) => {
    setDeleteTarget({ type: 'session', sessionId, name: sessionName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTab = (sessionId: string, tabIndex: number, tabTitle: string) => {
    setDeleteTarget({ type: 'tab', sessionId, tabIndex, name: tabTitle });
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'session') {
        const updatedSessions = sessions.filter(session => session.id !== deleteTarget.sessionId);
        await storageUtil.set(STORAGE_KEYS.TAB_SESSIONS, updatedSessions);
        setSessions(updatedSessions);
      } else if (deleteTarget.type === 'tab' && deleteTarget.tabIndex !== undefined) {
        const updatedSessions = sessions.map(session => {
          if (session.id === deleteTarget.sessionId) {
            const updatedTabs = session.tabs.filter((_, index) => index !== deleteTarget.tabIndex);
            return { ...session, tabs: updatedTabs };
          }
          return session;
        });
        await storageUtil.set(STORAGE_KEYS.TAB_SESSIONS, updatedSessions);
        setSessions(updatedSessions);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      await storageUtil.set(STORAGE_KEYS.TAB_SESSIONS, updatedSessions);
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const restoreTab = async (tab: TabData) => {
    try {
      await chrome.tabs.create({ url: tab.url, active: true });
    } catch (error) {
      console.error('Failed to restore tab:', error);
    }
  };

  const updateSessionName = async (sessionId: string, newName: string) => {
    try {
      const updatedSessions = sessions.map(session => 
        session.id === sessionId ? { ...session, name: newName } : session
      );
      
      await storageUtil.set(STORAGE_KEYS.TAB_SESSIONS, updatedSessions);
      setSessions(updatedSessions);
      setEditingSessionId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to update session name:', error);
    }
  };

  const startEditingName = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  };

  const cancelEditingName = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const restoreSession = async (session: TabSession) => {
    try {
      // Open all tabs from the session
      for (const tab of session.tabs) {
        await chrome.tabs.create({ url: tab.url, active: false });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const getFaviconUrl = (url: string, favIconUrl?: string) => {
    // If we have a favicon URL and it's valid, use it
    if (favIconUrl && favIconUrl.startsWith('http')) {
      return favIconUrl;
    }
    
    // Otherwise, try to get favicon from Google's favicon service
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      // If URL parsing fails, return a default icon
      return `https://www.google.com/s2/favicons?domain=example.com&sz=16`;
    }
  };

  const openUrl = (url: string) => {
    chrome.tabs.create({ url, active: true });
  };

  const exportSessions = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessions: sessions
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tab-sessions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Export Successful',
        description: `Successfully exported ${sessions.length} sessions to JSON file.`
      });
    } catch (error) {
      console.error('Failed to export sessions:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export sessions. Please try again.'
      });
    }
  };

  const importSessions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate the imported data structure
        if (!importData.sessions || !Array.isArray(importData.sessions)) {
          throw new Error('Invalid file format: missing sessions array');
        }

        // Validate each session has required fields
        for (const session of importData.sessions) {
          if (!session.id || !session.name || !session.createdAt || !Array.isArray(session.tabs)) {
            throw new Error('Invalid session format in imported file');
          }
        }

        // Deduplicate sessions and URLs
        const existingSessionNames = new Set(sessions.map(s => s.name.toLowerCase()));
        const existingUrls = new Set(sessions.flatMap(s => s.tabs.map(t => t.url)));
        
        const deduplicatedSessions = importData.sessions
          .filter((session: TabSession) => {
            // Filter out sessions with duplicate names
            const sessionNameLower = session.name.toLowerCase();
            const importedNameLower = `${session.name} (imported)`.toLowerCase();
            return !existingSessionNames.has(sessionNameLower) && !existingSessionNames.has(importedNameLower);
          })
          .map((session: TabSession) => ({
            ...session,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${session.name} (Imported)`,
            tabs: session.tabs.filter((tab: TabData) => !existingUrls.has(tab.url))
          }))
          .filter((session: TabSession) => session.tabs.length > 0); // Remove sessions with no tabs after deduplication

        if (deduplicatedSessions.length === 0) {
          addToast({
            type: 'info',
            title: 'No New Sessions',
            description: 'All sessions and URLs in the import file already exist.'
          });
          return;
        }

        // Merge with existing sessions
        const updatedSessions = [...sessions, ...deduplicatedSessions];
        
        await storageUtil.set(STORAGE_KEYS.TAB_SESSIONS, updatedSessions);
        setSessions(updatedSessions);
        
        addToast({
          type: 'success',
          title: 'Import Successful',
          description: `Successfully imported ${deduplicatedSessions.length} sessions!`
        });
      } catch (error) {
        console.error('Failed to import sessions:', error);
        addToast({
          type: 'error',
          title: 'Import Failed',
          description: 'Failed to import sessions. Please check the file format and try again.'
        });
      }
    };
    
    input.click();
  };

  // Filter sessions and tabs based on domain
  const filteredSessions = sessions
    .map(session => ({
      ...session,
      tabs: filterDomain 
        ? session.tabs.filter(tab => tab.domain.toLowerCase().includes(filterDomain.toLowerCase()))
        : session.tabs
    }))
    .filter(session => {
      // If no filter is applied, show all sessions
      if (!filterDomain) return true;
      // If filter is applied, only show sessions that have matching tabs
      return session.tabs.length > 0;
    });

  // Get unique domains for filter suggestions
  const allDomains = Array.from(new Set(
    sessions.flatMap(session => session.tabs.map(tab => tab.domain))
  )).sort();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading sessions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Saved Tab Sessions
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={importSessions}
                className="flex items-center gap-2"
                title="Import sessions from JSON file"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportSessions}
                disabled={sessions.length === 0}
                className="flex items-center gap-2"
                title="Export sessions to JSON file"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Domain Filter */}
          {sessions.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 relative">
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background appearance-none pr-8"
                >
                  <option value="">All domains</option>
                  {allDomains.map((domain, index) => (
                    <option key={`${domain}-${index}`} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {filterDomain && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilterDomain('')}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved tab sessions yet.</p>
              <p className="text-sm">Use the "Save All Tabs" button in the popup to create your first session.</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions match the current filter.</p>
              <p className="text-sm">Try adjusting your domain filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-input rounded bg-background font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSessionName(session.id, editingName);
                              } else if (e.key === 'Escape') {
                                cancelEditingName();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSessionName(session.id, editingName)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingName}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{session.name}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingName(session.id, session.name)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(session.createdAt).toLocaleString()}
                        <span className="ml-2">• {session.tabs.length} tabs</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreSession(session)}
                        className="h-8 w-8 p-0"
                        title="Restore all tabs"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmDeleteSession(session.id, session.name)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete session"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {session.tabs.map((tab: TabData, index: number) => (
                        <div key={`${session.id}-${index}-${tab.url}`} className="flex items-center gap-3 text-sm p-3 bg-muted rounded hover:bg-muted/80 transition-colors">
                          <img 
                            src={getFaviconUrl(tab.url, tab.favIconUrl)} 
                            alt="" 
                            className="w-4 h-4 flex-shrink-0"
                            onError={(e) => {
                              // Fallback to a generic icon if favicon fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = `https://www.google.com/s2/favicons?domain=example.com&sz=16`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium" title={tab.title}>
                              {tab.title}
                            </div>
                            <button
                              onClick={() => openUrl(tab.url)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[180px] overflow-hidden whitespace-nowrap text-ellipsis"
                              title={tab.url}
                            >
                              {tab.url}
                            </button>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreTab(tab)}
                              className="h-7 w-7 p-0"
                              title="Restore this tab"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmDeleteTab(session.id, index, tab.title)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              title="Delete this tab"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {deleteDialogOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/20" onClick={() => setDeleteDialogOpen(false)} />
          <div className="relative z-50 w-full max-w-lg mx-4 bg-background border rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Are you sure you want to delete {deleteTarget.type === 'session' ? 'the session' : 'this tab'}{' '}
                  <span className="font-medium">"{deleteTarget.name}"</span>?
                  {deleteTarget.type === 'session' && ' This will delete all tabs in the session.'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={executeDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 