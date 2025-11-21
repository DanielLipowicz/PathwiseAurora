// --- RENDER: lista węzłów ---
function renderNodeList() {
  const tpl = document.getElementById('nodeItemTpl');
  const choiceTpl = document.getElementById('choiceRowTpl');
  els.nodeList.innerHTML = '';
  const q = els.filter.value.toLowerCase();
  const nodes = [...graph.nodes].sort((a,b)=>compareIds(a.id, b.id)).filter(n => (
    !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  ));

  for (const node of nodes) {
    const item = tpl.content.firstElementChild.cloneNode(true);
    const nidEl = item.querySelector('.nid');
    nidEl.textContent = node.id;
    
    // Wizualne wcięcie dla zagnieżdżonych węzłów
    const depth = (String(node.id).match(/\./g) || []).length;
    if (depth > 0) {
      item.style.paddingLeft = `${depth * 20}px`;
      item.style.borderLeft = `3px solid #${['ddd', 'ccc', 'bbb'][Math.min(depth - 1, 2)]}`;
    }
    
    if (String(session.currentNodeId) === String(node.id)) item.classList.add('active');
    const title = item.querySelector('.ntitle');
    const body = item.querySelector('.nbody');
    const choicesWrap = item.querySelector('.choices');
    const warnTargets = item.querySelector('.warn-targets');
    const warnEmpty = item.querySelector('.warn-empty');

    title.value = node.title; body.value = node.body;
    
    // Funkcja do aktualizacji lokalnych badge'y walidacji
    const updateLocalBadges = () => {
      const ids = new Set(graph.nodes.map(n=>String(n.id)));
      let missing = false;
      // Sprawdź wartości bezpośrednio z pól input
      let empty = (!title.value.trim() || !body.value.trim());
      
      // Sprawdź wszystkie wybory - sprawdź wartości bezpośrednio z pól input
      const choiceRows = choicesWrap.querySelectorAll('.choice-row');
      choiceRows.forEach(row => {
        const cLabel = row.querySelector('.clabel');
        const cTo = row.querySelector('.cto');
        if (cLabel && !cLabel.value.trim()) empty = true;
        if (cTo && !ids.has(String(cTo.value))) missing = true;
      });
      
      warnTargets.classList.toggle('hidden', !missing);
      warnEmpty.classList.toggle('hidden', !empty);
    };
    
    title.oninput = () => { node.title = title.value; saveLocal(); renderRunner(); validateGraph(); updateLocalBadges(); };
    body.oninput = () => { node.body = body.value; saveLocal(); renderRunner(); validateGraph(); updateLocalBadges(); };

    // Choices
    choicesWrap.innerHTML = '';
    const ids = new Set(graph.nodes.map(n=>String(n.id)));
    let missing = false; let empty = (!node.title.trim() || !node.body.trim());
    node.choices.forEach((ch, idx) => {
      const cRow = choiceTpl.content.firstElementChild.cloneNode(true);
      const cLabel = cRow.querySelector('.clabel');
      const cTo = cRow.querySelector('.cto');
      const btnRem = cRow.querySelector('.btnRemChoice');
      cLabel.value = ch.label; cTo.value = ch.to;
      if (!ids.has(String(ch.to))) missing = true;
      if (!ch.label.trim()) empty = true;
      cLabel.oninput = () => { ch.label = cLabel.value; saveLocal(); renderRunner(); validateGraph(); updateLocalBadges(); };
      cTo.oninput = () => { ch.to = String(cTo.value); saveLocal(); renderRunner(); validateGraph(); updateLocalBadges(); };
      btnRem.onclick = () => { node.choices.splice(idx,1); saveLocal(); renderNodeList(); renderRunner(); validateGraph(); };
      choicesWrap.appendChild(cRow);
    });

    warnTargets.classList.toggle('hidden', !missing);
    warnEmpty.classList.toggle('hidden', !empty);

    item.querySelector('.btnAddChoice').onclick = () => {
      node.choices.push({ label:'', to: String(graph.nodes[0]?.id ?? '1') });
      saveLocal(); renderNodeList(); validateGraph();
      // updateLocalBadges zostanie wywołane przez renderNodeList, ale dla pewności możemy też wywołać tutaj
      // jednak renderNodeList już renderuje wszystko od nowa, więc nie jest potrzebne
    };
    item.querySelector('.btnDelete').onclick = () => {
      if (!confirm(`Delete node #${node.id}? This will remove references.`)) return;
      // Usuń referencje do tego węzła
      graph.nodes.forEach(n => n.choices = n.choices.filter(c => String(c.to) !== String(node.id)));
      // Usuń sam węzeł i wszystkie jego dzieci
      const nodeIdStr = String(node.id);
      graph.nodes = graph.nodes.filter(n => {
        const nIdStr = String(n.id);
        return nIdStr !== nodeIdStr && !nIdStr.startsWith(nodeIdStr + '.');
      });
      // Sesja – jeśli był aktualny, zresetuj
      if (String(session.currentNodeId) === String(node.id)) { session.currentNodeId = null; session.history = []; }
      saveLocal(); renderAll();
    };
    item.querySelector('.btnClone').onclick = () => {
      const clone = JSON.parse(JSON.stringify(node));
      clone.id = nextId();
      // Reset choices IDs to prevent invalid references
      clone.choices = clone.choices.map(c => ({ ...c, to: String(c.to) }));
      graph.nodes.push(clone);
      saveLocal(); renderAll();
    };

    item.querySelector('.btnAddChild').onclick = () => {
      const childId = nextChildId(String(node.id));
      const child = { 
        id: childId, 
        title: 'New Child Node', 
        body: 'Description…', 
        choices: [] 
      };
      graph.nodes.push(child);
      // Automatically add a choice from parent to the new child
      node.choices.push({ label: '', to: String(childId) });
      saveLocal(); renderAll();
      // Scroll to the newly added child element
      setTimeout(() => {
        const childElement = Array.from(els.nodeList.querySelectorAll('.node-item')).find(item => {
          const nidEl = item.querySelector('.nid');
          return nidEl && nidEl.textContent === String(childId);
        });
        if (childElement) {
          childElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    };

    els.nodeList.appendChild(item);
  }
}

// --- RENDER: runner ---
function renderRunner() {
  const view = els.runnerView; view.innerHTML = '';
  // Select options
  els.startSelect.innerHTML = graph.nodes.sort((a,b)=>compareIds(a.id, b.id)).map(n => `<option value="${n.id}">#${n.id} · ${escapeHtml(n.title)}</option>`).join('');
  els.runnerNodeId.value = session.currentNodeId ?? '';

  const node = byId(session.currentNodeId);
  if (!node) {
    view.innerHTML = `<div class="muted">No node selected. Select Start and click <b>Start</b> or enter ID and click <b>Go</b>.</div>`;
    renderHistory();
    return;
  }
  // Wyświetl parent node jeśli istnieje
  const parentId = getParentId(node.id);
  if (parentId) {
    const parent = byId(parentId);
    if (parent) {
      const parentLink = document.createElement('div');
      parentLink.className = 'muted';
      parentLink.style.marginBottom = '8px';
      parentLink.style.fontSize = '0.9em';
      parentLink.innerHTML = `↑ Parent: <a href="#" style="text-decoration: underline; cursor: pointer;">#${parentId} · ${escapeHtml(parent.title)}</a>`;
      parentLink.querySelector('a').onclick = (e) => {
        e.preventDefault();
        advance(parentId);
      };
      view.appendChild(parentLink);
    }
  }
  
  const h2 = document.createElement('h2'); h2.textContent = `#${node.id} · ${node.title}`; view.appendChild(h2);
  const p = document.createElement('div'); p.innerText = node.body; view.appendChild(p);

  // Nawigacja między siblings
  const siblings = getSiblings(node.id);
  const sortedSiblings = siblings.sort((a, b) => compareIds(a.id, b.id));
  const currentIdx = sortedSiblings.findIndex(n => String(n.id) === String(node.id));
  const hasSiblings = sortedSiblings.length > 1;
  
  if (hasSiblings) {
    const navArea = document.createElement('div');
    navArea.className = 'row';
    navArea.style.marginTop = '12px';
    navArea.style.gap = '6px';
    navArea.style.alignItems = 'center';
    
    const prevSibling = currentIdx > 0 ? sortedSiblings[currentIdx - 1] : null;
    const nextSibling = currentIdx < sortedSiblings.length - 1 ? sortedSiblings[currentIdx + 1] : null;
    
    if (prevSibling) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = `← #${prevSibling.id}`;
      prevBtn.className = 'ghost';
      prevBtn.onclick = () => advance(prevSibling.id);
      navArea.appendChild(prevBtn);
    }
    
    const siblingInfo = document.createElement('span');
    siblingInfo.className = 'muted';
    siblingInfo.textContent = `${currentIdx + 1} / ${sortedSiblings.length}`;
    navArea.appendChild(siblingInfo);
    
    if (nextSibling) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = `#${nextSibling.id} →`;
      nextBtn.className = 'ghost';
      nextBtn.onclick = () => advance(nextSibling.id);
      navArea.appendChild(nextBtn);
    }
    
    view.appendChild(navArea);
  }

  const area = document.createElement('div'); area.className = 'col'; area.style.marginTop = '8px';
  if (node.choices.length === 0) {
    const end = document.createElement('div'); end.innerHTML = `<span class="badge ok">End of path</span>`; area.appendChild(end);
  } else {
    for (const ch of node.choices) {
      const btn = document.createElement('button');
      btn.textContent = `${ch.label || '(no label)'} → #${ch.to}`;
      const targetExists = !!byId(String(ch.to));
      if (!targetExists) { btn.disabled = true; btn.title = 'Target node does not exist'; btn.classList.add('warn'); }
      btn.onclick = () => advance(ch.to);
      area.appendChild(btn);
    }
  }
  view.appendChild(area);

  // Sekcja komentarzy do kroku
  const commentDivider = document.createElement('div');
  commentDivider.className = 'divider';
  commentDivider.style.marginTop = '16px';
  commentDivider.style.marginBottom = '12px';
  view.appendChild(commentDivider);

  const commentLabel = document.createElement('label');
  commentLabel.className = 'muted';
  commentLabel.style.marginBottom = '6px';
  commentLabel.textContent = 'Step Comment';
  view.appendChild(commentLabel);

  // Komentarz jest powiązany z aktualnym krokiem w historii (wpis odpowiadający currentNodeId), nie z węzłem
  // Znajdź ostatni wpis w historii, który odpowiada aktualnemu węzłowi
  let currentHistoryEntry = null;
  if (session.currentNodeId && session.history.length > 0) {
    // Szukaj od końca, aby znaleźć ostatni wpis z tym ID
    for (let i = session.history.length - 1; i >= 0; i--) {
      if (String(session.history[i].id) === String(session.currentNodeId)) {
        currentHistoryEntry = session.history[i];
        break;
      }
    }
  }
  
  const commentTextarea = document.createElement('textarea');
  commentTextarea.placeholder = 'Add a comment to this step...';
  commentTextarea.rows = 3;
  commentTextarea.value = currentHistoryEntry?.comment || '';
  commentTextarea.style.width = '100%';
  commentTextarea.style.resize = 'vertical';
  commentTextarea.oninput = () => {
    if (currentHistoryEntry) {
      currentHistoryEntry.comment = commentTextarea.value;
      saveLocal();
      renderHistory();
    } else if (session.currentNodeId && session.history.length > 0) {
      // Jeśli nie ma wpisu dla tego węzła, ale jest currentNodeId, dodaj nowy wpis do historii
      const node = byId(session.currentNodeId);
      if (node) {
        const newEntry = { id: node.id, title: node.title, body: node.body, comment: commentTextarea.value };
        session.history.push(newEntry);
        currentHistoryEntry = newEntry;
        saveLocal();
        renderHistory();
      }
    }
  };
  view.appendChild(commentTextarea);

  // Sekcja dodawania opcji decyzji
  const decisionDivider = document.createElement('div');
  decisionDivider.className = 'divider';
  decisionDivider.style.marginTop = '16px';
  decisionDivider.style.marginBottom = '12px';
  view.appendChild(decisionDivider);

  const decisionLabel = document.createElement('label');
  decisionLabel.className = 'muted';
  decisionLabel.style.marginBottom = '6px';
  decisionLabel.textContent = 'Add Decision Option';
  view.appendChild(decisionLabel);

  const decisionForm = document.createElement('div');
  decisionForm.className = 'col';
  decisionForm.style.gap = '8px';

  const decisionLabelInput = document.createElement('input');
  decisionLabelInput.type = 'text';
  decisionLabelInput.placeholder = 'Label (e.g. positive)';
  decisionLabelInput.style.width = '100%';
  decisionForm.appendChild(decisionLabelInput);

  const decisionToRow = document.createElement('div');
  decisionToRow.className = 'row';
  decisionToRow.style.gap = '8px';
  decisionToRow.style.alignItems = 'center';

  const decisionToInput = document.createElement('input');
  decisionToInput.type = 'text';
  decisionToInput.placeholder = 'Do # (np. 1.1)';
  decisionToInput.style.flex = '1';
  decisionToRow.appendChild(decisionToInput);

  const decisionAddBtn = document.createElement('button');
  decisionAddBtn.textContent = 'Add';
  decisionAddBtn.className = 'primary';
  decisionAddBtn.onclick = () => {
    const label = decisionLabelInput.value.trim();
    const to = decisionToInput.value.trim();
    if (!label || !to) {
      alert('Fill in label and target');
      return;
    }
    // Sprawdź czy węzeł docelowy istnieje
    if (!byId(to)) {
      if (!confirm(`Node #${to} does not exist. Do you want to add the option anyway?`)) {
        return;
      }
    }
    node.choices.push({ label, to: String(to) });
    decisionLabelInput.value = '';
    decisionToInput.value = '';
    saveLocal();
    renderRunner();
    validateGraph();
  };
  decisionToRow.appendChild(decisionAddBtn);
  decisionForm.appendChild(decisionToRow);
  view.appendChild(decisionForm);

  renderHistory();
  // Aktualizuj widok kafelkowy jeśli jest aktywny
  if (typeof currentView !== 'undefined' && currentView === 'tiles') {
    renderTilesView();
  }
}

function renderHistory() {
  els.history.innerHTML = '';
  for (let i = 0; i < session.history.length; i++) {
    const entry = session.history[i];
    // Support both old format (string/number) and new format (object)
    const entryId = (typeof entry === 'object' && entry !== null) ? entry.id : entry;
    const entryTitle = (typeof entry === 'object' && entry !== null) ? (entry.title || '') : '';
    const entryBody = (typeof entry === 'object' && entry !== null) ? (entry.body || '') : '';
    const entryComment = (typeof entry === 'object' && entry !== null) ? (entry.comment || '') : '';
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    if (String(entryId) === String(session.currentNodeId)) {
      historyItem.classList.add('active');
    }
    
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = `#${entryId}`;
    
    const content = document.createElement('div');
    content.className = 'history-content';
    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = entryTitle || `#${entryId}`;
    const body = document.createElement('div');
    body.className = 'history-body';
    body.textContent = entryBody || '';
    
    content.appendChild(title);
    if (entryBody) {
      content.appendChild(body);
    }
    
    // Dodaj komentarz jeśli istnieje
    if (entryComment) {
      const comment = document.createElement('div');
      comment.className = 'history-comment';
      comment.textContent = entryComment;
      content.appendChild(comment);
    }
    
    // Przycisk usuwania
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Remove this step from history';
    deleteBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent clicking on historyItem
      if (!confirm(`Remove step #${entryId} from history?`)) return;
      
      // Znajdź indeks wpisu do usunięcia
      const idx = session.history.findIndex(h => {
        const hId = h.id || h;
        return String(hId) === String(entryId);
      });
      
      if (idx === -1) return; // Wpis nie znaleziony
      
      const wasCurrent = String(entryId) === String(session.currentNodeId);
      session.history.splice(idx, 1);
      
      // Jeśli usunięty wpis był aktualnym, zaktualizuj currentNodeId
      if (wasCurrent) {
        if (session.history.length > 0) {
          // Ustaw na poprzedni wpis (lub ostatni jeśli usunięty był ostatni)
          const newIdx = Math.min(idx - 1, session.history.length - 1);
          if (newIdx >= 0 && newIdx < session.history.length) {
            session.currentNodeId = session.history[newIdx].id;
          } else if (session.history.length > 0) {
            session.currentNodeId = session.history[session.history.length - 1].id;
          } else {
            session.currentNodeId = null;
          }
        } else {
          session.currentNodeId = null;
        }
      }
      
      saveLocal();
      renderRunner();
    };
    
    historyItem.appendChild(pill);
    historyItem.appendChild(content);
    historyItem.appendChild(deleteBtn);
    
    historyItem.onclick = () => {
      // Historia się nie skraca - tylko zmieniamy currentNodeId na wybrany wpis
      const idx = session.history.findIndex(h => {
        const hId = h.id || h;
        return String(hId) === String(entryId);
      });
      if (idx >= 0) {
        session.currentNodeId = entryId;
        saveLocal();
        // Zaktualizuj URL - użyj pushState aby dodać do historii przeglądarki
        const url = new URL(window.location);
        url.searchParams.set('node', String(entryId));
        history.pushState({ nodeId: entryId }, '', url);
        renderRunner();
      }
    };
    
    els.history.appendChild(historyItem);
  }
}

// --- RENDER: widok kafelkowy ---
function renderTilesView() {
  const container = els.tilesContainer;
  const svg = els.connectionsSvg;
  container.innerHTML = '';
  svg.innerHTML = '';
  
  const q = els.filter.value.toLowerCase();
  const nodes = [...graph.nodes].sort((a,b)=>compareIds(a.id, b.id)).filter(n => (
    !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  ));

  // Utwórz kafelki dla każdego noda
  const tiles = [];
  const nodePositions = new Map();
  
  nodes.forEach((node, index) => {
    const tile = document.createElement('div');
    tile.className = 'node-tile';
    tile.dataset.nodeId = String(node.id);
    
    if (String(session.currentNodeId) === String(node.id)) {
      tile.classList.add('active');
    }
    
    const tileId = document.createElement('div');
    tileId.className = 'tile-id';
    tileId.textContent = `#${node.id}`;
    
    const tileTitle = document.createElement('div');
    tileTitle.className = 'tile-title';
    tileTitle.textContent = node.title || '(no title)';
    
    const tileBody = document.createElement('div');
    tileBody.className = 'tile-body';
    tileBody.textContent = node.body || '(no content)';
    
    const tileChoices = document.createElement('div');
    tileChoices.className = 'tile-choices';
    if (node.choices.length > 0) {
      node.choices.forEach(choice => {
        const choiceBadge = document.createElement('span');
        choiceBadge.className = 'choice-badge';
        choiceBadge.textContent = `${choice.label || '(no label)'} → #${choice.to}`;
        const targetExists = !!byId(String(choice.to));
        if (!targetExists) {
          choiceBadge.classList.add('invalid');
        }
        tileChoices.appendChild(choiceBadge);
      });
    } else {
      const endBadge = document.createElement('span');
      endBadge.className = 'choice-badge end';
      endBadge.textContent = 'End';
      tileChoices.appendChild(endBadge);
    }
    
    tile.appendChild(tileId);
    tile.appendChild(tileTitle);
    tile.appendChild(tileBody);
    tile.appendChild(tileChoices);
    
    container.appendChild(tile);
    tiles.push({ node, tile });
  });
  
  // Pozycjonowanie kafelków w siatce
  const tileWidth = 280;
  const tileHeight = 200;
  const padding = 20;
  const cols = Math.max(1, Math.floor((container.offsetWidth || 400) / (tileWidth + padding)));
  
  tiles.forEach((item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = col * (tileWidth + padding) + padding;
    const y = row * (tileHeight + padding) + padding;
    
    item.tile.style.position = 'absolute';
    item.tile.style.left = `${x}px`;
    item.tile.style.top = `${y}px`;
    item.tile.style.width = `${tileWidth}px`;
    
    // Zapisz pozycję dla rysowania strzałek
    const centerX = x + tileWidth / 2;
    const centerY = y + tileHeight / 2;
    nodePositions.set(String(item.node.id), { x: centerX, y: centerY, tile: item.tile });
  });
  
  // Ustaw wysokość kontenera
  const totalRows = Math.ceil(tiles.length / cols);
  container.style.height = `${totalRows * (tileHeight + padding) + padding}px`;
  svg.setAttribute('width', container.offsetWidth || 400);
  svg.setAttribute('height', container.style.height);
  
  // Rysuj strzałki między połączonymi nodami
  nodes.forEach(node => {
    node.choices.forEach(choice => {
      const fromPos = nodePositions.get(String(node.id));
      const toPos = nodePositions.get(String(choice.to));
      
      if (fromPos && toPos) {
        // Oblicz pozycje startu i końca strzałki (na krawędziach kafelków)
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Kąt strzałki
        const angle = Math.atan2(dy, dx);
        
        // Przesunięcie od środka do krawędzi kafelka
        const offsetX = Math.cos(angle) * (tileWidth / 2);
        const offsetY = Math.sin(angle) * (tileHeight / 2);
        
        const x1 = fromPos.x + offsetX;
        const y1 = fromPos.y + offsetY;
        const x2 = toPos.x - offsetX;
        const y2 = toPos.y - offsetY;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'var(--primary)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        line.setAttribute('opacity', '0.5');
        svg.appendChild(line);
      }
    });
  });
  
  // Dodaj marker dla strzałek
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill', 'var(--primary)');
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);
  
  // Obsługa kliknięć na kafelki - przejście do noda w runnerze
  tiles.forEach(item => {
    item.tile.style.cursor = 'pointer';
    item.tile.onclick = () => {
      startAt(item.node.id);
    };
  });
  
  // Przewiń do aktywnego noda jeśli istnieje
  if (session.currentNodeId) {
    const activeTile = container.querySelector(`[data-node-id="${session.currentNodeId}"]`);
    if (activeTile) {
      setTimeout(() => {
        activeTile.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }
  
  // Aktualizuj strzałki po zmianie rozmiaru okna (tylko raz)
  if (!window.tilesResizeHandler) {
    window.tilesResizeHandler = true;
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (typeof currentView !== 'undefined' && currentView === 'tiles') renderTilesView();
      }, 250);
    });
  }
}

// --- RENDER: wszystko ---
function renderAll() { 
  els.title.textContent = graph.title || 'Graph'; 
  renderNodeList(); 
  renderRunner(); 
  validateGraph();
  if (typeof currentView !== 'undefined' && currentView === 'tiles') renderTilesView();
}

// --- Helpers ---
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

