/**
 * State Manager
 * Centralized state management with event notifications
 */

import { Graph } from './Graph.js';
import { Session } from './Session.js';

export class StateManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.graph = null;
    this.session = null;
  }

  /**
   * Set graph and notify listeners
   * @param {Graph} graph - Graph instance
   */
  setGraph(graph) {
    this.graph = graph;
    if (this.eventBus) {
      this.eventBus.emit('graph:changed', graph);
    }
  }

  /**
   * Set session and notify listeners
   * @param {Session} session - Session instance
   */
  setSession(session) {
    this.session = session;
    if (this.eventBus) {
      this.eventBus.emit('session:changed', session);
    }
  }

  /**
   * Get current graph
   * @returns {Graph|null} Current graph
   */
  getGraph() {
    return this.graph;
  }

  /**
   * Get current session
   * @returns {Session|null} Current session
   */
  getSession() {
    return this.session;
  }

  /**
   * Initialize state from saved data
   * @param {Object} data - Saved data with graph and session
   * @param {Function} migrateHistory - Function to migrate old history format
   */
  initialize(data, migrateHistory) {
    if (data && data.graph) {
      this.setGraph(new Graph(data.graph));
    }
    if (data && data.session) {
      // Migrate history if needed
      if (Array.isArray(data.session.history) && data.session.history.length > 0) {
        const firstItem = data.session.history[0];
        if (typeof firstItem === 'string' || typeof firstItem === 'number') {
          if (migrateHistory) {
            data.session.history = migrateHistory(data.session.history, data.graph);
          }
        }
      }
      this.setSession(new Session(data.session));
    }
  }

  /**
   * Notify that state has been updated
   */
  notifyUpdate() {
    if (this.eventBus) {
      this.eventBus.emit('state:updated', {
        graph: this.graph,
        session: this.session
      });
    }
  }
}

