/**
 * Runner View
 * Renders the runner/navigation view
 */

import { escapeHtml } from '../utils/HtmlUtils.js';
import { compareIds } from '../utils/IdUtils.js';
import { byId, getParentId, getSiblings, getChildren } from '../utils/NodeUtils.js';

export class RunnerView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.events.on('session:changed', () => this.render());
    this.events.on('graph:changed', () => this.render());
    this.events.on('state:updated', () => this.render());
    this.events.on('navigation:advanced', () => this.render());
    this.events.on('history:tags-updated', () => this.render());
  }

  /**
   * Render the runner view
   */
  render() {
    const view = this.dom.get('runnerView');
    const startSelect = this.dom.get('startSelect');
    const runnerNodeId = this.dom.get('runnerNodeId');
    if (!view) return;

    view.innerHTML = '';

    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    // Update select options
    if (startSelect) {
      startSelect.innerHTML = graph.nodes
        .sort((a, b) => compareIds(a.id, b.id))
        .map(n => `<option value="${n.id}">#${n.id} · ${escapeHtml(n.title)}</option>`)
        .join('');
    }

    if (runnerNodeId) {
      runnerNodeId.value = session.currentNodeId ?? '';
    }

    const node = byId(session.currentNodeId, graph.nodes);
    if (!node) {
      view.innerHTML = `<div class="muted">No node selected. Select Start and click <b>Start</b> or enter ID and click <b>Go</b>.</div>`;
      this.events.emit('history:render-requested');
      return;
    }

    // Display parent node if exists
    const parentId = getParentId(node.id);
    if (parentId) {
      const parent = byId(parentId, graph.nodes);
      if (parent) {
        const parentLink = document.createElement('div');
        parentLink.className = 'muted';
        parentLink.style.marginBottom = '8px';
        parentLink.style.fontSize = '0.9em';
        parentLink.innerHTML = `↑ Parent: <a href="#" style="text-decoration: underline; cursor: pointer;">#${parentId} · ${escapeHtml(parent.title)}</a>`;
        parentLink.querySelector('a').onclick = (e) => {
          e.preventDefault();
          this.events.emit('navigation:advance-requested', parentId);
        };
        view.appendChild(parentLink);
      }
    }

    const h2 = document.createElement('h2');
    h2.textContent = `#${node.id} · ${node.title}`;
    view.appendChild(h2);

    const p = document.createElement('div');
    p.innerText = node.body;
    view.appendChild(p);

    // Sibling navigation
    const siblings = getSiblings(node.id, graph.nodes, getParentId, getChildren);
    const sortedSiblings = siblings.sort((a, b) => compareIds(a.id, b.id));
    const currentIdx = sortedSiblings.findIndex(n => String(n.id) === String(node.id));
    const hasSiblings = sortedSiblings.length > 1;

    if (hasSiblings) {
      const navArea = document.createElement('div');
      navArea.className = 'row';
      navArea.style.marginTop = '12px';
      navArea.style.gap = '6px';
      navArea.style.alignItems = 'center';

      const prevSibling = currentIdx > 0 ? sortedSiblings[currentIdx - 1] : null;
      const nextSibling = currentIdx < sortedSiblings.length - 1 ? sortedSiblings[currentIdx + 1] : null;

      if (prevSibling) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = `← #${prevSibling.id}`;
        prevBtn.className = 'ghost';
        prevBtn.onclick = () => this.events.emit('navigation:advance-requested', prevSibling.id);
        navArea.appendChild(prevBtn);
      }

      const siblingInfo = document.createElement('span');
      siblingInfo.className = 'muted';
      siblingInfo.textContent = `${currentIdx + 1} / ${sortedSiblings.length}`;
      navArea.appendChild(siblingInfo);

      if (nextSibling) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = `#${nextSibling.id} →`;
        nextBtn.className = 'ghost';
        nextBtn.onclick = () => this.events.emit('navigation:advance-requested', nextSibling.id);
        navArea.appendChild(nextBtn);
      }

      view.appendChild(navArea);
    }

    // Choices
    const area = document.createElement('div');
    area.className = 'col';
    area.style.marginTop = '8px';

    if (node.choices.length === 0) {
      const end = document.createElement('div');
      end.innerHTML = `<span class="badge ok">End of path</span>`;
      area.appendChild(end);
    } else {
      for (const ch of node.choices) {
        const btn = document.createElement('button');
        btn.textContent = `${ch.label || '(no label)'} → #${ch.to}`;
        const targetExists = !!byId(String(ch.to), graph.nodes);
        if (!targetExists) {
          btn.disabled = true;
          btn.title = 'Target node does not exist';
          btn.classList.add('warn');
        }
        btn.onclick = () => this.events.emit('navigation:advance-requested', ch.to);
        area.appendChild(btn);
      }
    }
    view.appendChild(area);

    // Comment section
    const commentDivider = document.createElement('div');
    commentDivider.className = 'divider';
    commentDivider.style.marginTop = '16px';
    commentDivider.style.marginBottom = '12px';
    view.appendChild(commentDivider);

    const commentLabel = document.createElement('label');
    commentLabel.className = 'muted';
    commentLabel.style.marginBottom = '6px';
    commentLabel.textContent = 'Step Comment';
    view.appendChild(commentLabel);

    // Find current history entry
    let currentHistoryEntry = null;
    if (session.currentNodeId && session.history.length > 0) {
      for (let i = session.history.length - 1; i >= 0; i--) {
        if (String(session.history[i].id) === String(session.currentNodeId)) {
          currentHistoryEntry = session.history[i];
          break;
        }
      }
    }

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Add a comment to this step...';
    commentTextarea.rows = 3;
    commentTextarea.value = currentHistoryEntry?.comment || '';
    commentTextarea.style.width = '100%';
    commentTextarea.style.resize = 'vertical';
    commentTextarea.oninput = () => {
      if (currentHistoryEntry) {
        currentHistoryEntry.comment = commentTextarea.value;
        this.events.emit('history:comment-updated', currentHistoryEntry);
      } else if (session.currentNodeId && session.history.length > 0) {
        const node = byId(session.currentNodeId, graph.nodes);
        if (node) {
          const newEntry = { id: node.id, title: node.title, body: node.body, comment: commentTextarea.value, tags: [] };
          session.history.push(newEntry);
          currentHistoryEntry = newEntry;
          this.events.emit('history:entry-added', newEntry);
        }
      }
    };
    view.appendChild(commentTextarea);

    // Tags/Notes section
    const tagsDivider = document.createElement('div');
    tagsDivider.className = 'divider';
    tagsDivider.style.marginTop = '16px';
    tagsDivider.style.marginBottom = '12px';
    view.appendChild(tagsDivider);

    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'muted';
    tagsLabel.style.marginBottom = '6px';
    tagsLabel.textContent = 'Tags / Notes (e.g. "needs clarification", "customer reacted strongly", "requires SME review")';
    view.appendChild(tagsLabel);

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'col';
    tagsContainer.style.gap = '8px';
    tagsContainer.style.marginBottom = '8px';

    // Display existing tags
    const tagsDisplay = document.createElement('div');
    tagsDisplay.className = 'row';
    tagsDisplay.style.flexWrap = 'wrap';
    tagsDisplay.style.gap = '6px';
    tagsDisplay.style.minHeight = '32px';

    const updateTagsDisplay = () => {
      tagsDisplay.innerHTML = '';
      const tags = currentHistoryEntry?.tags || [];
      tags.forEach((tag, idx) => {
        const tagPill = document.createElement('span');
        tagPill.className = 'badge';
        tagPill.style.cursor = 'pointer';
        tagPill.textContent = tag;
        tagPill.title = 'Click to remove';
        tagPill.onclick = () => {
          if (currentHistoryEntry) {
            currentHistoryEntry.tags = currentHistoryEntry.tags.filter((_, i) => i !== idx);
            if (!Array.isArray(currentHistoryEntry.tags)) currentHistoryEntry.tags = [];
            updateTagsDisplay();
            this.events.emit('history:tags-updated', currentHistoryEntry);
          }
        };
        tagsDisplay.appendChild(tagPill);
      });
    };

    updateTagsDisplay();
    tagsContainer.appendChild(tagsDisplay);

    // Add tag input
    const tagInputRow = document.createElement('div');
    tagInputRow.className = 'row';
    tagInputRow.style.gap = '8px';
    tagInputRow.style.alignItems = 'center';

    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.placeholder = 'Enter tag and press Enter or click Add';
    tagInput.style.flex = '1';
    tagInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tagValue = tagInput.value.trim();
        if (tagValue) {
          if (!currentHistoryEntry) {
            const node = byId(session.currentNodeId, graph.nodes);
            if (node) {
              const newEntry = { id: node.id, title: node.title, body: node.body, comment: '', tags: [tagValue] };
              session.history.push(newEntry);
              currentHistoryEntry = newEntry;
              this.events.emit('history:entry-added', newEntry);
            }
          } else {
            if (!Array.isArray(currentHistoryEntry.tags)) currentHistoryEntry.tags = [];
            if (!currentHistoryEntry.tags.includes(tagValue)) {
              currentHistoryEntry.tags.push(tagValue);
              this.events.emit('history:tags-updated', currentHistoryEntry);
            }
          }
          tagInput.value = '';
          updateTagsDisplay();
        }
      }
    };

    const tagAddBtn = document.createElement('button');
    tagAddBtn.textContent = 'Add';
    tagAddBtn.className = 'ghost';
    tagAddBtn.onclick = () => {
      const tagValue = tagInput.value.trim();
      if (tagValue) {
        if (!currentHistoryEntry) {
          const node = byId(session.currentNodeId, graph.nodes);
          if (node) {
            const newEntry = { id: node.id, title: node.title, body: node.body, comment: '', tags: [tagValue] };
            session.history.push(newEntry);
            currentHistoryEntry = newEntry;
            this.events.emit('history:entry-added', newEntry);
          }
        } else {
          if (!Array.isArray(currentHistoryEntry.tags)) currentHistoryEntry.tags = [];
          if (!currentHistoryEntry.tags.includes(tagValue)) {
            currentHistoryEntry.tags.push(tagValue);
            this.events.emit('history:tags-updated', currentHistoryEntry);
          }
        }
        tagInput.value = '';
        updateTagsDisplay();
      }
    };

    tagInputRow.appendChild(tagInput);
    tagInputRow.appendChild(tagAddBtn);
    tagsContainer.appendChild(tagInputRow);
    view.appendChild(tagsContainer);

    // Decision option section
    const decisionDivider = document.createElement('div');
    decisionDivider.className = 'divider';
    decisionDivider.style.marginTop = '16px';
    decisionDivider.style.marginBottom = '12px';
    view.appendChild(decisionDivider);

    const decisionLabel = document.createElement('label');
    decisionLabel.className = 'muted';
    decisionLabel.style.marginBottom = '6px';
    decisionLabel.textContent = 'Add Decision Option';
    view.appendChild(decisionLabel);

    const decisionForm = document.createElement('div');
    decisionForm.className = 'col';
    decisionForm.style.gap = '8px';

    const decisionLabelInput = document.createElement('input');
    decisionLabelInput.type = 'text';
    decisionLabelInput.placeholder = 'Label (e.g. positive)';
    decisionLabelInput.style.width = '100%';
    decisionForm.appendChild(decisionLabelInput);

    const decisionToRow = document.createElement('div');
    decisionToRow.className = 'row';
    decisionToRow.style.gap = '8px';
    decisionToRow.style.alignItems = 'center';

    const decisionToInput = document.createElement('input');
    decisionToInput.type = 'text';
    decisionToInput.placeholder = 'To # (e.g. 1.1)';
    decisionToInput.style.flex = '1';
    decisionToRow.appendChild(decisionToInput);

    const decisionAddBtn = document.createElement('button');
    decisionAddBtn.textContent = 'Add';
    decisionAddBtn.className = 'primary';
    decisionAddBtn.onclick = () => {
      const label = decisionLabelInput.value.trim();
      const to = decisionToInput.value.trim();
      if (!label || !to) {
        alert('Fill in label and target');
        return;
      }
      if (!byId(to, graph.nodes)) {
        if (!confirm(`Node #${to} does not exist. Do you want to add the option anyway?`)) {
          return;
        }
      }
      this.events.emit('node:choice-add-requested', { node, label, to });
      decisionLabelInput.value = '';
      decisionToInput.value = '';
    };
    decisionToRow.appendChild(decisionAddBtn);
    decisionForm.appendChild(decisionToRow);
    view.appendChild(decisionForm);

    this.events.emit('history:render-requested');
  }
}

