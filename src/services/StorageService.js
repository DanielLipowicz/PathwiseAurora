/**
 * Storage Service
 * Handles localStorage operations for graph and session data
 */

export class StorageService {
  constructor(storageKey = 'dd_graph_v1') {
    this.storageKey = storageKey;
  }

  /**
   * Save graph and session to localStorage
   * @param {Object} graph - Graph object
   * @param {Object} session - Session object
   */
  save(graph, session) {
    localStorage.setItem(this.storageKey, JSON.stringify({ graph, session }));
  }

  /**
   * Load graph and session from localStorage
   * @param {Function} migrateHistory - Function to migrate old history format
   * @returns {Object|null} Object with graph and session, or null if not found
   */
  load(migrateHistory) {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      // Migrate old history format if needed
      if (data.session && Array.isArray(data.session.history) && data.session.history.length > 0) {
        const firstItem = data.session.history[0];
        // Check if it's old format (string/number) or new format (object)
        if (typeof firstItem === 'string' || typeof firstItem === 'number') {
          if (migrateHistory) {
            data.session.history = migrateHistory(data.session.history, data.graph);
          }
        }
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Save sidebar width preference
   * @param {number} width - Width in pixels
   */
  saveSidebarWidth(width) {
    localStorage.setItem('sidebarWidth', width);
  }

  /**
   * Load sidebar width preference
   * @returns {string|null} Saved width or null
   */
  loadSidebarWidth() {
    return localStorage.getItem('sidebarWidth');
  }
}

