/**
 * History View
 * Renders the session history
 */

export class HistoryView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.events.on('session:changed', () => this.render());
    this.events.on('history:render-requested', () => this.render());
    this.events.on('history:comment-updated', () => this.render());
    this.events.on('history:entry-added', () => this.render());
    this.events.on('history:tags-updated', () => this.render());
  }

  /**
   * Render the history view
   */
  render() {
    const history = this.dom.get('history');
    if (!history) return;

    history.innerHTML = '';

    const session = this.state.getSession();
    if (!session || !session.history) return;

    for (let i = 0; i < session.history.length; i++) {
      const entry = session.history[i];
      // Support both old format (string/number) and new format (object)
      const entryId = (typeof entry === 'object' && entry !== null) ? entry.id : entry;
      const entryTitle = (typeof entry === 'object' && entry !== null) ? (entry.title || '') : '';
      const entryBody = (typeof entry === 'object' && entry !== null) ? (entry.body || '') : '';
      const entryComment = (typeof entry === 'object' && entry !== null) ? (entry.comment || '') : '';
      const entryTags = (typeof entry === 'object' && entry !== null) ? (Array.isArray(entry.tags) ? entry.tags : []) : [];

      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      if (String(entryId) === String(session.currentNodeId)) {
        historyItem.classList.add('active');
      }

      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = `#${entryId}`;

      const content = document.createElement('div');
      content.className = 'history-content';
      const title = document.createElement('div');
      title.className = 'history-title';
      title.textContent = entryTitle || `#${entryId}`;
      const body = document.createElement('div');
      body.className = 'history-body';
      body.textContent = entryBody || '';

      content.appendChild(title);
      if (entryBody) {
        content.appendChild(body);
      }

      // Add comment if exists
      if (entryComment) {
        const comment = document.createElement('div');
        comment.className = 'history-comment';
        comment.textContent = entryComment;
        content.appendChild(comment);
      }

      // Add tags if exist
      if (entryTags && entryTags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'row';
        tagsContainer.style.flexWrap = 'wrap';
        tagsContainer.style.gap = '4px';
        tagsContainer.style.marginTop = '6px';
        entryTags.forEach(tag => {
          const tagPill = document.createElement('span');
          tagPill.className = 'badge';
          tagPill.style.fontSize = '0.85em';
          tagPill.textContent = tag;
          tagsContainer.appendChild(tagPill);
        });
        content.appendChild(tagsContainer);
      }

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Remove this step from history';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (!confirm(`Remove step #${entryId} from history?`)) return;
        this.events.emit('history:delete-requested', { index: i, entryId });
      };

      historyItem.appendChild(pill);
      historyItem.appendChild(content);
      historyItem.appendChild(deleteBtn);

      historyItem.onclick = () => {
        this.events.emit('history:entry-selected', entryId);
      };

      history.appendChild(historyItem);
    }
  }
}

