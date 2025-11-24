/**
 * Graph Model
 * Represents the graph structure with nodes and connections
 */

export class Graph {
  constructor(data = null) {
    if (data) {
      this.title = data.title || 'Graph';
      this.nodes = Array.isArray(data.nodes) ? data.nodes.map(n => ({
        id: String(n.id),
        title: String(n.title || ''),
        body: String(n.body || ''),
        choices: Array.isArray(n.choices) ? n.choices.map(c => ({
          label: String(c.label || ''),
          to: String(c.to)
        })) : []
      })) : [];
    } else {
      this.title = 'Graph';
      this.nodes = [];
    }
  }

  /**
   * Convert graph to JSON
   * @returns {Object} Graph data as plain object
   */
  toJSON() {
    return {
      title: this.title,
      nodes: this.nodes.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        choices: n.choices.map(c => ({
          label: c.label,
          to: c.to
        }))
      }))
    };
  }

  /**
   * Create default seed graph
   * @returns {Graph} New graph with default nodes
   */
  static createSeed() {
    return new Graph({
      title: 'Diagnosis: Application Not Working',
      nodes: [
        { id: '1', title: 'My application is not working', body: 'Starting point for debugging.', choices: [{ label: 'Check healthcheck', to: '2' }] },
        { id: '2', title: 'Check healthcheck', body: 'Call /health.', choices: [{ label: 'positive', to: '3' }, { label: 'negative', to: '4' }, { label: 'no response', to: '5' }] },
        { id: '3', title: 'Check database availability', body: 'Log into DB; check connection.', choices: [] },
        { id: '4', title: 'Fix negative healthcheck', body: 'Collect logs, check dependencies.', choices: [] },
        { id: '5', title: 'Fix non-working healthcheck', body: 'Network/Ingress/Firewall; after fixing return to the problem.', choices: [{ label: 'return to start', to: '1' }] }
      ]
    });
  }
}

