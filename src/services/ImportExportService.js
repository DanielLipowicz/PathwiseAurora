/**
 * Import/Export Service
 * Handles JSON import/export functionality
 */

import { StorageService } from './StorageService.js';
import { migrateHistory } from '../utils/NodeUtils.js';
import { generateEmailSummary } from '../utils/EmailSummaryGenerator.js';

export class ImportExportService {
  constructor(storageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * Download file with given filename and data
   * @param {string} filename - Filename for download
   * @param {string} data - Data to download
   */
  download(filename, data) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /**
   * Render graph and session as JSON
   * @param {Object} graph - Graph object
   * @param {Object} session - Session object
   * @param {boolean} includeHistory - Whether to include session in export
   * @returns {string} JSON string
   */
  renderJson(graph, session, includeHistory = false) {
    if (includeHistory) {
      return JSON.stringify({ graph, session }, null, 2);
    }
    return JSON.stringify(graph, null, 2);
  }

  /**
   * Export graph as JSON
   * @param {Object} graph - Graph object
   * @param {Object} session - Session object
   */
  exportJson(graph, session) {
    const filename = `${(graph.title || 'graph').replace(/\s+/g, '_')}.json`;
    this.download(filename, this.renderJson(graph, session, true));
  }

  /**
   * Export session flow as JSON
   * @param {Object} graph - Graph object
   * @param {Object} session - Session object
   */
  exportSession(graph, session) {
    if (!session || !session.history || session.history.length === 0) {
      alert('No session flow to save.');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `session_flow_${timestamp}.json`;
    const sessionData = {
      graph: graph,
      session: session,
      exportDate: new Date().toISOString(),
      exportType: 'session'
    };
    this.download(filename, JSON.stringify(sessionData, null, 2));
  }

  /**
   * Show email summary modal
   * @param {Object} graph - Graph object
   * @param {Object} session - Session object
   * @param {Object} domRegistry - DOM registry for accessing modal elements
   */
  showEmailSummary(graph, session, domRegistry) {
    if (!session || !session.history || session.history.length === 0) {
      alert('No session flow to generate email summary.');
      return;
    }

    const sessionData = {
      graph: graph,
      session: session,
      exportDate: new Date().toISOString(),
      exportType: 'session'
    };

    const modal = domRegistry.get('emailSummaryModal');
    const formatSelect = domRegistry.get('emailSummaryFormat');
    const textarea = domRegistry.get('emailSummaryText');
    const copyBtn = domRegistry.get('btnCopyEmailSummary');
    const closeBtn = domRegistry.get('btnCloseEmailSummary');

    if (!modal || !formatSelect || !textarea || !copyBtn || !closeBtn) {
      alert('Email summary UI elements not found.');
      return;
    }

    // Generate initial summary (text format)
    let currentFormat = 'text';
    try {
      const summary = generateEmailSummary(sessionData, currentFormat);
      textarea.value = summary;
    } catch (error) {
      alert('Error generating email summary: ' + error.message);
      return;
    }

    // Show modal
    modal.classList.remove('hidden');

    // Handle format change
    const updateSummary = () => {
      currentFormat = formatSelect.value;
      try {
        const summary = generateEmailSummary(sessionData, currentFormat);
        textarea.value = summary;
      } catch (error) {
        alert('Error generating email summary: ' + error.message);
      }
    };

    formatSelect.onchange = updateSummary;

    // Handle copy button
    copyBtn.onclick = () => {
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices
      try {
        document.execCommand('copy');
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = 'linear-gradient(180deg,#5bd18a,#3e9f67)';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '';
        }, 2000);
      } catch (err) {
        // Fallback for browsers that don't support execCommand
        navigator.clipboard.writeText(textarea.value).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.style.background = 'linear-gradient(180deg,#5bd18a,#3e9f67)';
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
          }, 2000);
        }).catch(() => {
          alert('Failed to copy. Please select and copy manually.');
        });
      }
    };

    // Handle close button
    const closeModal = () => {
      modal.classList.add('hidden');
      // Clean up event listeners
      formatSelect.onchange = null;
      copyBtn.onclick = null;
      closeBtn.onclick = null;
    };

    closeBtn.onclick = closeModal;

    // Close on background click
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Import JSON from file
   * @param {File} file - File to import
   * @param {Function} onSuccess - Callback with imported graph and session
   * @param {Function} onError - Error callback
   */
  importJson(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        // Handle new format with history (graph + session) or old format (graph only)
        let graphData, sessionData;

        if (data.graph && Array.isArray(data.graph.nodes)) {
          // New format: { graph: {...}, session: {...} }
          graphData = data.graph;
          sessionData = data.session;
        } else if (Array.isArray(data.nodes)) {
          // Old format: graph only
          graphData = data;
          sessionData = null;
        } else {
          throw new Error('Invalid format');
        }

        if (!graphData || !Array.isArray(graphData.nodes)) {
          throw new Error('Invalid format');
        }

        // Convert IDs to strings (handles both number and string)
        const graph = {
          title: String(graphData.title || 'Graph'),
          nodes: graphData.nodes.map(n => ({
            id: String(n.id),
            title: String(n.title || ''),
            body: String(n.body || ''),
            choices: Array.isArray(n.choices) ? n.choices.map(c => ({
              label: String(c.label || ''),
              to: String(c.to)
            })) : []
          }))
        };

        // Restore session if it was in export, otherwise set default
        let session;
        if (sessionData && Array.isArray(sessionData.history)) {
          // Migrate history if needed (handle old format in history)
          const firstItem = sessionData.history[0];
          if (typeof firstItem === 'string' || typeof firstItem === 'number') {
            // Old history format - use migration function
            sessionData.history = migrateHistory(sessionData.history, graph);
          }
          session = {
            currentNodeId: sessionData.currentNodeId ?? null,
            history: sessionData.history.map(entry => ({
              id: entry.id,
              title: entry.title || '',
              body: entry.body || '',
              comment: entry.comment || '',
              tags: Array.isArray(entry.tags) ? entry.tags : []
            }))
          };
        } else {
          // No session in export - set default
          const firstNode = graph.nodes[0];
          session = {
            currentNodeId: firstNode?.id ?? null,
            history: firstNode ? [{ id: firstNode.id, title: firstNode.title, body: firstNode.body, comment: '', tags: [] }] : []
          };
        }

        if (onSuccess) {
          onSuccess(graph, session);
        }
      } catch (e) {
        if (onError) {
          onError(e);
        } else {
          alert('Import error: ' + e.message);
        }
      }
    };
    reader.readAsText(file);
  }
}

