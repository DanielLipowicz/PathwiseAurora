/**
 * Confluence Export Generator
 * Generates Confluence markup format from graph data
 */

/**
 * Generate Confluence markup from graph
 * @param {Object} graph - Graph object with title and nodes
 * @returns {string} Generated Confluence markup
 */
export function generateConfluenceExport(graph) {
  if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) {
    throw new Error('Invalid graph data: missing nodes');
  }

  const lines = [];

  // Header
  const title = graph.title || 'Untitled Process';
  lines.push(`h1. ${escapeConfluenceTitle(title)}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('');

  // Sort nodes by ID (convert to comparable format for numeric and string IDs)
  const sortedNodes = [...graph.nodes].sort((a, b) => {
    const idA = String(a.id);
    const idB = String(b.id);
    // Try numeric comparison first
    const numA = parseFloat(idA);
    const numB = parseFloat(idB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    // Otherwise string comparison
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Generate each step
  sortedNodes.forEach((node) => {
    const nodeId = String(node.id);
    const nodeTitle = node.title || 'Untitled Step';
    const nodeBody = node.body || '';

    // Step header with anchor
    lines.push(`h2. Step ${nodeId}: ${escapeConfluenceTitle(nodeTitle)}`);
    lines.push('');
    lines.push(`{anchor:step${nodeId}}`);
    lines.push('');

    // Description
    lines.push('Description:');
    lines.push('');
    if (nodeBody.trim()) {
      // Preserve line breaks in body
      const bodyLines = nodeBody.trim().split('\n');
      bodyLines.forEach(line => {
        lines.push(line);
      });
    } else {
      lines.push('(No description)');
    }
    lines.push('');

    // Options/Choices
    if (node.choices && Array.isArray(node.choices) && node.choices.length > 0) {
      lines.push('Options:');
      lines.push('');
      node.choices.forEach((choice) => {
        const choiceLabel = choice.label || '';
        const targetId = String(choice.to);
        // Create link to target step anchor
        lines.push(`* ${escapeConfluenceText(choiceLabel)} → [Step ${targetId}|#step${targetId}]`);
      });
    } else {
      lines.push('Options:');
      lines.push('');
      lines.push('(No options)');
    }

    lines.push('');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Escape Confluence title text (basic escaping for special characters)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeConfluenceTitle(text) {
  if (!text) return '';
  // Confluence titles generally don't need much escaping, but we'll handle special cases
  return String(text).trim();
}

/**
 * Escape Confluence text content
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeConfluenceText(text) {
  if (!text) return '';
  // Basic escaping - Confluence handles most text naturally, but pipe characters need escaping in some contexts
  return String(text).replace(/\|/g, '\\|');
}

