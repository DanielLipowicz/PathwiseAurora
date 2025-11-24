/**
 * Navigation Controller
 * Handles navigation and URL management
 */

import { byId } from '../utils/NodeUtils.js';
import { createHistoryEntry } from '../utils/NodeUtils.js';

export class NavigationController {
  constructor(stateManager, eventBus, urlService, storageService) {
    this.state = stateManager;
    this.events = eventBus;
    this.url = urlService;
    this.storage = storageService;
    this.setupEventListeners();
    this.setupBrowserHistory();
  }

  setupEventListeners() {
    this.events.on('navigation:start-requested', (nodeId) => {
      this.startAt(nodeId);
    });

    this.events.on('navigation:advance-requested', (toId) => {
      this.advance(toId);
    });

    this.events.on('navigation:back-requested', () => {
      this.back();
    });

    this.events.on('navigation:reset-requested', () => {
      this.resetSession();
    });

    this.events.on('history:entry-selected', (entryId) => {
      this.navigateToHistoryEntry(entryId);
    });

    this.events.on('history:delete-requested', ({ index, entryId }) => {
      this.deleteHistoryEntry(index, entryId);
    });
  }

  setupBrowserHistory() {
    window.addEventListener('popstate', (event) => {
      const nodeId = event.state?.nodeId || this.url.getNodeIdFromUrl();
      if (nodeId) {
        const id = String(nodeId);
        const graph = this.state.getGraph();
        const session = this.state.getSession();
        if (!graph || !session) return;

        const node = byId(id, graph.nodes);
        if (node) {
          // History only expands - if node is not in history, add it
          const historyEntry = createHistoryEntry(node);
          const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
          if (!lastEntry || String(lastEntry.id) !== String(id)) {
            // Add new entry only if it's a different node than the last one
            session.history.push(historyEntry);
          }
          session.currentNodeId = id;
          this.storage.save(graph.toJSON(), session.toJSON());
          this.state.setSession(session);
        }
      } else {
        // Don't reset history, just set currentNodeId to null
        const session = this.state.getSession();
        if (session) {
          session.currentNodeId = null;
          this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
          this.state.setSession(session);
        }
      }
    });
  }

  /**
   * Start navigation at a specific node
   * @param {string|number} id - Node ID to start at
   */
  startAt(id) {
    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    const node = byId(id, graph.nodes);
    if (!node) return;

    session.currentNodeId = id;

    // History only expands - add new entry if node is not the last in history
    const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
    if (!lastEntry || String(lastEntry.id) !== String(id)) {
      // Add new entry only if it's a different node than the last one
      session.history.push(createHistoryEntry(node));
    }

    this.storage.save(graph.toJSON(), session.toJSON());
    this.url.updateUrl(id);
    this.state.setSession(session);
  }

  /**
   * Advance to a node
   * @param {string|number} toId - Target node ID
   */
  advance(toId) {
    if (!toId || !String(toId).trim()) {
      // Empty reference - cannot navigate
      return;
    }

    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    const node = byId(toId, graph.nodes);
    if (!node) {
      // Target doesn't exist - still allow navigation attempt but show warning
      // Create a placeholder history entry
      session.currentNodeId = String(toId);
      session.history.push({
        id: String(toId),
        title: `#${toId} (missing)`,
        body: 'Target node does not exist',
        comment: ''
      });
      this.storage.save(graph.toJSON(), session.toJSON());
      this.url.updateUrl(String(toId));
      this.state.setSession(session);
      return;
    }

    session.currentNodeId = toId;
    session.history.push(createHistoryEntry(node));
    this.storage.save(graph.toJSON(), session.toJSON());
    this.url.updateUrl(toId);
    this.state.setSession(session);
  }

  /**
   * Navigate back in history
   */
  back() {
    const session = this.state.getSession();
    if (!session || session.history.length <= 1) return;

    // History doesn't shorten - just change currentNodeId to previous entry
    const currentIdx = session.history.length - 1;
    if (currentIdx > 0) {
      const prevEntry = session.history[currentIdx - 1];
      session.currentNodeId = prevEntry ? prevEntry.id : null;
      this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
      this.url.updateUrl(session.currentNodeId);
      this.state.setSession(session);
    }
  }

  /**
   * Reset session
   */
  resetSession() {
    const session = this.state.getSession();
    if (!session) return;

    session.currentNodeId = null;
    session.history = [];
    this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
    this.url.updateUrl(null, true);
    this.state.setSession(session);
  }

  /**
   * Navigate to a history entry
   * @param {string|number} entryId - History entry ID
   */
  navigateToHistoryEntry(entryId) {
    const session = this.state.getSession();
    if (!session) return;

    const idx = session.history.findIndex(h => {
      const hId = h.id || h;
      return String(hId) === String(entryId);
    });

    if (idx >= 0) {
      session.currentNodeId = entryId;
      this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
      // Update URL - use pushState to add to browser history
      this.url.updateUrl(entryId);
      this.state.setSession(session);
    }
  }

  /**
   * Delete a history entry
   * @param {number} index - History entry index
   * @param {string|number} entryId - History entry ID
   */
  deleteHistoryEntry(index, entryId) {
    const session = this.state.getSession();
    if (!session) return;

    const wasCurrent = String(entryId) === String(session.currentNodeId);
    session.history.splice(index, 1);

    // If deleted entry was current, update currentNodeId
    if (wasCurrent) {
      if (session.history.length > 0) {
        // Set to previous entry (or last if deleted was last)
        const newIdx = Math.min(index - 1, session.history.length - 1);
        if (newIdx >= 0 && newIdx < session.history.length) {
          session.currentNodeId = session.history[newIdx].id;
        } else if (session.history.length > 0) {
          session.currentNodeId = session.history[session.history.length - 1].id;
        } else {
          session.currentNodeId = null;
        }
      } else {
        session.currentNodeId = null;
      }
    }

    this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
    this.url.updateUrl(session.currentNodeId);
    this.state.setSession(session);
  }
}

