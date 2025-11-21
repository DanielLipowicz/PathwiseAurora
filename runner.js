// --- Akcje runnera ---
function updateUrl(nodeId, replaceState = false) {
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

function startAt(id) {
  if (!byId(id)) return;
  const node = byId(id);
  if (!node) return;
  session.currentNodeId = id;
  
  // Historia się tylko rozszerza - dodaj nowy wpis jeśli węzeł nie jest ostatnim w historii
  const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
  if (!lastEntry || String(lastEntry.id) !== String(id)) {
    // Dodaj nowy wpis do historii tylko jeśli to inny węzeł niż ostatni
    session.history.push({ id: node.id, title: node.title, body: node.body, comment: '' });
  }
  
  saveLocal(); 
  updateUrl(id); 
  renderRunner();
}
function advance(toId) {
  if (!byId(toId)) return;
  const node = byId(toId);
  if (!node) return;
  session.currentNodeId = toId; 
  session.history.push({ id: node.id, title: node.title, body: node.body, comment: '' }); 
  saveLocal(); 
  updateUrl(toId); 
  renderRunner();
}
function back() {
  if (session.history.length <= 1) return;
  
  // Historia się nie skraca - tylko zmieniamy currentNodeId na poprzedni wpis
  const currentIdx = session.history.length - 1;
  if (currentIdx > 0) {
    const prevEntry = session.history[currentIdx - 1];
    session.currentNodeId = prevEntry ? prevEntry.id : null;
    saveLocal(); 
    updateUrl(session.currentNodeId); 
    renderRunner();
  }
}
function resetSession() {
  session = { currentNodeId: null, history: [] }; saveLocal(); updateUrl(null, true); renderRunner();
}

// Obsługa nawigacji przeglądarki (back/forward)
window.addEventListener('popstate', (event) => {
  const nodeId = event.state?.nodeId || new URL(window.location).searchParams.get('node');
  if (nodeId) {
    const id = String(nodeId);
    const node = byId(id);
    if (node) {
      // Historia się tylko rozszerza - jeśli węzeł nie jest w historii, dodaj go
      const historyEntry = { id: node.id, title: node.title, body: node.body, comment: '' };
      const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
      if (!lastEntry || String(lastEntry.id) !== String(id)) {
        // Dodaj nowy wpis tylko jeśli to inny węzeł niż ostatni
        session.history.push(historyEntry);
      }
      session.currentNodeId = id;
      saveLocal();
      renderRunner();
    }
  } else {
    // Nie resetuj historii, tylko ustaw currentNodeId na null
    session.currentNodeId = null;
    saveLocal();
    renderRunner();
  }
});

