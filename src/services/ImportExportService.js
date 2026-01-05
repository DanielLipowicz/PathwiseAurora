/**
 * Import/Export Service
 * Handles JSON import/export functionality
 */

import { StorageService } from './StorageService.js';
import { migrateHistory } from '../utils/NodeUtils.js';
import { generateEmailSummary } from '../utils/EmailSummaryGenerator.js';
import { generateConfluenceExport } from '../utils/ConfluenceExportGenerator.js';
import { nextId } from '../utils/IdUtils.js';

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
   * Show Confluence export modal
   * @param {Object} graph - Graph object
   * @param {Object} domRegistry - DOM registry for accessing modal elements
   */
  showConfluenceExport(graph, domRegistry) {
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      alert('No graph available to export.');
      return;
    }

    const modal = domRegistry.get('confluenceExportModal');
    const textarea = domRegistry.get('confluenceExportText');
    const copyBtn = domRegistry.get('btnCopyConfluenceExport');
    const closeBtn = domRegistry.get('btnCloseConfluenceExport');

    if (!modal || !textarea || !copyBtn || !closeBtn) {
      alert('Confluence export UI elements not found.');
      return;
    }

    // Generate Confluence export
    try {
      const exportContent = generateConfluenceExport(graph);
      textarea.value = exportContent;
    } catch (error) {
      alert('Error generating Confluence export: ' + error.message);
      return;
    }

    // Show modal
    modal.classList.remove('hidden');

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
              tags: Array.isArray(entry.tags) ? entry.tags : [],
              selectedChoice: entry.selectedChoice || null
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

  /**
   * Extend existing process by importing and merging nodes from a file
   * Validates the file against schema, reassigns IDs to avoid conflicts,
   * and translates all relations to maintain flow integrity
   * @param {File} file - File to import
   * @param {Object} existingGraph - Current graph object
   * @param {Object} validationService - Validation service instance
   * @param {Function} onSuccess - Callback with merged graph
   * @param {Function} onError - Error callback
   */
  extendExistingProcess(file, existingGraph, validationService, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        // Handle new format with history (graph + session) or old format (graph only)
        let graphData;

        if (data.graph && Array.isArray(data.graph.nodes)) {
          // New format: { graph: {...}, session: {...} }
          graphData = data.graph;
        } else if (Array.isArray(data.nodes)) {
          // Old format: graph only
          graphData = data;
        } else {
          throw new Error('Invalid format: file must contain a graph with nodes');
        }

        if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
          throw new Error('Invalid format: file must contain at least one node');
        }

        // Validate imported graph structure
        const importedGraph = {
          title: String(graphData.title || 'Imported Graph'),
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

        // Validate using ValidationService
        if (validationService) {
          const validationResult = validationService.validate(importedGraph);
          if (!validationResult.ok) {
            throw new Error('Validation failed: ' + validationResult.messages.join(', '));
          }
        }

        // Get existing nodes
        const existingNodes = existingGraph.nodes || [];
        const existingIds = new Set(existingNodes.map(n => String(n.id)));

        // Find next available root ID for imported nodes
        const startRootId = nextId(existingNodes);
        const startRootNum = parseInt(startRootId, 10);

        // Create ID mapping: oldId -> newId
        const idMapping = new Map();
        let currentRootNum = startRootNum;

        // First pass: map root-level nodes
        const rootNodes = importedGraph.nodes.filter(n => !String(n.id).includes('.'));
        for (const node of rootNodes) {
          const newId = String(currentRootNum);
          idMapping.set(String(node.id), newId);
          currentRootNum++;
        }

        // Second pass: map nested nodes, preserving hierarchy
        // Process nodes level by level (depth 1, then 2, then 3, etc.)
        const nodesByDepth = new Map();
        for (const node of importedGraph.nodes) {
          const oldId = String(node.id);
          if (idMapping.has(oldId)) continue; // Already mapped (root node)
          
          const depth = oldId.split('.').length;
          if (!nodesByDepth.has(depth)) {
            nodesByDepth.set(depth, []);
          }
          nodesByDepth.get(depth).push(node);
        }

        // Process each depth level
        const depths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
        for (const depth of depths) {
          const nodesAtDepth = nodesByDepth.get(depth);
          
          // Sort nodes at this depth by their ID parts
          nodesAtDepth.sort((a, b) => {
            const aParts = String(a.id).split('.').map(Number);
            const bParts = String(b.id).split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              const aVal = aParts[i] || 0;
              const bVal = bParts[i] || 0;
              if (aVal !== bVal) return aVal - bVal;
            }
            return 0;
          });

          // Map each node at this depth
          for (const node of nodesAtDepth) {
            const oldId = String(node.id);
            const parts = oldId.split('.');
            
            // Get parent ID (all parts except the last)
            const parentOldId = parts.slice(0, -1).join('.');
            const parentNewId = idMapping.get(parentOldId);
            
            if (!parentNewId) {
              throw new Error(`Cannot find parent mapping for node ${oldId}. Parent ${parentOldId} not mapped.`);
            }

            // Generate new child ID preserving the child number
            const childNum = parseInt(parts[parts.length - 1], 10);
            const newId = `${parentNewId}.${childNum}`;
            idMapping.set(oldId, newId);
          }
        }

        // Create new nodes with reassigned IDs and translated relations
        const newNodes = importedGraph.nodes.map(node => {
          const oldId = String(node.id);
          const newId = idMapping.get(oldId);

          if (!newId) {
            throw new Error(`Failed to map ID: ${oldId}`);
          }

          return {
            id: newId,
            title: node.title,
            body: node.body,
            choices: node.choices.map(choice => ({
              label: choice.label,
              to: idMapping.get(String(choice.to)) || String(choice.to) // Map target ID
            }))
          };
        });

        // Merge with existing nodes
        const mergedNodes = [...existingNodes, ...newNodes];

        // Create merged graph
        const mergedGraph = {
          title: existingGraph.title || 'Graph',
          nodes: mergedNodes
        };

        if (onSuccess) {
          onSuccess(mergedGraph);
        }
      } catch (e) {
        if (onError) {
          onError(e);
        } else {
          alert('Extend process error: ' + e.message);
        }
      }
    };
    reader.readAsText(file);
  }
}

