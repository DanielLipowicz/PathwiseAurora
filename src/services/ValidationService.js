/**
 * Validation Service
 * Validates graph structure and returns validation results
 */

export class ValidationService {
  /**
   * Validate graph structure
   * @param {Object} graph - Graph object to validate
   * @returns {Object} Validation result with ok flag, messages, and emptyReferences
   */
  validate(graph) {
    const ids = new Set(graph.nodes.map(n => String(n.id)));
    let ok = true;
    let messages = [];
    const emptyReferences = []; // Reset empty references

    // Check for duplicate IDs
    if (ids.size !== graph.nodes.length) {
      ok = false;
      messages.push('Duplicate IDs');
    }

    // Check for empty title/content and invalid choices
    for (const n of graph.nodes) {
      if (!n.title?.trim() || !n.body?.trim()) {
        ok = false;
        messages.push(`Empty fields in #${n.id}`);
      }
      for (const c of n.choices) {
        if (!c.label?.trim()) {
          ok = false;
          messages.push(`Empty label in #${n.id}`);
        }
        if (!c.to || !String(c.to).trim()) {
          // Empty reference (no target specified)
          emptyReferences.push({
            nodeId: n.id,
            nodeTitle: n.title,
            choiceLabel: c.label || '(no label)'
          });
          ok = false;
          messages.push(`Empty reference in #${n.id}`);
        } else if (!ids.has(String(c.to))) {
          // Missing target (target specified but doesn't exist)
          emptyReferences.push({
            nodeId: n.id,
            nodeTitle: n.title,
            choiceLabel: c.label || '(no label)',
            targetId: String(c.to)
          });
          ok = false;
          messages.push(`Missing target ${c.to} from #${n.id}`);
        }
      }
    }

    return {
      ok,
      messages: [...new Set(messages)],
      emptyReferences
    };
  }
}

