/**
 * Node List View
 * Renders the list view of nodes
 */

import { escapeHtml } from '../utils/HtmlUtils.js';
import { compareIds } from '../utils/IdUtils.js';
import { byId, getParentId, getChildren, getSiblings, getNextSibling, getPrevSibling, getIncomingReferences } from '../utils/NodeUtils.js';

export class NodeListView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.pendingFocusNodeId = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for state changes
    this.events.on('graph:changed', () => this.render());
    this.events.on('session:changed', () => this.render());
    // Don't re-render on state:updated - data is already updated in event handlers
    // Re-rendering causes focus loss and scroll-to-top while typing
    // this.events.on('state:updated', () => this.render());
    // Re-render when choices are added/removed (structural changes)
    this.events.on('choice:added', () => this.render());
    this.events.on('choice:removed', () => this.render());
    // Re-render when nodes are created, deleted, cloned, or children added (structural changes)
    this.events.on('node:created', () => this.render());
    // Listen for child creation to focus on new node
    this.events.on('node:child-created', ({ childId }) => {
      // Store the node ID to focus on after navigation completes
      // Navigation will trigger session:changed, which will render
      // Then we focus on the new node after a delay to ensure everything is ready
      this.pendingFocusNodeId = childId;
      setTimeout(() => {
        // Trigger a render if needed, focus will happen in render
        if (this.pendingFocusNodeId === childId) {
          this.render();
        }
      }, 200);
    });
    // Note: node:delete-requested, node:clone-requested, node:add-child-requested
    // are handled by NodeController which emits graph:changed, so we don't need separate listeners
  }

  /**
   * Render the node list
   * @param {string} filterQuery - Optional filter query
   */
  render(filterQuery = '') {
    const nodeList = this.dom.get('nodeList');
    const nodeItemTpl = this.dom.get('nodeItemTpl');
    const choiceRowTpl = this.dom.get('choiceRowTpl');
    const filter = this.dom.get('filter');

    if (!nodeList || !nodeItemTpl || !choiceRowTpl) return;

    // Store pending focus node ID before render
    const nodeIdToFocus = this.pendingFocusNodeId;
    this.pendingFocusNodeId = null;

    // Preserve scroll position and active element to prevent scroll-to-top and focus loss
    const scrollTop = nodeList.scrollTop;
    const activeElement = document.activeElement;
    let activeElementState = null;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      // Try to identify the element by finding its parent node-item
      const nodeItem = activeElement.closest('.node-item');
      if (nodeItem) {
        const nidEl = nodeItem.querySelector('.nid');
        const nodeId = nidEl ? nidEl.textContent : null;
        activeElementState = {
          nodeId: nodeId,
          className: activeElement.className,
          selectionStart: activeElement.selectionStart,
          selectionEnd: activeElement.selectionEnd,
          isTitle: activeElement.classList.contains('ntitle'),
          isBody: activeElement.classList.contains('nbody'),
          isChoiceLabel: activeElement.classList.contains('clabel'),
          isChoiceTo: activeElement.classList.contains('cto'),
          choiceIndex: activeElement.closest('.choice-row') ? 
            Array.from(activeElement.closest('.choice-row').parentElement.children).indexOf(activeElement.closest('.choice-row')) : null
        };
      }
    }

    nodeList.innerHTML = '';
    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    const q = filterQuery || (filter ? filter.value.toLowerCase() : '');
    const nodes = [...graph.nodes]
      .sort((a, b) => compareIds(a.id, b.id))
      .filter(n => (
        !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      ));

    const ids = new Set(graph.nodes.map(n => String(n.id)));

    for (const node of nodes) {
      const item = nodeItemTpl.content.firstElementChild.cloneNode(true);
      const nidEl = item.querySelector('.nid');
      nidEl.textContent = node.id;

      // Visual indentation for nested nodes
      const depth = (String(node.id).match(/\./g) || []).length;
      if (depth > 0) {
        item.style.paddingLeft = `${depth * 20}px`;
        item.style.borderLeft = `3px solid #${['ddd', 'ccc', 'bbb'][Math.min(depth - 1, 2)]}`;
      }

      if (String(session.currentNodeId) === String(node.id)) {
        item.classList.add('active');
      }

      const title = item.querySelector('.ntitle');
      const body = item.querySelector('.nbody');
      const choicesWrap = item.querySelector('.choices');
      const incomingRefsSection = item.querySelector('.incoming-refs-section');
      const incomingRefsContainer = item.querySelector('.incoming-refs');
      const warnTargets = item.querySelector('.warn-targets');
      const warnEmpty = item.querySelector('.warn-empty');

      title.value = node.title;
      body.value = node.body;

      // Function to auto-resize input/textarea to fit content
      const autoResize = (element, minHeight = 40) => {
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
      };

      // Function to update local validation badges
      const updateLocalBadges = () => {
        let missing = false;
        let empty = (!title.value.trim() || !body.value.trim());

        const choiceRows = choicesWrap.querySelectorAll('.choice-row');
        choiceRows.forEach(row => {
          const cLabel = row.querySelector('.clabel');
          const cTo = row.querySelector('.cto');
          if (cLabel && !cLabel.value.trim()) empty = true;
          if (cTo && !ids.has(String(cTo.value))) missing = true;
        });

        warnTargets.classList.toggle('hidden', !missing);
        warnEmpty.classList.toggle('hidden', !empty);
      };

      // Expand input on focus and auto-resize to content
      title.onfocus = () => {
        title.classList.add('expanded');
        setTimeout(() => autoResize(title, 40), 0);
      };
      title.onblur = () => {
        title.classList.remove('expanded');
        title.style.height = ''; // Reset to default height
      };

      title.oninput = () => {
        autoResize(title, 40);
        node.title = title.value;
        this.events.emit('node:updated', node);
        this.events.emit('node:title-changed', { node, title: title.value });
      };

      // Expand textarea on focus and auto-resize to content
      body.onfocus = () => {
        body.classList.add('expanded');
        setTimeout(() => autoResize(body, 60), 0);
      };
      body.onblur = () => {
        body.classList.remove('expanded');
        body.style.height = ''; // Reset to default height
      };

      body.oninput = () => {
        autoResize(body, 60);
        node.body = body.value;
        this.events.emit('node:updated', node);
        this.events.emit('node:body-changed', { node, body: body.value });
      };

      // Choices
      choicesWrap.innerHTML = '';
      let missing = false;
      let empty = (!node.title.trim() || !node.body.trim());

      node.choices.forEach((ch, idx) => {
        const cRow = choiceRowTpl.content.firstElementChild.cloneNode(true);
        const cLabel = cRow.querySelector('.clabel');
        const cTo = cRow.querySelector('.cto');
        const btnGoto = cRow.querySelector('.btnGotoTarget');
        const btnRem = cRow.querySelector('.btnRemChoice');

        cLabel.value = ch.label;
        cTo.value = ch.to;
        if (!ids.has(String(ch.to))) missing = true;
        if (!ch.label.trim()) empty = true;

        // Function to update goto button visibility
        const updateGotoButton = () => {
          const targetId = String(cTo.value || '').trim();
          const hasValidTarget = targetId && ids.has(targetId);
          if (btnGoto) {
            btnGoto.style.display = hasValidTarget ? '' : 'none';
          }
        };

        // Initialize goto button visibility
        updateGotoButton();

        // Handle goto button click
        if (btnGoto) {
          btnGoto.onclick = () => {
            const targetId = String(cTo.value || '').trim();
            if (targetId && ids.has(targetId)) {
              this.focusOnNode(targetId);
            }
          };
        }

        // Expand choice label input on focus and auto-resize to content
        cLabel.onfocus = () => {
          cLabel.classList.add('expanded');
          setTimeout(() => autoResize(cLabel, 40), 0);
        };
        cLabel.onblur = () => {
          cLabel.classList.remove('expanded');
          cLabel.style.height = ''; // Reset to default height
        };

        cLabel.oninput = () => {
          autoResize(cLabel, 40);
          ch.label = cLabel.value;
          this.events.emit('node:updated', node);
          this.events.emit('choice:updated', { node, choice: ch });
        };

        // Expand choice target input on focus and auto-resize to content
        cTo.onfocus = () => {
          cTo.classList.add('expanded');
          setTimeout(() => autoResize(cTo, 40), 0);
        };
        cTo.onblur = () => {
          cTo.classList.remove('expanded');
          cTo.style.height = ''; // Reset to default height
        };

        cTo.oninput = () => {
          autoResize(cTo, 40);
          ch.to = String(cTo.value);
          updateGotoButton(); // Update goto button visibility when target changes
          this.events.emit('node:updated', node);
          this.events.emit('choice:updated', { node, choice: ch });
        };

        btnRem.onclick = () => {
          node.choices.splice(idx, 1);
          this.events.emit('node:updated', node);
          this.events.emit('choice:removed', { node, index: idx });
        };

        choicesWrap.appendChild(cRow);
      });

      warnTargets.classList.toggle('hidden', !missing);
      warnEmpty.classList.toggle('hidden', !empty);

      // Incoming References
      const incomingRefs = getIncomingReferences(node.id, graph.nodes);
      const hasIncoming = incomingRefs.length > 0;
      
      if (incomingRefsSection && incomingRefsContainer) {
        if (hasIncoming) {
          incomingRefsSection.classList.remove('hidden');
          incomingRefsContainer.innerHTML = '';
          
          incomingRefs.forEach(ref => {
            const refItem = document.createElement('div');
            refItem.className = 'incoming-ref-item';
            const nodeId = String(ref.node.id);
            const nodeAnchor = `#node-${nodeId}`;
            refItem.innerHTML = `
              <a href="${nodeAnchor}" class="ref-node-id-link" data-node-id="${escapeHtml(nodeId)}" title="Go to node #${escapeHtml(nodeId)}">#${escapeHtml(nodeId)}</a>
              <span class="ref-choice-label">"${escapeHtml(ref.choice.label || '')}"</span>
              <span class="ref-node-title">${escapeHtml(ref.node.title || '')}</span>
            `;
            
            // Add click handler for the link
            const link = refItem.querySelector('.ref-node-id-link');
            if (link) {
              link.onclick = (e) => {
                e.preventDefault();
                const targetNodeId = link.dataset.nodeId;
                if (targetNodeId) {
                  this.focusOnNode(targetNodeId);
                }
              };
            }
            
            incomingRefsContainer.appendChild(refItem);
          });
        } else {
          incomingRefsSection.classList.add('hidden');
        }
      }

      item.querySelector('.btnAddChoice').onclick = () => {
        const firstNodeId = graph.nodes[0]?.id ?? '1';
        node.choices.push({ label: '', to: String(firstNodeId) });
        this.events.emit('node:updated', node);
        this.events.emit('choice:added', { node });
      };

      item.querySelector('.btnDelete').onclick = () => {
        if (!confirm(`Delete node #${node.id}? This will remove references.`)) return;
        this.events.emit('node:delete-requested', node);
      };

      item.querySelector('.btnClone').onclick = () => {
        this.events.emit('node:clone-requested', node);
      };

      item.querySelector('.btnAddChild').onclick = () => {
        this.events.emit('node:add-child-requested', node);
      };

      nodeList.appendChild(item);
    }

    // Restore scroll position
    if (scrollTop !== undefined) {
      nodeList.scrollTop = scrollTop;
    }

    // Restore focus and cursor position if user was typing
    if (activeElementState && activeElementState.nodeId) {
      setTimeout(() => {
        // Find the node item by ID
        const nodeItems = nodeList.querySelectorAll('.node-item');
        let targetNodeItem = null;
        for (const item of nodeItems) {
          const nidEl = item.querySelector('.nid');
          if (nidEl && nidEl.textContent === activeElementState.nodeId) {
            targetNodeItem = item;
            break;
          }
        }

        if (targetNodeItem) {
          let elementToFocus = null;
          if (activeElementState.isTitle) {
            elementToFocus = targetNodeItem.querySelector('.ntitle');
          } else if (activeElementState.isBody) {
            elementToFocus = targetNodeItem.querySelector('.nbody');
          } else if (activeElementState.isChoiceLabel && activeElementState.choiceIndex !== null) {
            const choiceRows = targetNodeItem.querySelectorAll('.choice-row');
            if (choiceRows[activeElementState.choiceIndex]) {
              elementToFocus = choiceRows[activeElementState.choiceIndex].querySelector('.clabel');
            }
          } else if (activeElementState.isChoiceTo && activeElementState.choiceIndex !== null) {
            const choiceRows = targetNodeItem.querySelectorAll('.choice-row');
            if (choiceRows[activeElementState.choiceIndex]) {
              elementToFocus = choiceRows[activeElementState.choiceIndex].querySelector('.cto');
            }
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
        }
      }, 0);
    }

    // Focus on pending node after render completes
    if (nodeIdToFocus) {
      setTimeout(() => {
        this.focusOnNode(nodeIdToFocus);
        // Clear the pending focus after focusing (or attempting to)
        this.pendingFocusNodeId = null;
      }, 200);
    }
  }

  /**
   * Focus on a specific node by ID
   * Scrolls to the node item and focuses on the title input
   * @param {string|number} nodeId - Node ID to focus on
   */
  focusOnNode(nodeId) {
    const nodeList = this.dom.get('nodeList');
    if (!nodeList) return;

    const nodeItems = nodeList.querySelectorAll('.node-item');
    for (const item of nodeItems) {
      const nidEl = item.querySelector('.nid');
      if (nidEl && nidEl.textContent === String(nodeId)) {
        // Scroll the node item into view
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus on the title input after a small delay to ensure smooth scroll completes
        setTimeout(() => {
          const titleInput = item.querySelector('.ntitle');
          if (titleInput) {
            titleInput.focus();
            // Select all text so user can immediately type to replace
            titleInput.select();
          }
        }, 300);
        return;
      }
    }
  }
}

