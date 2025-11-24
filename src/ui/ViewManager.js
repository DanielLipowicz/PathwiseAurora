/**
 * View Manager
 * Manages view state (list vs tiles)
 */

export class ViewManager {
  constructor(domRegistry, eventBus) {
    this.dom = domRegistry;
    this.events = eventBus;
    this.currentView = 'list';
    this.initialize();
  }

  /**
   * Initialize view manager
   */
  initialize() {
    // Set up view switcher buttons
    const btnViewList = this.dom.get('btnViewList');
    const btnViewTiles = this.dom.get('btnViewTiles');
    const nodeList = this.dom.get('nodeList');
    const tilesView = this.dom.get('tilesView');

    if (btnViewList) {
      btnViewList.onclick = () => this.switchToView('list');
    }
    if (btnViewTiles) {
      btnViewTiles.onclick = () => this.switchToView('tiles');
    }
  }

  /**
   * Switch to a specific view
   * @param {string} view - View name ('list' or 'tiles')
   */
  switchToView(view) {
    if (view !== 'list' && view !== 'tiles') return;

    this.currentView = view;
    const nodeList = this.dom.get('nodeList');
    const tilesView = this.dom.get('tilesView');
    const btnViewList = this.dom.get('btnViewList');
    const btnViewTiles = this.dom.get('btnViewTiles');

    if (view === 'list') {
      if (nodeList) nodeList.classList.remove('hidden');
      if (tilesView) tilesView.classList.add('hidden');
      if (btnViewList) btnViewList.classList.add('active');
      if (btnViewTiles) btnViewTiles.classList.remove('active');
    } else {
      if (nodeList) nodeList.classList.add('hidden');
      if (tilesView) tilesView.classList.remove('hidden');
      if (btnViewList) btnViewList.classList.remove('active');
      if (btnViewTiles) btnViewTiles.classList.add('active');
    }

    // Emit view change event
    this.events.emit('view:changed', view);
  }

  /**
   * Get current view
   * @returns {string} Current view name
   */
  getCurrentView() {
    return this.currentView;
  }
}

