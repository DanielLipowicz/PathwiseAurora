/**
 * Session Model
 * Represents the current session state and history
 */

export class Session {
  constructor(data = null) {
    if (data) {
      this.currentNodeId = data.currentNodeId ?? null;
      this.history = Array.isArray(data.history) ? data.history : [];
    } else {
      this.currentNodeId = null;
      this.history = [];
    }
  }

  /**
   * Convert session to JSON
   * @returns {Object} Session data as plain object
   */
  toJSON() {
    return {
      currentNodeId: this.currentNodeId,
      history: this.history.map(entry => ({
        id: entry.id,
        title: entry.title || '',
        body: entry.body || '',
        comment: entry.comment || '',
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        selectedChoice: entry.selectedChoice || null
      }))
    };
  }

  /**
   * Create session from node
   * @param {Object} node - Starting node
   * @returns {Session} New session
   */
  static createFromNode(node) {
    if (!node) {
      return new Session();
    }
    return new Session({
      currentNodeId: node.id,
      history: [{ id: node.id, title: node.title, body: node.body, comment: '', tags: [] }]
    });
  }
}

