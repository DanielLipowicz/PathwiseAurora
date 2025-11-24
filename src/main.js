/**
 * Main Entry Point
 * Initializes the application
 */

import { AppController } from './controllers/AppController.js';

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
  });
} else {
  window.app = new AppController();
}

