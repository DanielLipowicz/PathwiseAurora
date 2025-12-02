/**
 * Email Summary Generator
 * Generates email summaries from session exports in text or HTML format
 */

/**
 * Generate email summary from session export data
 * @param {Object} data - Session export data with graph, session, exportDate, exportType
 * @param {string} format - Format: 'text' or 'html'
 * @returns {string} Generated email summary
 */
export function generateEmailSummary(data, format = 'text') {
  if (!data || data.exportType !== 'session') {
    throw new Error('Invalid data: exportType must be "session"');
  }

  const { graph, session, exportDate } = data;

  if (!graph || !session || !session.history || session.history.length === 0) {
    throw new Error('Invalid data: missing graph, session, or history');
  }

  const history = session.history;
  const startNode = history[0];
  const endNodeId = session.currentNodeId;
  
  // Find end node title from history or graph
  let endNodeTitle = '';
  const endNodeInHistory = history.find(h => String(h.id) === String(endNodeId));
  if (endNodeInHistory) {
    endNodeTitle = endNodeInHistory.title || '';
  } else if (graph.nodes) {
    const endNodeFromGraph = graph.nodes.find(n => String(n.id) === String(endNodeId));
    if (endNodeFromGraph) {
      endNodeTitle = endNodeFromGraph.title || '';
    }
  }

  if (format === 'html') {
    return generateHtmlSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history);
  } else {
    return generateTextSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history);
  }
}

/**
 * Generate plain text summary
 */
function generateTextSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history) {
  const lines = [];

  // Subject line
  const graphTitle = graph.title || 'Untitled Session';
  lines.push(`Subject: Summary – ${graphTitle}`);
  lines.push('');
  lines.push('');

  // Header
  lines.push('Incident / flow title:');
  lines.push(graphTitle);
  lines.push('');
  lines.push(`Export date (UTC):`);
  lines.push(exportDate || new Date().toISOString());
  lines.push('');
  lines.push('Session start:');
  lines.push(`Node #${startNode.id} – ${startNode.title || ''}`);
  lines.push('');
  lines.push('Session end:');
  lines.push(`Node #${endNodeId} – ${endNodeTitle}`);
  lines.push('');
  lines.push('');
  lines.push('===== Session Steps =====');
  lines.push('');

  // Steps
  history.forEach((entry, index) => {
    const stepNum = index + 1;
    lines.push(`Step ${stepNum}`);
    lines.push(`Node: #${entry.id} – ${entry.title || ''}`);
    
    if (entry.selectedChoice && entry.selectedChoice.trim()) {
      lines.push("Path:');
      lines.push(`  ${entry.selectedChoice.trim()}`);
      lines.push('');
    }
    
    lines.push('What happened:');
    if (entry.body && entry.body.trim()) {
      lines.push(`  ${entry.body.trim()}`);
    } else {
      lines.push('  (No description)');
    }
    lines.push('');

    if (entry.comment && entry.comment.trim()) {
      lines.push('Comment:');
      lines.push(`  ${entry.comment.trim()}`);
      lines.push('');
    }

    if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
      const tagsStr = entry.tags.filter(t => t && t.trim()).join(', ');
      if (tagsStr) {
        lines.push('Tags:');
        lines.push(`  ${tagsStr}`);
        lines.push('');
      }
    }
  });

  lines.push('');
  lines.push('===== Session Summary =====');
  lines.push('');
  lines.push(`The session started at node #${startNode.id} – "${startNode.title || ''}"`);
  lines.push(`and concluded at node #${endNodeId} – "${endNodeTitle}".`);
  lines.push('');
  lines.push('');
  lines.push('Next recommended actions:');
  lines.push('- ...');
  lines.push('- ...');

  return lines.join('\n');
}

/**
 * Generate HTML summary
 */
function generateHtmlSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history) {
  const parts = [];

  const graphTitle = graph.title || 'Untitled Session';
  const exportDateStr = exportDate || new Date().toISOString();

  // Header
  parts.push(`<h1>Summary – ${escapeHtml(graphTitle)}</h1>`);
  parts.push('');
  parts.push(`<p><strong>Export date (UTC):</strong> ${escapeHtml(exportDateStr)}</p>`);
  parts.push(`<p><strong>Session start:</strong> #${escapeHtml(String(startNode.id))} – ${escapeHtml(startNode.title || '')}</p>`);
  parts.push(`<p><strong>Session end:</strong> #${escapeHtml(String(endNodeId))} – ${escapeHtml(endNodeTitle)}</p>`);
  parts.push('');
  parts.push('<hr />');
  parts.push('');

  // Steps
  parts.push('<h2>Session Steps</h2>');
  parts.push('<ol>');

  history.forEach((entry, index) => {
    const stepNum = index + 1;
    parts.push('  <li>');
    parts.push(`    <h3>Step ${stepNum} – #${escapeHtml(String(entry.id))} – ${escapeHtml(entry.title || '')}</h3>`);
    
    if (entry.selectedChoice && entry.selectedChoice.trim()) {
      parts.push(`    <p><strong>Selected path:</strong> ${escapeHtml(entry.selectedChoice.trim())}</p>`);
    }
    
    if (entry.body && entry.body.trim()) {
      parts.push(`    <p><strong>What happened:</strong><br />`);
      parts.push(`    ${escapeHtml(entry.body.trim()).replace(/\n/g, '<br />')}</p>`);
    } else {
      parts.push(`    <p><strong>What happened:</strong><br />`);
      parts.push(`    (No description)</p>`);
    }

    if (entry.comment && entry.comment.trim()) {
      parts.push(`    <p><strong>Comment:</strong> ${escapeHtml(entry.comment.trim())}</p>`);
    }

    if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
      const tagsStr = entry.tags.filter(t => t && t.trim()).map(t => escapeHtml(t.trim())).join(', ');
      if (tagsStr) {
        parts.push(`    <p><strong>Tags:</strong> ${tagsStr}</p>`);
      }
    }

    parts.push('  </li>');
  });

  parts.push('</ol>');
  parts.push('');
  parts.push('<hr />');
  parts.push('');

  // Summary
  parts.push('<h2>Session Summary</h2>');
  parts.push('<p>');
  parts.push(`  The session started at node #${escapeHtml(String(startNode.id))} – "${escapeHtml(startNode.title || '')}"`);
  parts.push(`  and concluded at node #${escapeHtml(String(endNodeId))} – "${escapeHtml(endNodeTitle)}".`);
  parts.push('</p>');
  parts.push('');
  parts.push('<p><strong>Next recommended actions:</strong></p>');
  parts.push('<ul>');
  parts.push('  <li>...</li>');
  parts.push('  <li>...</li>');
  parts.push('</ul>');

  return parts.join('\n');
}

/**
 * Escape HTML special characters
 * @param {string} s - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

