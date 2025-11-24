/**
 * Errors View
 * Renders validation errors
 */

export class ErrorsView {
  constructor(validationService, eventBus, domRegistry) {
    this.validation = validationService;
    this.events = eventBus;
    this.dom = domRegistry;
    this.emptyReferences = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.events.on('validation:updated', (data) => {
      this.emptyReferences = data.emptyReferences || [];
      this.render();
    });
  }

  /**
   * Render the errors view
   */
  render() {
    const errorsSection = this.dom.get('errorsSection');
    const errorsList = this.dom.get('errorsList');

    if (!errorsSection || !errorsList) return;

    if (this.emptyReferences.length === 0) {
      errorsSection.classList.add('hidden');
      return;
    }

    errorsSection.classList.remove('hidden');
    errorsList.innerHTML = '';

    for (const error of this.emptyReferences) {
      const errorItem = document.createElement('div');
      errorItem.className = 'error-item';

      const nodeInfo = document.createElement('div');
      nodeInfo.className = 'error-item-node';
      nodeInfo.textContent = `#${error.nodeId} · ${error.nodeTitle || '(no title)'}`;

      const detail = document.createElement('div');
      detail.className = 'error-item-detail';
      if (error.targetId) {
        detail.textContent = `Choice "${error.choiceLabel}" → Missing target: #${error.targetId}`;
      } else {
        detail.textContent = `Choice "${error.choiceLabel}" → Empty reference (no target specified)`;
      }

      errorItem.appendChild(nodeInfo);
      errorItem.appendChild(detail);
      errorsList.appendChild(errorItem);
    }
  }
}

