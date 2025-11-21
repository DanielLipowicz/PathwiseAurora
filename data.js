// --- Stan ---
// Note: IDs should be strings to support infinite nesting (e.g., "1.2.1.1", "1.2.2", "1.22")
// Numbers are accepted for backward compatibility but will be converted to strings
/** @type {{title:string,nodes:Array<{id:string|number,title:string,body:string,choices:Array<{label:string,to:string|number}>}>}} */
let graph = null;
/** @type {{currentNodeId:string|number|null,history:Array<{id:string|number,title:string,body:string,comment?:string}>}} */
let session = { currentNodeId: null, history: [] };

// --- Util ---
const byId = id => graph.nodes.find(n => String(n.id) === String(id)) || null;
const normalizeId = (id) => String(id);

// Funkcje pomocnicze dla zagnieżdżonych węzłów
const getParentId = (id) => {
  const str = String(id);
  const lastDot = str.lastIndexOf('.');
  if (lastDot === -1) return null;
  return str.substring(0, lastDot);
};

const getChildren = (id) => {
  const str = String(id);
  return graph.nodes.filter(n => {
    const nStr = String(n.id);
    return nStr.startsWith(str + '.') && (nStr.match(/\./g) || []).length === (str.match(/\./g) || []).length + 1;
  });
};

const getSiblings = (id) => {
  const parentId = getParentId(id);
  if (parentId === null) {
    // Root level nodes (no parent)
    return graph.nodes.filter(n => {
      const nStr = String(n.id);
      return !nStr.includes('.');
    });
  }
  return getChildren(parentId);
};

const getNextSibling = (id) => {
  const siblings = getSiblings(id);
  const sorted = siblings.sort((a, b) => compareIds(a.id, b.id));
  const currentIdx = sorted.findIndex(n => String(n.id) === String(id));
  if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
    return sorted[currentIdx + 1].id;
  }
  return null;
};

const getPrevSibling = (id) => {
  const siblings = getSiblings(id);
  const sorted = siblings.sort((a, b) => compareIds(a.id, b.id));
  const currentIdx = sorted.findIndex(n => String(n.id) === String(id));
  if (currentIdx > 0) {
    return sorted[currentIdx - 1].id;
  }
  return null;
};

// Porównywanie ID dla sortowania (obsługuje notację dziesiętną: 1, 1.1, 1.1.1, 2, etc.)
const compareIds = (a, b) => {
  const aStr = String(a);
  const bStr = String(b);
  const aParts = aStr.split('.').map(Number);
  const bParts = bStr.split('.').map(Number);
  const maxLen = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLen; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
};

const nextId = () => {
  if (!graph.nodes.length) return '1';
  // Znajdź największe ID numeryczne na poziomie root
  const rootNodes = graph.nodes.filter(n => !String(n.id).includes('.'));
  if (rootNodes.length === 0) return '1';
  const maxRoot = Math.max(...rootNodes.map(n => Number(String(n.id).split('.')[0])));
  return String(maxRoot + 1);
};

const nextChildId = (parentId) => {
  const children = getChildren(parentId);
  if (children.length === 0) return `${parentId}.1`;
  const childNums = children.map(n => {
    const parts = String(n.id).split('.');
    return Number(parts[parts.length - 1]);
  });
  const maxChild = Math.max(...childNums);
  return `${parentId}.${maxChild + 1}`;
};
// Helper function to create history entry from node
const createHistoryEntry = (node) => {
  if (!node) return null;
  return { id: node.id, title: node.title, body: node.body, comment: '' };
};

// Helper function to migrate old history format (array of IDs) to new format (array of objects)
const migrateHistory = (oldHistory, graphData) => {
  if (!oldHistory || !Array.isArray(oldHistory)) return [];
  if (!graphData || !Array.isArray(graphData.nodes)) return [];
  
  const findNodeById = (id) => {
    return graphData.nodes.find(n => String(n.id) === String(id)) || null;
  };
  
  return oldHistory.map(id => {
    const node = findNodeById(id);
    if (node) {
      return { id: node.id, title: node.title, body: node.body, comment: '' };
    }
    // If node doesn't exist, try to keep just the ID as fallback
    return { id: String(id), title: `#${id}`, body: '', comment: '' };
  }).filter(entry => entry !== null);
};

const saveLocal = () => localStorage.setItem('dd_graph_v1', JSON.stringify({ graph, session }));
const loadLocal = () => {
  const raw = localStorage.getItem('dd_graph_v1');
  if (!raw) return null;
  try { 
    const data = JSON.parse(raw);
    // Migrate old history format if needed
    if (data.session && Array.isArray(data.session.history) && data.session.history.length > 0) {
      const firstItem = data.session.history[0];
      // Check if it's old format (string/number) or new format (object)
      if (typeof firstItem === 'string' || typeof firstItem === 'number') {
        data.session.history = migrateHistory(data.session.history, data.graph);
      }
    }
    return data;
  } catch { return null; }
};
const download = (filename, data) => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
const renderJson = (includeHistory = false) => {
  if (includeHistory) {
    return JSON.stringify({ graph, session }, null, 2);
  }
  return JSON.stringify(graph, null, 2);
};

// --- Inicjalizacja (seed jeśli brak) ---
function seedIfEmpty() {
  graph = {
    title: 'Diagnosis: Application Not Working',
    nodes: [
      { id:'1', title:'My application is not working', body:'Starting point for debugging.', choices:[{label:'Check healthcheck', to:'2'}] },
      { id:'2', title:'Check healthcheck', body:'Call /health.', choices:[{label:'positive', to:'3'},{label:'negative', to:'4'},{label:'no response', to:'5'}] },
      { id:'3', title:'Check database availability', body:'Log into DB; check connection.', choices:[] },
      { id:'4', title:'Fix negative healthcheck', body:'Collect logs, check dependencies.', choices:[] },
      { id:'5', title:'Fix non-working healthcheck', body:'Network/Ingress/Firewall; after fixing return to the problem.', choices:[{label:'return to start', to:'1'}] },
    ]
  };
  const startNode = graph.nodes.find(n => n.id === '1');
  session = { 
    currentNodeId: '1', 
    history: startNode ? [createHistoryEntry(startNode)] : [] 
  };
}

