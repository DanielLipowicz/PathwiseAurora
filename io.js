// --- Import/Export ---
function exportJson() { 
  const filename = `${(graph.title||'graph').replace(/\s+/g,'_')}.json`;
  download(filename, renderJson(true)); 
}
function exportSession() {
  if (!session || !session.history || session.history.length === 0) {
    alert('No session flow to save.');
    return;
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `session_flow_${timestamp}.json`;
  const sessionData = {
    graph: graph,
    session: session,
    exportDate: new Date().toISOString(),
    exportType: 'session'
  };
  download(filename, JSON.stringify(sessionData, null, 2));
}
function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      
      // Obsługa nowego formatu z historią (graph + session) lub starego formatu (tylko graph)
      let graphData, sessionData;
      
      if (data.graph && Array.isArray(data.graph.nodes)) {
        // Nowy format: { graph: {...}, session: {...} }
        graphData = data.graph;
        sessionData = data.session;
      } else if (Array.isArray(data.nodes)) {
        // Stary format: tylko graph
        graphData = data;
        sessionData = null;
      } else {
        throw new Error('Invalid format');
      }
      
      if (!graphData || !Array.isArray(graphData.nodes)) throw new Error('Invalid format');
      
      // Konwertuj ID na stringi (obsługuje zarówno number jak i string)
      graph = { 
        title: String(graphData.title||'Graph'), 
        nodes: graphData.nodes.map(n => ({ 
          id: String(n.id), 
          title: String(n.title||''), 
          body: String(n.body||''), 
          choices: Array.isArray(n.choices)? n.choices.map(c=>({
            label: String(c.label||''), 
            to: String(c.to)
          })) : [] 
        })) 
      };
      
      // Przywróć sesję jeśli była w eksporcie, w przeciwnym razie ustaw domyślną
      if (sessionData && Array.isArray(sessionData.history)) {
        // Migruj historię jeśli potrzeba (obsługa starego formatu w historii)
        const firstItem = sessionData.history[0];
        if (typeof firstItem === 'string' || typeof firstItem === 'number') {
          // Stary format historii - użyj funkcji migracji
          const migrateHistory = (oldHistory, graphData) => {
            if (!oldHistory || !Array.isArray(oldHistory)) return [];
            if (!graphData || !Array.isArray(graphData.nodes)) return [];
            const findNodeById = (id) => graphData.nodes.find(n => String(n.id) === String(id)) || null;
            return oldHistory.map(id => {
              const node = findNodeById(id);
              if (node) {
                return { id: node.id, title: node.title, body: node.body, comment: '' };
              }
              return { id: String(id), title: `#${id}`, body: '', comment: '' };
            }).filter(entry => entry !== null);
          };
          sessionData.history = migrateHistory(sessionData.history, graph);
        }
        session = {
          currentNodeId: sessionData.currentNodeId ?? null,
          history: sessionData.history
        };
      } else {
        // Brak sesji w eksporcie - ustaw domyślną
        const firstNode = graph.nodes[0];
        session = { 
          currentNodeId: firstNode?.id ?? null, 
          history: firstNode ? [{ id: firstNode.id, title: firstNode.title, body: firstNode.body, comment: '' }] : [] 
        };
      }
      
      saveLocal(); renderAll();
    } catch (e) { alert('Import error: ' + e.message); }
  };
  reader.readAsText(file);
}

