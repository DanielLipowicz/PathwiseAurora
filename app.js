// --- Referencje do elementów DOM ---
const els = {
  title: document.getElementById('graphTitle'),
  nodeList: document.getElementById('nodeList'),
  tilesView: document.getElementById('tilesView'),
  tilesContainer: document.getElementById('tilesContainer'),
  connectionsSvg: document.getElementById('connectionsSvg'),
  filter: document.getElementById('filterInput'),
  clearFilter: document.getElementById('btnClearFilter'),
  importFile: document.getElementById('importFile'),
  btnImport: document.getElementById('btnImport'),
  btnExport: document.getElementById('btnExport'),
  btnExportSession: document.getElementById('btnExportSession'),
  btnNewNode: document.getElementById('btnNewNode'),
  btnNewSession: document.getElementById('btnNewSession'),
  btnViewList: document.getElementById('btnViewList'),
  btnViewTiles: document.getElementById('btnViewTiles'),
  startSelect: document.getElementById('startSelect'),
  btnStart: document.getElementById('btnStart'),
  runnerNodeId: document.getElementById('runnerNodeId'),
  btnJump: document.getElementById('btnJump'),
  btnBack: document.getElementById('btnBack'),
  btnReset: document.getElementById('btnReset'),
  runnerView: document.getElementById('runnerView'),
  history: document.getElementById('history'),
  validationBadge: document.getElementById('validationBadge'),
};

// --- Eventy UI ---
els.title.addEventListener('input', () => { graph.title = els.title.textContent.trim(); saveLocal(); });
els.btnNewNode.onclick = () => { graph.nodes.push({ id: nextId(), title:'New Node', body:'Description…', choices:[] }); saveLocal(); renderAll(); validateGraph(); };
els.btnExport.onclick = exportJson;
els.btnExportSession.onclick = exportSession;
els.btnNewSession.onclick = newSession;
els.btnImport.onclick = () => els.importFile.click();
els.importFile.onchange = (e) => { const f = e.target.files[0]; if (f) importJson(f); e.target.value=''; };
els.filter.addEventListener('input', () => { 
  renderNodeList(); 
  if (currentView === 'tiles') renderTilesView(); 
});
els.clearFilter.onclick = () => { 
  els.filter.value=''; 
  renderNodeList(); 
  if (currentView === 'tiles') renderTilesView(); 
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { els.filter.value=''; renderNodeList(); }
  if (e.key === 'ArrowLeft' && !e.ctrlKey) { back(); }
  if (e.key === 'ArrowRight' && !e.ctrlKey) {
    const n = byId(session.currentNodeId); if (n && n.choices[0]) advance(n.choices[0].to);
  }
  // Nawigacja między siblings: Ctrl+ArrowLeft/Right
  if (e.key === 'ArrowLeft' && e.ctrlKey) {
    const n = byId(session.currentNodeId);
    if (n) {
      const prevSibling = getPrevSibling(n.id);
      if (prevSibling) advance(prevSibling);
    }
  }
  if (e.key === 'ArrowRight' && e.ctrlKey) {
    const n = byId(session.currentNodeId);
    if (n) {
      const nextSibling = getNextSibling(n.id);
      if (nextSibling) advance(nextSibling);
    }
  }
});
els.btnStart.onclick = () => startAt(String(els.startSelect.value));
els.btnJump.onclick = () => startAt(String(els.runnerNodeId.value));
els.btnBack.onclick = back;
els.btnReset.onclick = resetSession;

// View switcher
var currentView = 'list'; // Global variable for view state
els.btnViewList.onclick = () => {
  currentView = 'list';
  els.nodeList.classList.remove('hidden');
  els.tilesView.classList.add('hidden');
  els.btnViewList.classList.add('active');
  els.btnViewTiles.classList.remove('active');
  renderNodeList();
};
els.btnViewTiles.onclick = () => {
  currentView = 'tiles';
  els.nodeList.classList.add('hidden');
  els.tilesView.classList.remove('hidden');
  els.btnViewList.classList.remove('active');
  els.btnViewTiles.classList.add('active');
  renderTilesView();
};

// --- Resize handle functionality ---
(function initResize() {
  const handle = document.getElementById('resizeHandle');
  const container = document.querySelector('.container');
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  // Load saved width from localStorage
  const savedWidth = localStorage.getItem('sidebarWidth');
  if (savedWidth) {
    document.documentElement.style.setProperty('--sidebar-width', savedWidth + 'px');
  }

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    const currentWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
    startWidth = parseInt(currentWidth) || 420;
    handle.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const diff = e.clientX - startX;
    const newWidth = Math.max(300, Math.min(800, startWidth + diff)); // Min 300px, max 800px
    document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
    localStorage.setItem('sidebarWidth', newWidth);
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      handle.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
})();

// --- Boot ---
(function boot(){
  const saved = loadLocal();
  if (saved && saved.graph && Array.isArray(saved.graph.nodes)) { graph = saved.graph; session = saved.session || session; }
  else { seedIfEmpty(); }
  
  // Sprawdź parametr URL przy starcie
  const urlParams = new URLSearchParams(window.location.search);
  const nodeIdFromUrl = urlParams.get('node');
  if (nodeIdFromUrl) {
    const id = String(nodeIdFromUrl);
    const node = byId(id);
    if (node) {
      session.currentNodeId = id;
      // Historia się tylko rozszerza - dodaj nowy wpis jeśli węzeł nie jest ostatnim w historii
      const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
      if (!lastEntry || String(lastEntry.id) !== String(id)) {
        // Dodaj nowy wpis do historii tylko jeśli to inny węzeł niż ostatni
        const historyEntry = { id: node.id, title: node.title, body: node.body, comment: '' };
        session.history = session.history.length > 0 ? [...session.history, historyEntry] : [historyEntry];
      }
      saveLocal();
    }
  }
  
  // Zaktualizuj URL bez dodawania do historii (replaceState)
  if (session.currentNodeId) {
    const url = new URL(window.location);
    url.searchParams.set('node', String(session.currentNodeId));
    history.replaceState({ nodeId: session.currentNodeId }, '', url);
  }
  
  renderAll();
})();

