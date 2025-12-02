/**
 * Node-related utility functions
 * Pure functions for node operations
 */

/**
 * Find node by ID
 * @param {string|number} id - Node ID to find
 * @param {Array} nodes - Array of nodes to search
 * @returns {Object|null} Found node or null
 */
export function byId(id, nodes) {
  return nodes.find(n => String(n.id) === String(id)) || null;
}

/**
 * Get parent ID from a nested ID
 * @param {string|number} id - Node ID
 * @returns {string|null} Parent ID or null if root level
 */
export function getParentId(id) {
  const str = String(id);
  const lastDot = str.lastIndexOf('.');
  if (lastDot === -1) return null;
  return str.substring(0, lastDot);
}

/**
 * Get direct children of a node
 * @param {string|number} id - Parent node ID
 * @param {Array} nodes - Array of all nodes
 * @returns {Array} Array of child nodes
 */
export function getChildren(id, nodes) {
  const str = String(id);
  return nodes.filter(n => {
    const nStr = String(n.id);
    return nStr.startsWith(str + '.') && (nStr.match(/\./g) || []).length === (str.match(/\./g) || []).length + 1;
  });
}

/**
 * Get sibling nodes (same parent level)
 * @param {string|number} id - Node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Function} getParentId - Function to get parent ID
 * @param {Function} getChildren - Function to get children
 * @returns {Array} Array of sibling nodes
 */
export function getSiblings(id, nodes, getParentId, getChildren) {
  const parentId = getParentId(id);
  if (parentId === null) {
    // Root level nodes (no parent)
    return nodes.filter(n => {
      const nStr = String(n.id);
      return !nStr.includes('.');
    });
  }
  return getChildren(parentId, nodes);
}

/**
 * Get next sibling ID
 * @param {string|number} id - Current node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Function} compareIds - Function to compare IDs
 * @returns {string|number|null} Next sibling ID or null
 */
export function getNextSibling(id, nodes, compareIds) {
  const siblings = getSiblings(id, nodes, getParentId, getChildren);
  const sorted = siblings.sort((a, b) => compareIds(a.id, b.id));
  const currentIdx = sorted.findIndex(n => String(n.id) === String(id));
  if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
    return sorted[currentIdx + 1].id;
  }
  return null;
}

/**
 * Get previous sibling ID
 * @param {string|number} id - Current node ID
 * @param {Array} nodes - Array of all nodes
 * @param {Function} compareIds - Function to compare IDs
 * @returns {string|number|null} Previous sibling ID or null
 */
export function getPrevSibling(id, nodes, compareIds) {
  const siblings = getSiblings(id, nodes, getParentId, getChildren);
  const sorted = siblings.sort((a, b) => compareIds(a.id, b.id));
  const currentIdx = sorted.findIndex(n => String(n.id) === String(id));
  if (currentIdx > 0) {
    return sorted[currentIdx - 1].id;
  }
  return null;
}

/**
 * Get incoming references (nodes that have choices pointing to this node)
 * @param {string|number} nodeId - Node ID to find references for
 * @param {Array} nodes - Array of all nodes
 * @returns {Array} Array of objects with node and choice information
 */
export function getIncomingReferences(nodeId, nodes) {
  const targetId = String(nodeId);
  const references = [];
  
  for (const node of nodes) {
    for (const choice of node.choices) {
      if (String(choice.to) === targetId) {
        references.push({
          node: node,
          choice: choice
        });
      }
    }
  }
  
  return references;
}

/**
 * Check if a node is referenced by any other node
 * @param {string|number} nodeId - Node ID to check
 * @param {Array} nodes - Array of all nodes
 * @returns {boolean} True if node is referenced
 */
export function isReferenced(nodeId, nodes) {
  return getIncomingReferences(nodeId, nodes).length > 0;
}

/**
 * Create history entry from node
 * @param {Object} node - Node object
 * @param {string} [selectedChoice] - Label of the selected choice that led to this node
 * @returns {Object|null} History entry object or null
 */
export function createHistoryEntry(node, selectedChoice = null) {
  if (!node) return null;
  const entry = { id: node.id, title: node.title, body: node.body, comment: '', tags: [] };
  if (selectedChoice) {
    entry.selectedChoice = selectedChoice;
  }
  return entry;
}

/**
 * Migrate old history format (array of IDs) to new format (array of objects)
 * @param {Array} oldHistory - Old history format (array of IDs)
 * @param {Object} graphData - Graph data with nodes
 * @returns {Array} Migrated history array
 */
export function migrateHistory(oldHistory, graphData) {
  if (!oldHistory || !Array.isArray(oldHistory)) return [];
  if (!graphData || !Array.isArray(graphData.nodes)) return [];
  
  const findNodeById = (id) => {
    return graphData.nodes.find(n => String(n.id) === String(id)) || null;
  };
  
  return oldHistory.map(id => {
    const node = findNodeById(id);
    if (node) {
      return { id: node.id, title: node.title, body: node.body, comment: '', tags: [] };
    }
    // If node doesn't exist, try to keep just the ID as fallback
    return { id: String(id), title: `#${id}`, body: '', comment: '', tags: [] };
  }).filter(entry => entry !== null);
}
