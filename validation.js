// --- Walidacja ---
function validateGraph() {
  const ids = new Set(graph.nodes.map(n => String(n.id)));
  let ok = true; let messages = [];
  // duplikaty id
  if (ids.size !== graph.nodes.length) { ok = false; messages.push('Duplicate IDs'); }
  // empty title/content
  for (const n of graph.nodes) {
    if (!n.title?.trim() || !n.body?.trim()) { ok = false; messages.push(`Empty fields in #${n.id}`); }
    for (const c of n.choices) {
      if (!c.label?.trim()) { ok = false; messages.push(`Empty label in #${n.id}`); }
      if (!ids.has(String(c.to))) { ok = false; messages.push(`Missing target ${c.to} from #${n.id}`); }
    }
  }
  els.validationBadge.textContent = ok ? 'Validation: OK' : 'Validation: ' + [...new Set(messages)].slice(0,3).join(', ') + (messages.length>3?'…':'');
  els.validationBadge.className = 'badge ' + (ok ? 'ok' : 'danger');
  return ok;
}

