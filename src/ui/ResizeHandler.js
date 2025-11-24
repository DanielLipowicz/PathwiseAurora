/**
 * Resize Handler
 * Handles sidebar resize functionality
 */

export class ResizeHandler {
  constructor(domRegistry, storageService) {
    this.dom = domRegistry;
    this.storage = storageService;
    this.isResizing = false;
    this.startX = 0;
    this.startWidth = 0;
    this.initialize();
  }

  /**
   * Initialize resize handler
   */
  initialize() {
    // Load saved width from localStorage
    const savedWidth = this.storage.loadSidebarWidth();
    if (savedWidth) {
      document.documentElement.style.setProperty('--sidebar-width', savedWidth + 'px');
    }

    const handle = this.dom.get('resizeHandle');
    if (!handle) return;

    handle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      this.startX = e.clientX;
      const currentWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
      this.startWidth = parseInt(currentWidth) || 420;
      handle.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isResizing) return;
      const diff = e.clientX - this.startX;
      const newWidth = Math.max(300, Math.min(800, this.startWidth + diff)); // Min 300px, max 800px
      document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
      this.storage.saveSidebarWidth(newWidth);
    });

    document.addEventListener('mouseup', () => {
      if (this.isResizing) {
        this.isResizing = false;
        handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }
}

