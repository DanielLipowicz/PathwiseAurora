/**
 * URL Service
 * Handles URL manipulation and browser history
 */

export class UrlService {
  /**
   * Update URL with node ID parameter
   * @param {string|number|null} nodeId - Node ID to set in URL
   * @param {boolean} replaceState - Whether to use replaceState instead of pushState
   */
  updateUrl(nodeId, replaceState = false) {
    const url = new URL(window.location);
    if (nodeId) {
      url.searchParams.set('node', String(nodeId));
    } else {
      url.searchParams.delete('node');
    }
    if (replaceState) {
      history.replaceState({ nodeId }, '', url);
    } else {
      history.pushState({ nodeId }, '', url);
    }
  }

  /**
   * Get node ID from URL parameters
   * @returns {string|null} Node ID from URL or null
   */
  getNodeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('node');
  }
}

