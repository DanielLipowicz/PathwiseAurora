/**
 * ID-related utility functions
 * Pure functions for ID generation and comparison
 */

/**
 * Normalize ID to string format
 * @param {string|number} id - ID to normalize
 * @returns {string} Normalized ID as string
 */
export function normalizeId(id) {
  return String(id);
}

/**
 * Compare two IDs for sorting (supports decimal notation: 1, 1.1, 1.1.1, 2, etc.)
 * @param {string|number} a - First ID
 * @param {string|number} b - Second ID
 * @returns {number} Comparison result (-1, 0, or 1)
 */
export function compareIds(a, b) {
  const aStr = String(a);
  const bStr = String(b);
  const aParts = aStr.split('.').map(Number);
  const bParts = bStr.split('.').map(Number);
  const maxLen = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLen; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
}

/**
 * Generate next root-level ID
 * @param {Array} nodes - Array of all nodes
 * @returns {string} Next available root ID
 */
export function nextId(nodes) {
  if (!nodes || nodes.length === 0) return '1';
  // Find largest numeric ID at root level
  const rootNodes = nodes.filter(n => !String(n.id).includes('.'));
  if (rootNodes.length === 0) return '1';
  const maxRoot = Math.max(...rootNodes.map(n => Number(String(n.id).split('.')[0])));
  return String(maxRoot + 1);
}

/**
 * Generate next child ID for a given parent
 * @param {string|number} parentId - Parent node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Function} getChildren - Function to get children of a node
 * @returns {string} Next available child ID
 */
export function nextChildId(parentId, nodes, getChildren) {
  const children = getChildren(parentId, nodes);
  if (children.length === 0) return `${parentId}.1`;
  const childNums = children.map(n => {
    const parts = String(n.id).split('.');
    return Number(parts[parts.length - 1]);
  });
  const maxChild = Math.max(...childNums);
  return `${parentId}.${maxChild + 1}`;
}

