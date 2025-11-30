/**
 * Nodes Page View
 * Comprehensive Knowledge Graph Management interface
 * Provides central place for creating, organizing, and maintaining all nodes
 */

import { escapeHtml } from '../utils/HtmlUtils.js';
import { compareIds } from '../utils/IdUtils.js';
import { byId, getIncomingReferences, isReferenced } from '../utils/NodeUtils.js';

export class NodesPageView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.pendingFocusNodeId = null;
    this.filterQuery = ''; // Store current filter query
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for state changes
    this.events.on('graph:changed', () => this.render());
    // Don't re-render on state:updated - data is already updated in event handlers
    // Re-rendering causes focus loss and scroll-to-top while typing
    // this.events.on('state:updated', () => this.render());
    // Don't re-render on node:updated - data is already updated in event handlers
    // Re-rendering causes focus loss while typing
    // this.events.on('node:updated', () => this.render());
    this.events.on('choice:added', () => this.render());
    this.events.on('choice:removed', () => this.render());
    // Don't re-render on choice:updated - data is already updated in event handlers
    // Re-rendering causes focus loss while typing
    // this.events.on('choice:updated', () => this.render());
    // Listen for child creation to focus on new node
    this.events.on('node:child-created', ({ childId }) => {
      // Store the node ID to focus on after next render
      this.pendingFocusNodeId = childId;
      // Trigger render if nodes page is visible
      const container = this.dom.get('nodesPageContainer');
      if (container && !container.classList.contains('hidden')) {
        this.render();
      }
    });
    // Listen for regular node creation to focus on new node
    this.events.on('node:created', ({ nodeId }) => {
      // Store the node ID to focus on after next render
      this.pendingFocusNodeId = nodeId;
      // Trigger render if nodes page is visible
      const container = this.dom.get('nodesPageContainer');
      if (container && !container.classList.contains('hidden')) {
        this.render();
      }
    });
  }

  /**
   * Render the nodes page
   * @param {string} filterQuery - Optional filter query
   */
  render(filterQuery = null) {
    const container = this.dom.get('nodesPageContainer');
    if (!container) return;

    const graph = this.state.getGraph();
    if (!graph) return;

    // Update filter query if provided, otherwise use stored value
    if (filterQuery !== null) {
      this.filterQuery = filterQuery;
    }

    // Store pending focus node ID before render
    const nodeIdToFocus = this.pendingFocusNodeId;
    this.pendingFocusNodeId = null;

    // Preserve scroll position and active element to prevent scroll-to-top and focus loss
    const scrollContainer = container.querySelector('.nodes-page-list') || container;
    const scrollTop = scrollContainer.scrollTop;
    const activeElement = document.activeElement;
    let activeElementState = null;
    // Preserve search input state if user is typing
    let searchInputState = null;
    if (activeElement && activeElement.id === 'nodesPageSearch') {
      searchInputState = {
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd
      };
    }
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElementState = {
        nodeId: activeElement.dataset?.nodeId,
        choiceIndex: activeElement.dataset?.choiceIndex,
        className: activeElement.className,
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd
      };
    }

    const q = (this.filterQuery || '').toLowerCase();
    const allNodes = [...graph.nodes].sort((a, b) => compareIds(a.id, b.id));
    const nodes = allNodes.filter(n => {
      if (!q) return true;
      // Search in node ID, title, and body
      if (String(n.id).includes(q) || 
          (n.title && n.title.toLowerCase().includes(q)) || 
          (n.body && n.body.toLowerCase().includes(q))) {
        return true;
      }
      // Search in choices labels
      if (n.choices && Array.isArray(n.choices)) {
        return n.choices.some(choice => 
          choice.label && choice.label.toLowerCase().includes(q)
        );
      }
      return false;
    });

    const nodeIds = new Set(graph.nodes.map(n => String(n.id)));

    // Build HTML
    let html = `
      <div class="nodes-page-header">
        <h2>Knowledge Graph Management</h2>
        <div class="nodes-page-actions">
          <button id="btnNodesPageNewNode" class="primary">New Node</button>
        </div>
      </div>
      <div class="nodes-page-search-container">
        <input type="text" id="nodesPageSearch" 
               placeholder="Search nodes (id/title/content/choices)..." 
               value="${escapeHtml(this.filterQuery)}"
               style="flex: 1; width: 100%;" />
        <button id="btnNodesPageClearFilters" 
                class="ghost" 
                title="Clear filters"
                ${this.filterQuery ? '' : 'style="display: none;"'}>Clear Filters</button>
      </div>
      <div class="nodes-page-stats">
        <span class="stat-item">Total Nodes: <strong>${allNodes.length}</strong></span>
        ${q ? `<span class="stat-item">Filtered: <strong>${nodes.length}</strong></span>` : ''}
      </div>
      <div class="nodes-page-list" id="nodesPageList">
    `;

    for (const node of nodes) {
      const incomingRefs = getIncomingReferences(node.id, graph.nodes);
      const hasIncoming = incomingRefs.length > 0;
      const isOrphan = !isReferenced(node.id, graph.nodes) && node.choices.length === 0;
      
      // Validation checks
      const missingTitle = !node.title || !node.title.trim();
      const missingDescription = !node.body || !node.body.trim();
      const invalidChoices = node.choices.filter(c => {
        const targetId = String(c.to || '').trim();
        return !targetId || !nodeIds.has(targetId);
      });

      html += `
        <div class="node-card" data-node-id="${escapeHtml(String(node.id))}">
          <div class="node-card-header">
            <div class="node-id-section">
              <span class="node-id-badge">#${escapeHtml(String(node.id))}</span>
              ${isOrphan ? '<span class="badge warn" title="Node not referenced by any other node">Orphan</span>' : ''}
              ${missingTitle ? '<span class="badge danger" title="Missing title">No Title</span>' : ''}
              ${missingDescription ? '<span class="badge danger" title="Missing description">No Description</span>' : ''}
              ${invalidChoices.length > 0 ? `<span class="badge warn" title="Invalid choice targets">${invalidChoices.length} Invalid Choice${invalidChoices.length > 1 ? 's' : ''}</span>` : ''}
            </div>
            <div class="node-card-actions">
              <button class="btn-node-edit" data-action="edit" data-node-id="${escapeHtml(String(node.id))}" title="Edit">✏️</button>
              <button class="btn-node-clone" data-action="clone" data-node-id="${escapeHtml(String(node.id))}" title="Clone">📋</button>
              <button class="btn-node-delete" data-action="delete" data-node-id="${escapeHtml(String(node.id))}" title="Delete">🗑️</button>
            </div>
          </div>
          
          <div class="node-card-content">
            <div class="node-field">
              <label>Title</label>
              <input type="text" class="node-title-input" data-node-id="${escapeHtml(String(node.id))}" 
                     value="${escapeHtml(node.title || '')}" placeholder="Node title" />
            </div>
            
            <div class="node-field">
              <label>Description</label>
              <textarea class="node-description-input" data-node-id="${escapeHtml(String(node.id))}" 
                        rows="3" placeholder="Node description">${escapeHtml(node.body || '')}</textarea>
            </div>
            
            <div class="node-field">
              <div class="node-field-header">
                <label>Choices (${node.choices.length})</label>
                <div class="node-field-actions">
                  <button class="btn-add-child" data-node-id="${escapeHtml(String(node.id))}" title="Add Child Node">+ Add Child</button>
                  <button class="btn-add-choice" data-node-id="${escapeHtml(String(node.id))}">+ Add Choice</button>
                </div>
              </div>
              <div class="choices-list" data-node-id="${escapeHtml(String(node.id))}">
      `;

      node.choices.forEach((choice, idx) => {
        const isValid = nodeIds.has(String(choice.to || ''));
        html += `
          <div class="choice-item ${!isValid ? 'invalid' : ''}" data-choice-index="${idx}">
            <input type="text" class="choice-label-input" 
                   data-node-id="${escapeHtml(String(node.id))}" 
                   data-choice-index="${idx}"
                   value="${escapeHtml(choice.label || '')}" 
                   placeholder="Choice label" />
            <input type="text" class="choice-target-input" 
                   data-node-id="${escapeHtml(String(node.id))}" 
                   data-choice-index="${idx}"
                   value="${escapeHtml(String(choice.to || ''))}" 
                   placeholder="Target node ID" 
                   list="nodeIdsList" />
            ${!isValid ? '<span class="choice-error" title="Target node does not exist">⚠️</span>' : ''}
            <button class="btn-remove-choice" 
                    data-node-id="${escapeHtml(String(node.id))}" 
                    data-choice-index="${idx}" 
                    title="Remove choice">×</button>
          </div>
        `;
      });

      html += `
              </div>
            </div>
            
            ${hasIncoming ? `
            <div class="node-field">
              <label>Incoming References (${incomingRefs.length})</label>
              <div class="incoming-refs">
      ` : ''}
      
      ${incomingRefs.map(ref => `
                <div class="incoming-ref-item">
                  <span class="ref-node-id">#${escapeHtml(String(ref.node.id))}</span>
                  <span class="ref-choice-label">"${escapeHtml(ref.choice.label || '')}"</span>
                  <span class="ref-node-title">${escapeHtml(ref.node.title || '')}</span>
                </div>
      `).join('')}
      
      ${hasIncoming ? `
              </div>
            </div>
      ` : ''}
          </div>
        </div>
      `;
    }

    html += `
      </div>
      <datalist id="nodeIdsList">
        ${graph.nodes.map(n => `<option value="${escapeHtml(String(n.id))}">${escapeHtml(n.title || '')}</option>`).join('')}
      </datalist>
    `;

    container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();

    // Restore search input focus and cursor position if user was typing
    if (searchInputState) {
      setTimeout(() => {
        const searchInput = container.querySelector('#nodesPageSearch');
        if (searchInput) {
          searchInput.focus();
          if (searchInput.setSelectionRange && searchInputState.selectionStart !== null) {
            try {
              searchInput.setSelectionRange(searchInputState.selectionStart, searchInputState.selectionEnd);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }, 0);
    }

    // Restore scroll position
    const newScrollContainer = container.querySelector('.nodes-page-list') || container;
    if (newScrollContainer && scrollTop !== undefined) {
      newScrollContainer.scrollTop = scrollTop;
    }

    // Restore focus and cursor position if user was typing
    if (activeElementState && !nodeIdToFocus) {
      setTimeout(() => {
        let elementToFocus = null;
        if (activeElementState.className.includes('node-title-input')) {
          elementToFocus = container.querySelector(`.node-title-input[data-node-id="${activeElementState.nodeId}"]`);
        } else if (activeElementState.className.includes('node-description-input')) {
          elementToFocus = container.querySelector(`.node-description-input[data-node-id="${activeElementState.nodeId}"]`);
        } else if (activeElementState.className.includes('choice-label-input')) {
          elementToFocus = container.querySelector(`.choice-label-input[data-node-id="${activeElementState.nodeId}"][data-choice-index="${activeElementState.choiceIndex}"]`);
        } else if (activeElementState.className.includes('choice-target-input')) {
          elementToFocus = container.querySelector(`.choice-target-input[data-node-id="${activeElementState.nodeId}"][data-choice-index="${activeElementState.choiceIndex}"]`);
        }
        
        if (elementToFocus) {
          elementToFocus.focus();
          if (elementToFocus.setSelectionRange && activeElementState.selectionStart !== null) {
            try {
              elementToFocus.setSelectionRange(activeElementState.selectionStart, activeElementState.selectionEnd);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }, 0);
    }

    // Focus on pending node after render completes
    if (nodeIdToFocus) {
      setTimeout(() => {
        this.focusOnNode(nodeIdToFocus);
      }, 50);
    }
  }

  /**
   * Function to auto-resize input/textarea to fit content
   */
  autoResize(element, minHeight = 40) {
    // Only resize if element has expanded class (is focused)
    if (!element.classList.contains('expanded')) {
      // Reset to default height when not expanded
      element.style.height = '';
      return;
    }

    if (element.tagName === 'TEXTAREA') {
      // For textarea, use scrollHeight to measure content
      element.style.height = 'auto';
      const newHeight = Math.max(minHeight, element.scrollHeight);
      element.style.height = newHeight + 'px';
    } else if (element.tagName === 'INPUT') {
      // For input fields, measure text height using a temporary element
      const temp = document.createElement('div');
      const styles = window.getComputedStyle(element);
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      temp.style.whiteSpace = 'pre-wrap';
      temp.style.wordWrap = 'break-word';
      temp.style.overflowWrap = 'break-word';
      temp.style.width = (element.offsetWidth || 200) + 'px';
      temp.style.font = styles.font;
      temp.style.fontSize = styles.fontSize;
      temp.style.fontFamily = styles.fontFamily;
      temp.style.fontWeight = styles.fontWeight;
      temp.style.lineHeight = styles.lineHeight;
      temp.style.padding = styles.padding;
      temp.style.border = styles.border;
      temp.style.boxSizing = styles.boxSizing;
      temp.style.margin = styles.margin;
      temp.textContent = element.value || element.placeholder || 'M';
      document.body.appendChild(temp);
      const newHeight = Math.max(minHeight, temp.offsetHeight);
      document.body.removeChild(temp);
      element.style.height = newHeight + 'px';
    }
  }

  /**
   * Attach event listeners to dynamically created elements
   */
  attachEventListeners() {
    const container = this.dom.get('nodesPageContainer');
    if (!container) return;

    // New node button
    const btnNewNode = container.querySelector('#btnNodesPageNewNode');
    if (btnNewNode) {
      btnNewNode.onclick = () => {
        this.events.emit('node:create-requested');
      };
    }

    // Search input
    const searchInput = container.querySelector('#nodesPageSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterQuery = searchInput.value;
        // Update clear button visibility
        const clearBtn = container.querySelector('#btnNodesPageClearFilters');
        if (clearBtn) {
          clearBtn.style.display = this.filterQuery ? '' : 'none';
        }
        // Re-render with new filter
        this.render();
      });
    }

    // Clear filters button
    const clearFiltersBtn = container.querySelector('#btnNodesPageClearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.onclick = () => {
        this.filterQuery = '';
        this.render();
      };
    }

    // Node title inputs
    container.querySelectorAll('.node-title-input').forEach(input => {
      // Expand input on focus and auto-resize to content
      input.onfocus = () => {
        input.classList.add('expanded');
        setTimeout(() => this.autoResize(input, 40), 0);
      };
      input.onblur = () => {
        input.classList.remove('expanded');
        input.style.height = ''; // Reset to default height
      };
      
      input.oninput = () => {
        this.autoResize(input, 40);
        const nodeId = input.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          node.title = input.value;
          this.events.emit('node:updated', node);
        }
      };
    });

    // Node description inputs
    container.querySelectorAll('.node-description-input').forEach(textarea => {
      // Expand textarea on focus and auto-resize to content
      textarea.onfocus = () => {
        textarea.classList.add('expanded');
        setTimeout(() => this.autoResize(textarea, 60), 0);
      };
      textarea.onblur = () => {
        textarea.classList.remove('expanded');
        textarea.style.height = ''; // Reset to default height
      };
      
      textarea.oninput = () => {
        this.autoResize(textarea, 60);
        const nodeId = textarea.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          node.body = textarea.value;
          this.events.emit('node:updated', node);
        }
      };
    });

    // Choice label inputs
    container.querySelectorAll('.choice-label-input').forEach(input => {
      // Expand choice label input on focus and auto-resize to content
      input.onfocus = () => {
        input.classList.add('expanded');
        setTimeout(() => this.autoResize(input, 40), 0);
      };
      input.onblur = () => {
        input.classList.remove('expanded');
        input.style.height = ''; // Reset to default height
      };
      
      input.oninput = () => {
        this.autoResize(input, 40);
        const nodeId = input.dataset.nodeId;
        const choiceIndex = parseInt(input.dataset.choiceIndex);
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node && node.choices[choiceIndex]) {
          node.choices[choiceIndex].label = input.value;
          this.events.emit('node:updated', node);
          this.events.emit('choice:updated', { node, choice: node.choices[choiceIndex] });
        }
      };
    });

    // Choice target inputs
    container.querySelectorAll('.choice-target-input').forEach(input => {
      // Expand choice target input on focus and auto-resize to content
      input.onfocus = () => {
        input.classList.add('expanded');
        setTimeout(() => this.autoResize(input, 40), 0);
      };
      input.onblur = () => {
        input.classList.remove('expanded');
        input.style.height = ''; // Reset to default height
      };
      
      input.oninput = () => {
        this.autoResize(input, 40);
        const nodeId = input.dataset.nodeId;
        const choiceIndex = parseInt(input.dataset.choiceIndex);
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node && node.choices[choiceIndex]) {
          node.choices[choiceIndex].to = String(input.value);
          this.events.emit('node:updated', node);
          this.events.emit('choice:updated', { node, choice: node.choices[choiceIndex] });
        }
      };
    });

    // Add choice buttons
    container.querySelectorAll('.btn-add-choice').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          const firstNodeId = graph.nodes[0]?.id ?? '1';
          node.choices.push({ label: '', to: String(firstNodeId) });
          this.events.emit('node:updated', node);
          this.events.emit('choice:added', { node });
        }
      };
    });

    // Remove choice buttons
    container.querySelectorAll('.btn-remove-choice').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const choiceIndex = parseInt(btn.dataset.choiceIndex);
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node && node.choices[choiceIndex]) {
          node.choices.splice(choiceIndex, 1);
          this.events.emit('node:updated', node);
          this.events.emit('choice:removed', { node, index: choiceIndex });
        }
      };
    });

    // Clone buttons
    container.querySelectorAll('.btn-node-clone').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          this.events.emit('node:clone-requested', node);
        }
      };
    });

    // Delete buttons
    container.querySelectorAll('.btn-node-delete').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          if (!confirm(`Delete node #${node.id}? This will remove all references to this node.`)) return;
          this.events.emit('node:delete-requested', node);
        }
      };
    });

    // Add child node buttons (quick-add)
    container.querySelectorAll('.btn-add-child').forEach(btn => {
      btn.onclick = () => {
        const nodeId = btn.dataset.nodeId;
        const graph = this.state.getGraph();
        const node = byId(nodeId, graph.nodes);
        if (node) {
          this.events.emit('node:add-child-requested', node);
        }
      };
    });
  }

  /**
   * Focus on a specific node by ID
   * Scrolls to the node card and focuses on the title input
   * @param {string|number} nodeId - Node ID to focus on
   */
  focusOnNode(nodeId) {
    const container = this.dom.get('nodesPageContainer');
    if (!container) return;

    const nodeCard = container.querySelector(`[data-node-id="${String(nodeId)}"]`);
    if (!nodeCard) return;

    // Scroll the node card into view
    nodeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus on the title input after a small delay to ensure smooth scroll completes
    setTimeout(() => {
      const titleInput = nodeCard.querySelector('.node-title-input');
      if (titleInput) {
        titleInput.focus();
        // Select all text so user can immediately type to replace
        titleInput.select();
      }
    }, 300);
  }
}

