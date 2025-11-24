/**
 * Import/Export Service
 * Handles JSON import/export functionality
 */

import { StorageService } from './StorageService.js';
import { migrateHistory } from '../utils/NodeUtils.js';

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

