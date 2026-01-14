/**
 * Node-related utility functions
 * Pure functions for node operations
 */

import { nextChildId, nextId, compareIds } from './IdUtils.js';

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

/**
 * Get all nodes in the subtree rooted at given nodeId (including root)
 * @param {string} nodeId - Root node ID of the subtree
 * @param {Array} nodes - All nodes
 * @returns {Array} Subtree nodes
 */
function getSubtreeNodes(nodeId, nodes) {
  const base = String(nodeId);
  return nodes.filter(n => {
    const idStr = String(n.id);
    return idStr === base || idStr.startsWith(base + '.');
  });
}

/**
 * Migrate a node (and its subtree) under a new parent.
 * Reassigns IDs to match the new ordering and updates all references.
 *
 * Rules:
 * - If newParentId is null, the node becomes a root node with a new root ID.
 * - If newParentId points to an existing node, the node becomes its child with a new child ID.
 * - If desiredId is provided and the target slot is already used, IDs are shifted by renumbering
 *   the affected level (and, since IDs are hierarchical, all descendants) to keep IDs sequential.
 * - All IDs are recalculated to be sequential (1..N) according to the resulting ordering.
 * - All references (choices.to) are updated to the recalculated IDs.
 * - Moving a node under itself or its descendant is not allowed.
 *
 * @param {Array} nodes - Array of all nodes (immutable; a new array is returned)
 * @param {string|number} nodeId - ID of the node to migrate
 * @param {string|number|null} newParentId - ID of the new parent or null for root
 * @param {string|number|null} [desiredId] - Optional desired ID (or desired sibling number) at destination
 * @returns {Array} New nodes array with updated IDs and references
 */
export function migrateNode(nodes, nodeId, newParentId, desiredId = null) {
  const nodeIdStr = String(nodeId);
  const destParentStr = newParentId === null ? null : String(newParentId);

  // Validate existence
  const nodeToMove = byId(nodeIdStr, nodes);
  if (!nodeToMove) {
    throw new Error(`Node ${nodeIdStr} not found`);
  }
  if (destParentStr !== null && !byId(destParentStr, nodes)) {
    throw new Error(`Destination parent ${destParentStr} not found`);
  }

  // Prevent moving under itself or within its own subtree
  if (destParentStr && (destParentStr === nodeIdStr || destParentStr.startsWith(nodeIdStr + '.'))) {
    throw new Error('Cannot move a node under itself or its descendant');
  }

  // Determine source parent
  const srcParentStr = getParentId(nodeIdStr);

  // Helper: numeric sibling index (1-based) from an ID or plain number
  const desiredIndex = (() => {
    if (desiredId === null || desiredId === undefined) return null;
    const raw = String(desiredId);
    const last = raw.split('.').pop();
    const num = Number(last);
    if (!Number.isFinite(num) || num < 1) {
      throw new Error(`Invalid desiredId: ${raw}`);
    }
    return Math.floor(num);
  })();

  // Build parent -> ordered direct children list from current IDs
  const childrenByParent = new Map();
  const ensureList = (key) => {
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    return childrenByParent.get(key);
  };
  for (const n of nodes) {
    const idStr = String(n.id);
    const p = getParentId(idStr); // null for root
    ensureList(p).push(idStr);
  }
  for (const [p, list] of childrenByParent.entries()) {
    list.sort(compareIds);
    childrenByParent.set(p, list);
  }

  // Apply move in the parent->children structure (move only the subtree root; children remain attached)
  const srcSiblings = ensureList(srcParentStr);
  const srcIdx = srcSiblings.findIndex(id => id === nodeIdStr);
  if (srcIdx === -1) {
    // Shouldn't happen if the ID structure is consistent
    throw new Error(`Node ${nodeIdStr} not found in its parent's child list`);
  }
  srcSiblings.splice(srcIdx, 1);

  const destSiblings = ensureList(destParentStr);
  const insertAt1Based = desiredIndex ?? (destSiblings.length + 1);
  const boundedInsertAt = Math.min(Math.max(insertAt1Based, 1), destSiblings.length + 1);
  destSiblings.splice(boundedInsertAt - 1, 0, nodeIdStr);

  // Renumber the whole tree from roots to ensure sequential IDs everywhere
  const idMapping = new Map(); // oldId -> newId
  const visited = new Set();
  const roots = ensureList(null);

  const assignSubtree = (oldId, newId) => {
    idMapping.set(oldId, newId);
    visited.add(oldId);
    const kids = ensureList(oldId);
    for (let i = 0; i < kids.length; i++) {
      const childOldId = kids[i];
      assignSubtree(childOldId, `${newId}.${i + 1}`);
    }
  };

  for (let i = 0; i < roots.length; i++) {
    assignSubtree(roots[i], String(i + 1));
  }

  // If there are any nodes not reachable from roots (broken parent chains), treat them as extra roots
  const allIds = nodes.map(n => String(n.id));
  const unvisitedRoots = allIds.filter(id => !visited.has(id)).sort(compareIds);
  let nextRootNum = roots.length;
  for (const id of unvisitedRoots) {
    if (visited.has(id)) continue;
    nextRootNum += 1;
    assignSubtree(id, String(nextRootNum));
  }

  // Build final nodes with recalculated IDs and updated references
  const updated = nodes.map(n => {
    const oldId = String(n.id);
    const newId = idMapping.get(oldId);
    if (!newId) {
      throw new Error(`Failed to assign new ID for node ${oldId}`);
    }
    return {
      id: newId,
      title: n.title,
      body: n.body,
      choices: (n.choices || []).map(c => {
        const oldTo = String(c.to);
        const mappedTo = idMapping.get(oldTo) || oldTo;
        return {
          label: c.label,
          to: mappedTo
        };
      })
    };
  });

  updated.sort((a, b) => compareIds(a.id, b.id));
  return updated;
}
