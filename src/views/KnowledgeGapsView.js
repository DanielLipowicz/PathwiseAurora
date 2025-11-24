/**
 * Knowledge Gaps Page View
 * Quality Assurance & Content Review
 * Identifies incomplete or inconsistent parts of the decision graph
 */

import { escapeHtml } from '../utils/HtmlUtils.js';
import { byId, isReferenced } from '../utils/NodeUtils.js';

export class KnowledgeGapsView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for graph changes to refresh the gaps analysis
    this.events.on('graph:changed', () => this.render());
    this.events.on('node:updated', () => this.render());
    this.events.on('choice:added', () => this.render());
    this.events.on('choice:removed', () => this.render());
    this.events.on('choice:updated', () => this.render());
  }

  /**
   * Analyze the graph for knowledge gaps
   * @returns {Object} Analysis results with categorized issues
   */
  analyzeGaps() {
    const graph = this.state.getGraph();
    if (!graph || !graph.nodes) {
      return {
        brokenConnections: [],
        deadEnds: [],
        emptyTitles: [],
        emptyDescriptions: [],
        emptyChoiceLabels: [],
        summary: {
          brokenLinks: 0,
          deadEnds: 0,
          emptyTitles: 0,
          emptyDescriptions: 0,
          emptyChoiceLabels: 0
        }
      };
    }

    const nodeIds = new Set(graph.nodes.map(n => String(n.id)));
    const brokenConnections = [];
    const deadEnds = [];
    const emptyTitles = [];
    const emptyDescriptions = [];
    const emptyChoiceLabels = [];

    // Analyze each node
    for (const node of graph.nodes) {
      const nodeId = String(node.id);
      
      // Check for empty title
      if (!node.title || !node.title.trim()) {
        emptyTitles.push({ nodeId, node });
      }

      // Check for empty description
      if (!node.body || !node.body.trim()) {
        emptyDescriptions.push({ nodeId, node });
      }

      // Check for broken connections (choices pointing to non-existing nodes)
      for (let i = 0; i < node.choices.length; i++) {
        const choice = node.choices[i];
        const targetId = String(choice.to || '').trim();
        
        // Check for empty choice label
        if (!choice.label || !choice.label.trim()) {
          emptyChoiceLabels.push({ nodeId, choiceIndex: i, choice, node });
        }

        // Check for broken connection (empty target or non-existing node)
        if (!targetId || !nodeIds.has(targetId)) {
          brokenConnections.push({
            nodeId,
            choiceIndex: i,
            choice,
            node,
            targetId: targetId || '(empty)'
          });
        }
      }

      // Check for dead ends (nodes with no choices and not referenced)
      // Note: We consider a node a dead end if it has no choices AND is not referenced
      // unless it's intentionally marked as final (we'll check if it's referenced)
      if (node.choices.length === 0) {
        const isReferencedByOthers = isReferenced(nodeId, graph.nodes);
        if (!isReferencedByOthers) {
          // Check if this is a root node (no parent ID structure)
          const isRootNode = !nodeId.includes('.');
          // Root nodes without choices might be intentional starting points
          // but if they're not referenced, they're still dead ends
          deadEnds.push({ nodeId, node, isRootNode });
        }
      }
    }

    return {
      brokenConnections,
      deadEnds,
      emptyTitles,
      emptyDescriptions,
      emptyChoiceLabels,
      summary: {
        brokenLinks: brokenConnections.length,
        deadEnds: deadEnds.length,
        emptyTitles: emptyTitles.length,
        emptyDescriptions: emptyDescriptions.length,
        emptyChoiceLabels: emptyChoiceLabels.length
      }
    };
  }

  /**
   * Render the knowledge gaps page
   */
  render() {
    const container = this.dom.get('knowledgeGapsContainer');
    if (!container) {
      console.warn('KnowledgeGapsView: Container not found');
      return;
    }

    const analysis = this.analyzeGaps();
    const totalIssues = Object.values(analysis.summary).reduce((sum, count) => sum + count, 0);

    // Build HTML
    let html = `
      <div class="knowledge-gaps-header">
        <h2>Knowledge Gaps – Quality Assurance</h2>
        <div class="knowledge-gaps-summary">
          ${totalIssues === 0 
            ? '<span class="badge ok">All Clear – No Issues Found</span>'
            : `<span class="badge danger">${totalIssues} Total Issue${totalIssues !== 1 ? 's' : ''}</span>`
          }
        </div>
      </div>

      <div class="knowledge-gaps-stats">
        <div class="stat-card ${analysis.summary.brokenLinks > 0 ? 'has-issues' : ''}">
          <div class="stat-label">Broken Links</div>
          <div class="stat-value ${analysis.summary.brokenLinks > 0 ? 'danger' : 'ok'}">${analysis.summary.brokenLinks}</div>
          <div class="stat-severity">High</div>
        </div>
        <div class="stat-card ${analysis.summary.deadEnds > 0 ? 'has-issues' : ''}">
          <div class="stat-label">Dead Ends</div>
          <div class="stat-value ${analysis.summary.deadEnds > 0 ? 'warn' : 'ok'}">${analysis.summary.deadEnds}</div>
          <div class="stat-severity">High</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyTitles > 0 ? 'has-issues' : ''}">
          <div class="stat-label">Empty Titles</div>
          <div class="stat-value ${analysis.summary.emptyTitles > 0 ? 'warn' : 'ok'}">${analysis.summary.emptyTitles}</div>
          <div class="stat-severity">Medium</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyDescriptions > 0 ? 'has-issues' : ''}">
          <div class="stat-label">Empty Descriptions</div>
          <div class="stat-value ${analysis.summary.emptyDescriptions > 0 ? 'warn' : 'ok'}">${analysis.summary.emptyDescriptions}</div>
          <div class="stat-severity">Medium</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyChoiceLabels > 0 ? 'has-issues' : ''}">
          <div class="stat-label">Empty Choice Labels</div>
          <div class="stat-value ${analysis.summary.emptyChoiceLabels > 0 ? 'warn' : 'ok'}">${analysis.summary.emptyChoiceLabels}</div>
          <div class="stat-severity">Medium</div>
        </div>
      </div>
    `;

    // Broken Connections Section
    if (analysis.brokenConnections.length > 0) {
      html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge danger">${analysis.brokenConnections.length}</span>
            Broken Connections
            <span class="gaps-section-subtitle">Choices pointing to non-existing nodes</span>
          </h3>
          <div class="gaps-list">
      `;

      for (const issue of analysis.brokenConnections) {
        html += `
          <div class="gap-item" data-node-id="${escapeHtml(issue.nodeId)}" data-choice-index="${issue.choiceIndex}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml(issue.nodeId)}</span>
                <span class="badge danger">Broken Link</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Choice Label:</strong> 
                  <span class="${!issue.choice.label || !issue.choice.label.trim() ? 'text-muted' : ''}">
                    ${escapeHtml(issue.choice.label || '(empty)')}
                  </span>
                </div>
                <div class="gap-detail">
                  <strong>Target Node:</strong> 
                  <span class="text-danger">#${escapeHtml(issue.targetId)} (does not exist)</span>
                </div>
                ${issue.node.title ? `<div class="gap-detail"><strong>Node Title:</strong> ${escapeHtml(issue.node.title)}</div>` : ''}
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml(issue.nodeId)}" data-choice-index="${issue.choiceIndex}" title="Jump to node">Go to Node</button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Dead Ends Section
    if (analysis.deadEnds.length > 0) {
      html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.deadEnds.length}</span>
            Dead Ends
            <span class="gaps-section-subtitle">Nodes that do not lead anywhere and are not referenced</span>
          </h3>
          <div class="gaps-list">
      `;

      for (const issue of analysis.deadEnds) {
        html += `
          <div class="gap-item" data-node-id="${escapeHtml(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml(issue.nodeId)}</span>
                <span class="badge warn">Dead End</span>
                ${issue.isRootNode ? '<span class="badge" title="Root level node">Root</span>' : ''}
              </div>
              <div class="gap-item-details">
                ${issue.node.title ? `<div class="gap-detail"><strong>Title:</strong> ${escapeHtml(issue.node.title)}</div>` : '<div class="gap-detail"><strong>Title:</strong> <span class="text-muted">(empty)</span></div>'}
                <div class="gap-detail">
                  <strong>Choices:</strong> 
                  <span class="text-muted">0 (no outgoing connections)</span>
                </div>
                <div class="gap-detail">
                  <strong>Incoming References:</strong> 
                  <span class="text-muted">None</span>
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Empty Titles Section
    if (analysis.emptyTitles.length > 0) {
      html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyTitles.length}</span>
            Empty Titles
          </h3>
          <div class="gaps-list">
      `;

      for (const issue of analysis.emptyTitles) {
        html += `
          <div class="gap-item" data-node-id="${escapeHtml(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml(issue.nodeId)}</span>
                <span class="badge warn">Missing Title</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Description:</strong> 
                  ${issue.node.body && issue.node.body.trim() 
                    ? `<span>${escapeHtml(issue.node.body.substring(0, 100))}${issue.node.body.length > 100 ? '...' : ''}</span>`
                    : '<span class="text-muted">(empty)</span>'
                  }
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Empty Descriptions Section
    if (analysis.emptyDescriptions.length > 0) {
      html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyDescriptions.length}</span>
            Empty Descriptions
          </h3>
          <div class="gaps-list">
      `;

      for (const issue of analysis.emptyDescriptions) {
        html += `
          <div class="gap-item" data-node-id="${escapeHtml(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml(issue.nodeId)}</span>
                <span class="badge warn">Missing Description</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Title:</strong> 
                  ${issue.node.title && issue.node.title.trim() 
                    ? `<span>${escapeHtml(issue.node.title)}</span>`
                    : '<span class="text-muted">(empty)</span>'
                  }
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Empty Choice Labels Section
    if (analysis.emptyChoiceLabels.length > 0) {
      html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyChoiceLabels.length}</span>
            Empty Choice Labels
          </h3>
          <div class="gaps-list">
      `;

      for (const issue of analysis.emptyChoiceLabels) {
        html += `
          <div class="gap-item" data-node-id="${escapeHtml(issue.nodeId)}" data-choice-index="${issue.choiceIndex}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml(issue.nodeId)}</span>
                <span class="badge warn">Empty Label</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Choice Target:</strong> 
                  <span>#${escapeHtml(String(issue.choice.to || ''))}</span>
                </div>
                ${issue.node.title ? `<div class="gap-detail"><strong>Node Title:</strong> ${escapeHtml(issue.node.title)}</div>` : ''}
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml(issue.nodeId)}" data-choice-index="${issue.choiceIndex}" title="Jump to node">Go to Node</button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // No issues message
    if (totalIssues === 0) {
      html += `
        <div class="gaps-empty-state">
          <div class="empty-state-icon">✓</div>
          <h3>No Knowledge Gaps Found</h3>
          <p>Your decision graph is complete and consistent. All nodes have titles and descriptions, all choices have labels, and all connections are valid.</p>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to dynamically created elements
   */
  attachEventListeners() {
    const container = this.dom.get('knowledgeGapsContainer');
    if (!container) return;

    // Go to node buttons
    container.querySelectorAll('.btn-goto-node').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const choiceIndex = btn.dataset.choiceIndex;
        
        // Emit event to navigate to nodes page and focus on the specific node
        this.events.emit('gaps:goto-node', { nodeId, choiceIndex });
      };
    });
  }
}

