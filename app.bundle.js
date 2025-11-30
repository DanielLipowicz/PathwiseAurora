// Pathwise Aurora - Bundled Application

(() => {
  // src/ui/EventBus.js
  var EventBus = class {
    constructor() {
      this.listeners = /* @__PURE__ */ new Map();
    }
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
      return () => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    }
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }
    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    off(event) {
      this.listeners.delete(event);
    }
    /**
     * Remove all listeners
     */
    clear() {
      this.listeners.clear();
    }
  };

  // src/ui/DOMRegistry.js
  var DOMRegistry = class {
    constructor() {
      this.elements = {};
      this.initialize();
    }
    /**
     * Initialize DOM element references
     */
    initialize() {
      this.elements = {
        title: document.getElementById("graphTitle"),
        nodeList: document.getElementById("nodeList"),
        tilesView: document.getElementById("tilesView"),
        tilesContainer: document.getElementById("tilesContainer"),
        connectionsSvg: document.getElementById("connectionsSvg"),
        filter: document.getElementById("filterInput"),
        clearFilter: document.getElementById("btnClearFilter"),
        importFile: document.getElementById("importFile"),
        btnImport: document.getElementById("btnImport"),
        btnExport: document.getElementById("btnExport"),
        btnExportSession: document.getElementById("btnExportSession"),
        btnEmailSummary: document.getElementById("btnEmailSummary"),
        btnExportConfluence: document.getElementById("btnExportConfluence"),
        btnNewNode: document.getElementById("btnNewNode"),
        btnNewSession: document.getElementById("btnNewSession"),
        btnViewList: document.getElementById("btnViewList"),
        btnViewTiles: document.getElementById("btnViewTiles"),
        startSelect: document.getElementById("startSelect"),
        btnStart: document.getElementById("btnStart"),
        runnerNodeId: document.getElementById("runnerNodeId"),
        btnJump: document.getElementById("btnJump"),
        btnBack: document.getElementById("btnBack"),
        btnReset: document.getElementById("btnReset"),
        runnerView: document.getElementById("runnerView"),
        history: document.getElementById("history"),
        validationBadge: document.getElementById("validationBadge"),
        errorsSection: document.getElementById("errorsSection"),
        errorsList: document.getElementById("errorsList"),
        btnCloseErrors: document.getElementById("btnCloseErrors"),
        resizeHandle: document.getElementById("resizeHandle"),
        nodeItemTpl: document.getElementById("nodeItemTpl"),
        choiceRowTpl: document.getElementById("choiceRowTpl"),
        mainView: document.getElementById("mainView"),
        nodesPageContainer: document.getElementById("nodesPageContainer"),
        knowledgeGapsContainer: document.getElementById("knowledgeGapsContainer"),
        helpContainer: document.getElementById("helpContainer"),
        btnNavMain: document.getElementById("btnNavMain"),
        btnNavNodes: document.getElementById("btnNavNodes"),
        btnNavGaps: document.getElementById("btnNavGaps"),
        btnNavHelp: document.getElementById("btnNavHelp"),
        emailSummaryModal: document.getElementById("emailSummaryModal"),
        emailSummaryFormat: document.getElementById("emailSummaryFormat"),
        emailSummaryText: document.getElementById("emailSummaryText"),
        btnCopyEmailSummary: document.getElementById("btnCopyEmailSummary"),
        btnCloseEmailSummary: document.getElementById("btnCloseEmailSummary"),
        confluenceExportModal: document.getElementById("confluenceExportModal"),
        confluenceExportText: document.getElementById("confluenceExportText"),
        btnCopyConfluenceExport: document.getElementById("btnCopyConfluenceExport"),
        btnCloseConfluenceExport: document.getElementById("btnCloseConfluenceExport")
      };
    }
    /**
     * Get element by key
     * @param {string} key - Element key
     * @returns {HTMLElement|null} Element or null
     */
    get(key) {
      return this.elements[key] || null;
    }
    /**
     * Get all elements
     * @returns {Object} All registered elements
     */
    getAll() {
      return this.elements;
    }
  };

  // src/ui/ViewManager.js
  var ViewManager = class {
    constructor(domRegistry, eventBus) {
      this.dom = domRegistry;
      this.events = eventBus;
      this.currentView = "list";
      this.initialize();
    }
    /**
     * Initialize view manager
     */
    initialize() {
      const btnViewList = this.dom.get("btnViewList");
      const btnViewTiles = this.dom.get("btnViewTiles");
      const nodeList = this.dom.get("nodeList");
      const tilesView = this.dom.get("tilesView");
      if (btnViewList) {
        btnViewList.onclick = () => this.switchToView("list");
      }
      if (btnViewTiles) {
        btnViewTiles.onclick = () => this.switchToView("tiles");
      }
    }
    /**
     * Switch to a specific view
     * @param {string} view - View name ('list' or 'tiles')
     */
    switchToView(view) {
      if (view !== "list" && view !== "tiles")
        return;
      this.currentView = view;
      const nodeList = this.dom.get("nodeList");
      const tilesView = this.dom.get("tilesView");
      const btnViewList = this.dom.get("btnViewList");
      const btnViewTiles = this.dom.get("btnViewTiles");
      if (view === "list") {
        if (nodeList)
          nodeList.classList.remove("hidden");
        if (tilesView)
          tilesView.classList.add("hidden");
        if (btnViewList)
          btnViewList.classList.add("active");
        if (btnViewTiles)
          btnViewTiles.classList.remove("active");
      } else {
        if (nodeList)
          nodeList.classList.add("hidden");
        if (tilesView)
          tilesView.classList.remove("hidden");
        if (btnViewList)
          btnViewList.classList.remove("active");
        if (btnViewTiles)
          btnViewTiles.classList.add("active");
      }
      this.events.emit("view:changed", view);
    }
    /**
     * Get current view
     * @returns {string} Current view name
     */
    getCurrentView() {
      return this.currentView;
    }
  };

  // src/ui/ResizeHandler.js
  var ResizeHandler = class {
    constructor(domRegistry, storageService) {
      this.dom = domRegistry;
      this.storage = storageService;
      this.isResizing = false;
      this.startX = 0;
      this.startWidth = 0;
      this.initialize();
    }
    /**
     * Initialize resize handler
     */
    initialize() {
      const savedWidth = this.storage.loadSidebarWidth();
      if (savedWidth) {
        document.documentElement.style.setProperty("--sidebar-width", savedWidth + "px");
      }
      const handle = this.dom.get("resizeHandle");
      if (!handle)
        return;
      handle.addEventListener("mousedown", (e) => {
        this.isResizing = true;
        this.startX = e.clientX;
        const currentWidth = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width").trim();
        this.startWidth = parseInt(currentWidth) || 420;
        handle.classList.add("resizing");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
      });
      document.addEventListener("mousemove", (e) => {
        if (!this.isResizing)
          return;
        const diff = e.clientX - this.startX;
        const newWidth = Math.max(300, Math.min(800, this.startWidth + diff));
        document.documentElement.style.setProperty("--sidebar-width", newWidth + "px");
        this.storage.saveSidebarWidth(newWidth);
      });
      document.addEventListener("mouseup", () => {
        if (this.isResizing) {
          this.isResizing = false;
          handle.classList.remove("resizing");
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        }
      });
    }
  };

  // src/core/Graph.js
  var Graph = class _Graph {
    constructor(data = null) {
      if (data) {
        this.title = data.title || "Graph";
        this.nodes = Array.isArray(data.nodes) ? data.nodes.map((n) => ({
          id: String(n.id),
          title: String(n.title || ""),
          body: String(n.body || ""),
          choices: Array.isArray(n.choices) ? n.choices.map((c) => ({
            label: String(c.label || ""),
            to: String(c.to)
          })) : []
        })) : [];
      } else {
        this.title = "Graph";
        this.nodes = [];
      }
    }
    /**
     * Convert graph to JSON
     * @returns {Object} Graph data as plain object
     */
    toJSON() {
      return {
        title: this.title,
        nodes: this.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          choices: n.choices.map((c) => ({
            label: c.label,
            to: c.to
          }))
        }))
      };
    }
    /**
     * Create default seed graph
     * @returns {Graph} New graph with default nodes
     */
    static createSeed() {
      return new _Graph({
        title: "Diagnosis: Application Not Working",
        nodes: [
          { id: "1", title: "My application is not working", body: "Starting point for debugging.", choices: [{ label: "Check healthcheck", to: "2" }] },
          { id: "2", title: "Check healthcheck", body: "Call /health.", choices: [{ label: "positive", to: "3" }, { label: "negative", to: "4" }, { label: "no response", to: "5" }] },
          { id: "3", title: "Check database availability", body: "Log into DB; check connection.", choices: [] },
          { id: "4", title: "Fix negative healthcheck", body: "Collect logs, check dependencies.", choices: [] },
          { id: "5", title: "Fix non-working healthcheck", body: "Network/Ingress/Firewall; after fixing return to the problem.", choices: [{ label: "return to start", to: "1" }] }
        ]
      });
    }
  };

  // src/core/Session.js
  var Session = class _Session {
    constructor(data = null) {
      if (data) {
        this.currentNodeId = data.currentNodeId ?? null;
        this.history = Array.isArray(data.history) ? data.history : [];
      } else {
        this.currentNodeId = null;
        this.history = [];
      }
    }
    /**
     * Convert session to JSON
     * @returns {Object} Session data as plain object
     */
    toJSON() {
      return {
        currentNodeId: this.currentNodeId,
        history: this.history.map((entry) => ({
          id: entry.id,
          title: entry.title || "",
          body: entry.body || "",
          comment: entry.comment || "",
          tags: Array.isArray(entry.tags) ? entry.tags : []
        }))
      };
    }
    /**
     * Create session from node
     * @param {Object} node - Starting node
     * @returns {Session} New session
     */
    static createFromNode(node) {
      if (!node) {
        return new _Session();
      }
      return new _Session({
        currentNodeId: node.id,
        history: [{ id: node.id, title: node.title, body: node.body, comment: "", tags: [] }]
      });
    }
  };

  // src/core/StateManager.js
  var StateManager = class {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.graph = null;
      this.session = null;
    }
    /**
     * Set graph and notify listeners
     * @param {Graph} graph - Graph instance
     */
    setGraph(graph) {
      this.graph = graph;
      if (this.eventBus) {
        this.eventBus.emit("graph:changed", graph);
      }
    }
    /**
     * Set session and notify listeners
     * @param {Session} session - Session instance
     */
    setSession(session) {
      this.session = session;
      if (this.eventBus) {
        this.eventBus.emit("session:changed", session);
      }
    }
    /**
     * Get current graph
     * @returns {Graph|null} Current graph
     */
    getGraph() {
      return this.graph;
    }
    /**
     * Get current session
     * @returns {Session|null} Current session
     */
    getSession() {
      return this.session;
    }
    /**
     * Initialize state from saved data
     * @param {Object} data - Saved data with graph and session
     * @param {Function} migrateHistory - Function to migrate old history format
     */
    initialize(data, migrateHistory2) {
      if (data && data.graph) {
        this.setGraph(new Graph(data.graph));
      }
      if (data && data.session) {
        if (Array.isArray(data.session.history) && data.session.history.length > 0) {
          const firstItem = data.session.history[0];
          if (typeof firstItem === "string" || typeof firstItem === "number") {
            if (migrateHistory2) {
              data.session.history = migrateHistory2(data.session.history, data.graph);
            }
          }
        }
        this.setSession(new Session(data.session));
      }
    }
    /**
     * Notify that state has been updated
     */
    notifyUpdate() {
      if (this.eventBus) {
        this.eventBus.emit("state:updated", {
          graph: this.graph,
          session: this.session
        });
      }
    }
  };

  // src/services/StorageService.js
  var StorageService = class {
    constructor(storageKey = "dd_graph_v1") {
      this.storageKey = storageKey;
    }
    /**
     * Save graph and session to localStorage
     * @param {Object} graph - Graph object
     * @param {Object} session - Session object
     */
    save(graph, session) {
      localStorage.setItem(this.storageKey, JSON.stringify({ graph, session }));
    }
    /**
     * Load graph and session from localStorage
     * @param {Function} migrateHistory - Function to migrate old history format
     * @returns {Object|null} Object with graph and session, or null if not found
     */
    load(migrateHistory2) {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw)
        return null;
      try {
        const data = JSON.parse(raw);
        if (data.session && Array.isArray(data.session.history) && data.session.history.length > 0) {
          const firstItem = data.session.history[0];
          if (typeof firstItem === "string" || typeof firstItem === "number") {
            if (migrateHistory2) {
              data.session.history = migrateHistory2(data.session.history, data.graph);
            }
          }
        }
        return data;
      } catch {
        return null;
      }
    }
    /**
     * Save sidebar width preference
     * @param {number} width - Width in pixels
     */
    saveSidebarWidth(width) {
      localStorage.setItem("sidebarWidth", width);
    }
    /**
     * Load sidebar width preference
     * @returns {string|null} Saved width or null
     */
    loadSidebarWidth() {
      return localStorage.getItem("sidebarWidth");
    }
  };

  // src/services/ValidationService.js
  var ValidationService = class {
    /**
     * Validate graph structure
     * @param {Object} graph - Graph object to validate
     * @returns {Object} Validation result with ok flag, messages, and emptyReferences
     */
    validate(graph) {
      const ids = new Set(graph.nodes.map((n) => String(n.id)));
      let ok = true;
      let messages = [];
      const emptyReferences = [];
      if (ids.size !== graph.nodes.length) {
        ok = false;
        messages.push("Duplicate IDs");
      }
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
            emptyReferences.push({
              nodeId: n.id,
              nodeTitle: n.title,
              choiceLabel: c.label || "(no label)"
            });
            ok = false;
            messages.push(`Empty reference in #${n.id}`);
          } else if (!ids.has(String(c.to))) {
            emptyReferences.push({
              nodeId: n.id,
              nodeTitle: n.title,
              choiceLabel: c.label || "(no label)",
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
  };

  // src/utils/NodeUtils.js
  function byId(id, nodes) {
    return nodes.find((n) => String(n.id) === String(id)) || null;
  }
  function getParentId(id) {
    const str = String(id);
    const lastDot = str.lastIndexOf(".");
    if (lastDot === -1)
      return null;
    return str.substring(0, lastDot);
  }
  function getChildren(id, nodes) {
    const str = String(id);
    return nodes.filter((n) => {
      const nStr = String(n.id);
      return nStr.startsWith(str + ".") && (nStr.match(/\./g) || []).length === (str.match(/\./g) || []).length + 1;
    });
  }
  function getSiblings(id, nodes, getParentId2, getChildren2) {
    const parentId = getParentId2(id);
    if (parentId === null) {
      return nodes.filter((n) => {
        const nStr = String(n.id);
        return !nStr.includes(".");
      });
    }
    return getChildren2(parentId, nodes);
  }
  function getNextSibling(id, nodes, compareIds2) {
    const siblings = getSiblings(id, nodes, getParentId, getChildren);
    const sorted = siblings.sort((a, b) => compareIds2(a.id, b.id));
    const currentIdx = sorted.findIndex((n) => String(n.id) === String(id));
    if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
      return sorted[currentIdx + 1].id;
    }
    return null;
  }
  function getPrevSibling(id, nodes, compareIds2) {
    const siblings = getSiblings(id, nodes, getParentId, getChildren);
    const sorted = siblings.sort((a, b) => compareIds2(a.id, b.id));
    const currentIdx = sorted.findIndex((n) => String(n.id) === String(id));
    if (currentIdx > 0) {
      return sorted[currentIdx - 1].id;
    }
    return null;
  }
  function getIncomingReferences(nodeId, nodes) {
    const targetId = String(nodeId);
    const references = [];
    for (const node of nodes) {
      for (const choice of node.choices) {
        if (String(choice.to) === targetId) {
          references.push({
            node,
            choice
          });
        }
      }
    }
    return references;
  }
  function isReferenced(nodeId, nodes) {
    return getIncomingReferences(nodeId, nodes).length > 0;
  }
  function createHistoryEntry(node) {
    if (!node)
      return null;
    return { id: node.id, title: node.title, body: node.body, comment: "", tags: [] };
  }
  function migrateHistory(oldHistory, graphData) {
    if (!oldHistory || !Array.isArray(oldHistory))
      return [];
    if (!graphData || !Array.isArray(graphData.nodes))
      return [];
    const findNodeById = (id) => {
      return graphData.nodes.find((n) => String(n.id) === String(id)) || null;
    };
    return oldHistory.map((id) => {
      const node = findNodeById(id);
      if (node) {
        return { id: node.id, title: node.title, body: node.body, comment: "", tags: [] };
      }
      return { id: String(id), title: `#${id}`, body: "", comment: "", tags: [] };
    }).filter((entry) => entry !== null);
  }

  // src/utils/EmailSummaryGenerator.js
  function generateEmailSummary(data, format = "text") {
    if (!data || data.exportType !== "session") {
      throw new Error('Invalid data: exportType must be "session"');
    }
    const { graph, session, exportDate } = data;
    if (!graph || !session || !session.history || session.history.length === 0) {
      throw new Error("Invalid data: missing graph, session, or history");
    }
    const history2 = session.history;
    const startNode = history2[0];
    const endNodeId = session.currentNodeId;
    let endNodeTitle = "";
    const endNodeInHistory = history2.find((h) => String(h.id) === String(endNodeId));
    if (endNodeInHistory) {
      endNodeTitle = endNodeInHistory.title || "";
    } else if (graph.nodes) {
      const endNodeFromGraph = graph.nodes.find((n) => String(n.id) === String(endNodeId));
      if (endNodeFromGraph) {
        endNodeTitle = endNodeFromGraph.title || "";
      }
    }
    if (format === "html") {
      return generateHtmlSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history2);
    } else {
      return generateTextSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history2);
    }
  }
  function generateTextSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history2) {
    const lines = [];
    const graphTitle = graph.title || "Untitled Session";
    lines.push(`Subject: Summary \u2013 ${graphTitle}`);
    lines.push("");
    lines.push("");
    lines.push("Incident / flow title:");
    lines.push(graphTitle);
    lines.push("");
    lines.push(`Export date (UTC):`);
    lines.push(exportDate || (/* @__PURE__ */ new Date()).toISOString());
    lines.push("");
    lines.push("Session start:");
    lines.push(`Node #${startNode.id} \u2013 ${startNode.title || ""}`);
    lines.push("");
    lines.push("Session end:");
    lines.push(`Node #${endNodeId} \u2013 ${endNodeTitle}`);
    lines.push("");
    lines.push("");
    lines.push("===== Session Steps =====");
    lines.push("");
    history2.forEach((entry, index) => {
      const stepNum = index + 1;
      lines.push(`Step ${stepNum}`);
      lines.push(`Node: #${entry.id} \u2013 ${entry.title || ""}`);
      lines.push("What happened:");
      if (entry.body && entry.body.trim()) {
        lines.push(`  ${entry.body.trim()}`);
      } else {
        lines.push("  (No description)");
      }
      lines.push("");
      if (entry.comment && entry.comment.trim()) {
        lines.push("Comment:");
        lines.push(`  ${entry.comment.trim()}`);
        lines.push("");
      }
      if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
        const tagsStr = entry.tags.filter((t) => t && t.trim()).join(", ");
        if (tagsStr) {
          lines.push("Tags:");
          lines.push(`  ${tagsStr}`);
          lines.push("");
        }
      }
    });
    lines.push("");
    lines.push("===== Session Summary =====");
    lines.push("");
    lines.push(`The session started at node #${startNode.id} \u2013 "${startNode.title || ""}"`);
    lines.push(`and concluded at node #${endNodeId} \u2013 "${endNodeTitle}".`);
    lines.push("");
    lines.push("");
    lines.push("Next recommended actions:");
    lines.push("- ...");
    lines.push("- ...");
    return lines.join("\n");
  }
  function generateHtmlSummary(graph, session, exportDate, startNode, endNodeId, endNodeTitle, history2) {
    const parts = [];
    const graphTitle = graph.title || "Untitled Session";
    const exportDateStr = exportDate || (/* @__PURE__ */ new Date()).toISOString();
    parts.push(`<h1>Summary \u2013 ${escapeHtml(graphTitle)}</h1>`);
    parts.push("");
    parts.push(`<p><strong>Export date (UTC):</strong> ${escapeHtml(exportDateStr)}</p>`);
    parts.push(`<p><strong>Session start:</strong> #${escapeHtml(String(startNode.id))} \u2013 ${escapeHtml(startNode.title || "")}</p>`);
    parts.push(`<p><strong>Session end:</strong> #${escapeHtml(String(endNodeId))} \u2013 ${escapeHtml(endNodeTitle)}</p>`);
    parts.push("");
    parts.push("<hr />");
    parts.push("");
    parts.push("<h2>Session Steps</h2>");
    parts.push("<ol>");
    history2.forEach((entry, index) => {
      const stepNum = index + 1;
      parts.push("  <li>");
      parts.push(`    <h3>Step ${stepNum} \u2013 #${escapeHtml(String(entry.id))} \u2013 ${escapeHtml(entry.title || "")}</h3>`);
      if (entry.body && entry.body.trim()) {
        parts.push(`    <p><strong>What happened:</strong><br />`);
        parts.push(`    ${escapeHtml(entry.body.trim()).replace(/\n/g, "<br />")}</p>`);
      } else {
        parts.push(`    <p><strong>What happened:</strong><br />`);
        parts.push(`    (No description)</p>`);
      }
      if (entry.comment && entry.comment.trim()) {
        parts.push(`    <p><strong>Comment:</strong> ${escapeHtml(entry.comment.trim())}</p>`);
      }
      if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
        const tagsStr = entry.tags.filter((t) => t && t.trim()).map((t) => escapeHtml(t.trim())).join(", ");
        if (tagsStr) {
          parts.push(`    <p><strong>Tags:</strong> ${tagsStr}</p>`);
        }
      }
      parts.push("  </li>");
    });
    parts.push("</ol>");
    parts.push("");
    parts.push("<hr />");
    parts.push("");
    parts.push("<h2>Session Summary</h2>");
    parts.push("<p>");
    parts.push(`  The session started at node #${escapeHtml(String(startNode.id))} \u2013 "${escapeHtml(startNode.title || "")}"`);
    parts.push(`  and concluded at node #${escapeHtml(String(endNodeId))} \u2013 "${escapeHtml(endNodeTitle)}".`);
    parts.push("</p>");
    parts.push("");
    parts.push("<p><strong>Next recommended actions:</strong></p>");
    parts.push("<ul>");
    parts.push("  <li>...</li>");
    parts.push("  <li>...</li>");
    parts.push("</ul>");
    return parts.join("\n");
  }
  function escapeHtml(s) {
    if (s == null)
      return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/utils/ConfluenceExportGenerator.js
  function generateConfluenceExport(graph) {
    if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) {
      throw new Error("Invalid graph data: missing nodes");
    }
    const lines = [];
    const title = graph.title || "Untitled Process";
    lines.push(`h1. ${escapeConfluenceTitle(title)}`);
    lines.push("");
    lines.push(`Generated: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`);
    lines.push("");
    lines.push("");
    const sortedNodes = [...graph.nodes].sort((a, b) => {
      const idA = String(a.id);
      const idB = String(b.id);
      const numA = parseFloat(idA);
      const numB = parseFloat(idB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return idA.localeCompare(idB, void 0, { numeric: true, sensitivity: "base" });
    });
    sortedNodes.forEach((node) => {
      const nodeId = String(node.id);
      const nodeTitle = node.title || "Untitled Step";
      const nodeBody = node.body || "";
      lines.push(`h2. Step ${nodeId}: ${escapeConfluenceTitle(nodeTitle)}`);
      lines.push("");
      lines.push(`{anchor:step${nodeId}}`);
      lines.push("");
      lines.push("Description:");
      lines.push("");
      if (nodeBody.trim()) {
        const bodyLines = nodeBody.trim().split("\n");
        bodyLines.forEach((line) => {
          lines.push(line);
        });
      } else {
        lines.push("(No description)");
      }
      lines.push("");
      if (node.choices && Array.isArray(node.choices) && node.choices.length > 0) {
        lines.push("Options:");
        lines.push("");
        node.choices.forEach((choice) => {
          const choiceLabel = choice.label || "";
          const targetId = String(choice.to);
          lines.push(`* ${escapeConfluenceText(choiceLabel)} \u2192 [Step ${targetId}|#step${targetId}]`);
        });
      } else {
        lines.push("Options:");
        lines.push("");
        lines.push("(No options)");
      }
      lines.push("");
      lines.push("");
    });
    return lines.join("\n");
  }
  function escapeConfluenceTitle(text) {
    if (!text)
      return "";
    return String(text).trim();
  }
  function escapeConfluenceText(text) {
    if (!text)
      return "";
    return String(text).replace(/\|/g, "\\|");
  }

  // src/services/ImportExportService.js
  var ImportExportService = class {
    constructor(storageService) {
      this.storageService = storageService || new StorageService();
    }
    /**
     * Download file with given filename and data
     * @param {string} filename - Filename for download
     * @param {string} data - Data to download
     */
    download(filename, data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    /**
     * Render graph and session as JSON
     * @param {Object} graph - Graph object
     * @param {Object} session - Session object
     * @param {boolean} includeHistory - Whether to include session in export
     * @returns {string} JSON string
     */
    renderJson(graph, session, includeHistory = false) {
      if (includeHistory) {
        return JSON.stringify({ graph, session }, null, 2);
      }
      return JSON.stringify(graph, null, 2);
    }
    /**
     * Export graph as JSON
     * @param {Object} graph - Graph object
     * @param {Object} session - Session object
     */
    exportJson(graph, session) {
      const filename = `${(graph.title || "graph").replace(/\s+/g, "_")}.json`;
      this.download(filename, this.renderJson(graph, session, true));
    }
    /**
     * Export session flow as JSON
     * @param {Object} graph - Graph object
     * @param {Object} session - Session object
     */
    exportSession(graph, session) {
      if (!session || !session.history || session.history.length === 0) {
        alert("No session flow to save.");
        return;
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const filename = `session_flow_${timestamp}.json`;
      const sessionData = {
        graph,
        session,
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        exportType: "session"
      };
      this.download(filename, JSON.stringify(sessionData, null, 2));
    }
    /**
     * Show email summary modal
     * @param {Object} graph - Graph object
     * @param {Object} session - Session object
     * @param {Object} domRegistry - DOM registry for accessing modal elements
     */
    showEmailSummary(graph, session, domRegistry) {
      if (!session || !session.history || session.history.length === 0) {
        alert("No session flow to generate email summary.");
        return;
      }
      const sessionData = {
        graph,
        session,
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        exportType: "session"
      };
      const modal = domRegistry.get("emailSummaryModal");
      const formatSelect = domRegistry.get("emailSummaryFormat");
      const textarea = domRegistry.get("emailSummaryText");
      const copyBtn = domRegistry.get("btnCopyEmailSummary");
      const closeBtn = domRegistry.get("btnCloseEmailSummary");
      if (!modal || !formatSelect || !textarea || !copyBtn || !closeBtn) {
        alert("Email summary UI elements not found.");
        return;
      }
      let currentFormat = "text";
      try {
        const summary = generateEmailSummary(sessionData, currentFormat);
        textarea.value = summary;
      } catch (error) {
        alert("Error generating email summary: " + error.message);
        return;
      }
      modal.classList.remove("hidden");
      const updateSummary = () => {
        currentFormat = formatSelect.value;
        try {
          const summary = generateEmailSummary(sessionData, currentFormat);
          textarea.value = summary;
        } catch (error) {
          alert("Error generating email summary: " + error.message);
        }
      };
      formatSelect.onchange = updateSummary;
      copyBtn.onclick = () => {
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        try {
          document.execCommand("copy");
          const originalText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          copyBtn.style.background = "linear-gradient(180deg,#5bd18a,#3e9f67)";
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = "";
          }, 2e3);
        } catch (err) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            copyBtn.style.background = "linear-gradient(180deg,#5bd18a,#3e9f67)";
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = "";
            }, 2e3);
          }).catch(() => {
            alert("Failed to copy. Please select and copy manually.");
          });
        }
      };
      const closeModal = () => {
        modal.classList.add("hidden");
        formatSelect.onchange = null;
        copyBtn.onclick = null;
        closeBtn.onclick = null;
      };
      closeBtn.onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModal();
        }
      };
      const escapeHandler = (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          closeModal();
          document.removeEventListener("keydown", escapeHandler);
        }
      };
      document.addEventListener("keydown", escapeHandler);
    }
    /**
     * Show Confluence export modal
     * @param {Object} graph - Graph object
     * @param {Object} domRegistry - DOM registry for accessing modal elements
     */
    showConfluenceExport(graph, domRegistry) {
      if (!graph || !graph.nodes || graph.nodes.length === 0) {
        alert("No graph available to export.");
        return;
      }
      const modal = domRegistry.get("confluenceExportModal");
      const textarea = domRegistry.get("confluenceExportText");
      const copyBtn = domRegistry.get("btnCopyConfluenceExport");
      const closeBtn = domRegistry.get("btnCloseConfluenceExport");
      if (!modal || !textarea || !copyBtn || !closeBtn) {
        alert("Confluence export UI elements not found.");
        return;
      }
      try {
        const exportContent = generateConfluenceExport(graph);
        textarea.value = exportContent;
      } catch (error) {
        alert("Error generating Confluence export: " + error.message);
        return;
      }
      modal.classList.remove("hidden");
      copyBtn.onclick = () => {
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        try {
          document.execCommand("copy");
          const originalText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          copyBtn.style.background = "linear-gradient(180deg,#5bd18a,#3e9f67)";
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = "";
          }, 2e3);
        } catch (err) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            copyBtn.style.background = "linear-gradient(180deg,#5bd18a,#3e9f67)";
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = "";
            }, 2e3);
          }).catch(() => {
            alert("Failed to copy. Please select and copy manually.");
          });
        }
      };
      const closeModal = () => {
        modal.classList.add("hidden");
        copyBtn.onclick = null;
        closeBtn.onclick = null;
      };
      closeBtn.onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModal();
        }
      };
      const escapeHandler = (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          closeModal();
          document.removeEventListener("keydown", escapeHandler);
        }
      };
      document.addEventListener("keydown", escapeHandler);
    }
    /**
     * Import JSON from file
     * @param {File} file - File to import
     * @param {Function} onSuccess - Callback with imported graph and session
     * @param {Function} onError - Error callback
     */
    importJson(file, onSuccess, onError) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          let graphData, sessionData;
          if (data.graph && Array.isArray(data.graph.nodes)) {
            graphData = data.graph;
            sessionData = data.session;
          } else if (Array.isArray(data.nodes)) {
            graphData = data;
            sessionData = null;
          } else {
            throw new Error("Invalid format");
          }
          if (!graphData || !Array.isArray(graphData.nodes)) {
            throw new Error("Invalid format");
          }
          const graph = {
            title: String(graphData.title || "Graph"),
            nodes: graphData.nodes.map((n) => ({
              id: String(n.id),
              title: String(n.title || ""),
              body: String(n.body || ""),
              choices: Array.isArray(n.choices) ? n.choices.map((c) => ({
                label: String(c.label || ""),
                to: String(c.to)
              })) : []
            }))
          };
          let session;
          if (sessionData && Array.isArray(sessionData.history)) {
            const firstItem = sessionData.history[0];
            if (typeof firstItem === "string" || typeof firstItem === "number") {
              sessionData.history = migrateHistory(sessionData.history, graph);
            }
            session = {
              currentNodeId: sessionData.currentNodeId ?? null,
              history: sessionData.history.map((entry) => ({
                id: entry.id,
                title: entry.title || "",
                body: entry.body || "",
                comment: entry.comment || "",
                tags: Array.isArray(entry.tags) ? entry.tags : []
              }))
            };
          } else {
            const firstNode = graph.nodes[0];
            session = {
              currentNodeId: firstNode?.id ?? null,
              history: firstNode ? [{ id: firstNode.id, title: firstNode.title, body: firstNode.body, comment: "", tags: [] }] : []
            };
          }
          if (onSuccess) {
            onSuccess(graph, session);
          }
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            alert("Import error: " + e.message);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // src/services/UrlService.js
  var UrlService = class {
    /**
     * Update URL with node ID parameter
     * @param {string|number|null} nodeId - Node ID to set in URL
     * @param {boolean} replaceState - Whether to use replaceState instead of pushState
     */
    updateUrl(nodeId, replaceState = false) {
      const url = new URL(window.location);
      if (nodeId) {
        url.searchParams.set("node", String(nodeId));
      } else {
        url.searchParams.delete("node");
      }
      if (replaceState) {
        history.replaceState({ nodeId }, "", url);
      } else {
        history.pushState({ nodeId }, "", url);
      }
    }
    /**
     * Get node ID from URL parameters
     * @returns {string|null} Node ID from URL or null
     */
    getNodeIdFromUrl() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("node");
    }
  };

  // src/utils/IdUtils.js
  function compareIds(a, b) {
    const aStr = String(a);
    const bStr = String(b);
    const aParts = aStr.split(".").map(Number);
    const bParts = bStr.split(".").map(Number);
    const maxLen = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLen; i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal)
        return aVal - bVal;
    }
    return 0;
  }
  function nextId(nodes) {
    if (!nodes || nodes.length === 0)
      return "1";
    const rootNodes = nodes.filter((n) => !String(n.id).includes("."));
    if (rootNodes.length === 0)
      return "1";
    const maxRoot = Math.max(...rootNodes.map((n) => Number(String(n.id).split(".")[0])));
    return String(maxRoot + 1);
  }
  function nextChildId(parentId, nodes, getChildren2) {
    const children = getChildren2(parentId, nodes);
    if (children.length === 0)
      return `${parentId}.1`;
    const childNums = children.map((n) => {
      const parts = String(n.id).split(".");
      return Number(parts[parts.length - 1]);
    });
    const maxChild = Math.max(...childNums);
    return `${parentId}.${maxChild + 1}`;
  }

  // src/controllers/NodeController.js
  var NodeController = class {
    constructor(stateManager, eventBus, storageService) {
      this.state = stateManager;
      this.events = eventBus;
      this.storage = storageService;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("node:updated", () => {
        this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        this.state.notifyUpdate();
      });
      this.events.on("node:delete-requested", (node) => {
        this.deleteNode(node);
      });
      this.events.on("node:clone-requested", (node) => {
        this.cloneNode(node);
      });
      this.events.on("node:add-child-requested", (node) => {
        this.addChildNode(node);
      });
      this.events.on("node:choice-add-requested", ({ node, label, to }) => {
        node.choices.push({ label, to: String(to) });
        this.events.emit("node:updated", node);
        this.events.emit("validation:requested");
      });
      this.events.on("node:create-requested", () => {
        this.createNode();
      });
    }
    /**
     * Create a new node
     */
    createNode() {
      const graph = this.state.getGraph();
      if (!graph)
        return;
      const newId = nextId(graph.nodes);
      const newNode = {
        id: newId,
        title: "New Node",
        body: "Description\u2026",
        choices: []
      };
      graph.nodes.push(newNode);
      this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
      this.state.setGraph(graph);
      this.events.emit("validation:requested");
      this.events.emit("node:created", { nodeId: newId, node: newNode });
    }
    /**
     * Delete a node
     * @param {Object} node - Node to delete
     */
    deleteNode(node) {
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      graph.nodes.forEach((n) => {
        n.choices = n.choices.filter((c) => String(c.to) !== String(node.id));
      });
      const nodeIdStr = String(node.id);
      graph.nodes = graph.nodes.filter((n) => {
        const nIdStr = String(n.id);
        return nIdStr !== nodeIdStr && !nIdStr.startsWith(nodeIdStr + ".");
      });
      if (String(session.currentNodeId) === String(node.id)) {
        session.currentNodeId = null;
        session.history = [];
      }
      this.storage.save(graph.toJSON(), session.toJSON());
      this.state.setGraph(graph);
      this.state.setSession(session);
      this.events.emit("validation:requested");
    }
    /**
     * Clone a node
     * @param {Object} node - Node to clone
     */
    cloneNode(node) {
      const graph = this.state.getGraph();
      if (!graph)
        return;
      const clone = JSON.parse(JSON.stringify(node));
      clone.id = nextId(graph.nodes);
      clone.choices = clone.choices.map((c) => ({ ...c, to: String(c.to) }));
      graph.nodes.push(clone);
      this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
      this.state.setGraph(graph);
    }
    /**
     * Add a child node
     * @param {Object} parentNode - Parent node
     */
    addChildNode(parentNode) {
      const graph = this.state.getGraph();
      if (!graph)
        return;
      const childId = nextChildId(String(parentNode.id), graph.nodes, getChildren);
      const child = {
        id: childId,
        title: "New Child Node",
        body: "Description\u2026",
        choices: []
      };
      graph.nodes.push(child);
      parentNode.choices.push({ label: "", to: String(childId) });
      this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
      this.state.setGraph(graph);
      this.events.emit("validation:requested");
      this.events.emit("node:child-created", { childId, child });
    }
  };

  // src/controllers/NavigationController.js
  var NavigationController = class {
    constructor(stateManager, eventBus, urlService, storageService) {
      this.state = stateManager;
      this.events = eventBus;
      this.url = urlService;
      this.storage = storageService;
      this.setupEventListeners();
      this.setupBrowserHistory();
    }
    setupEventListeners() {
      this.events.on("navigation:start-requested", (nodeId) => {
        this.startAt(nodeId);
      });
      this.events.on("navigation:advance-requested", (toId) => {
        this.advance(toId);
      });
      this.events.on("navigation:back-requested", () => {
        this.back();
      });
      this.events.on("navigation:reset-requested", () => {
        this.resetSession();
      });
      this.events.on("history:entry-selected", (entryId) => {
        this.navigateToHistoryEntry(entryId);
      });
      this.events.on("history:delete-requested", ({ index, entryId }) => {
        this.deleteHistoryEntry(index, entryId);
      });
    }
    setupBrowserHistory() {
      window.addEventListener("popstate", (event) => {
        const nodeId = event.state?.nodeId || this.url.getNodeIdFromUrl();
        if (nodeId) {
          const id = String(nodeId);
          const graph = this.state.getGraph();
          const session = this.state.getSession();
          if (!graph || !session)
            return;
          const node = byId(id, graph.nodes);
          if (node) {
            const historyEntry = createHistoryEntry(node);
            const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
            if (!lastEntry || String(lastEntry.id) !== String(id)) {
              session.history.push(historyEntry);
            }
            session.currentNodeId = id;
            this.storage.save(graph.toJSON(), session.toJSON());
            this.state.setSession(session);
          }
        } else {
          const session = this.state.getSession();
          if (session) {
            session.currentNodeId = null;
            this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
            this.state.setSession(session);
          }
        }
      });
    }
    /**
     * Start navigation at a specific node
     * @param {string|number} id - Node ID to start at
     */
    startAt(id) {
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      const node = byId(id, graph.nodes);
      if (!node)
        return;
      session.currentNodeId = id;
      const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
      if (!lastEntry || String(lastEntry.id) !== String(id)) {
        session.history.push(createHistoryEntry(node));
      }
      this.storage.save(graph.toJSON(), session.toJSON());
      this.url.updateUrl(id);
      this.state.setSession(session);
    }
    /**
     * Advance to a node
     * @param {string|number} toId - Target node ID
     */
    advance(toId) {
      if (!toId || !String(toId).trim()) {
        return;
      }
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      const node = byId(toId, graph.nodes);
      if (!node) {
        session.currentNodeId = String(toId);
        session.history.push({
          id: String(toId),
          title: `#${toId} (missing)`,
          body: "Target node does not exist",
          comment: "",
          tags: []
        });
        this.storage.save(graph.toJSON(), session.toJSON());
        this.url.updateUrl(String(toId));
        this.state.setSession(session);
        return;
      }
      session.currentNodeId = toId;
      session.history.push(createHistoryEntry(node));
      this.storage.save(graph.toJSON(), session.toJSON());
      this.url.updateUrl(toId);
      this.state.setSession(session);
    }
    /**
     * Navigate back in history
     */
    back() {
      const session = this.state.getSession();
      if (!session || session.history.length <= 1)
        return;
      const currentIdx = session.history.length - 1;
      if (currentIdx > 0) {
        const prevEntry = session.history[currentIdx - 1];
        if (typeof prevEntry === "object" && prevEntry !== null) {
          session.currentNodeId = prevEntry.id || null;
        } else {
          session.currentNodeId = prevEntry;
        }
        this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
        this.url.updateUrl(session.currentNodeId);
        this.state.setSession(session);
      }
    }
    /**
     * Reset session
     */
    resetSession() {
      const session = this.state.getSession();
      if (!session)
        return;
      session.currentNodeId = null;
      session.history = [];
      this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
      this.url.updateUrl(null, true);
      this.state.setSession(session);
    }
    /**
     * Navigate to a history entry
     * @param {string|number} entryId - History entry ID
     */
    navigateToHistoryEntry(entryId) {
      const session = this.state.getSession();
      if (!session)
        return;
      const idx = session.history.findIndex((h) => {
        const hId = h.id || h;
        return String(hId) === String(entryId);
      });
      if (idx >= 0) {
        session.currentNodeId = entryId;
        this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
        this.url.updateUrl(entryId);
        this.state.setSession(session);
      }
    }
    /**
     * Delete a history entry
     * @param {number} index - History entry index
     * @param {string|number} entryId - History entry ID
     */
    deleteHistoryEntry(index, entryId) {
      const session = this.state.getSession();
      if (!session)
        return;
      const wasCurrent = String(entryId) === String(session.currentNodeId);
      session.history.splice(index, 1);
      if (wasCurrent) {
        if (session.history.length > 0) {
          const newIdx = Math.min(index - 1, session.history.length - 1);
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
      this.storage.save(this.state.getGraph().toJSON(), session.toJSON());
      this.url.updateUrl(session.currentNodeId);
      this.state.setSession(session);
    }
  };

  // src/utils/HtmlUtils.js
  function escapeHtml2(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  // src/views/NodeListView.js
  var NodeListView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.pendingFocusNodeId = null;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("graph:changed", () => this.render());
      this.events.on("session:changed", () => this.render());
      this.events.on("choice:added", () => this.render());
      this.events.on("choice:removed", () => this.render());
      this.events.on("node:created", () => this.render());
      this.events.on("node:child-created", ({ childId }) => {
        this.pendingFocusNodeId = childId;
        setTimeout(() => {
          if (this.pendingFocusNodeId === childId) {
            this.render();
          }
        }, 200);
      });
    }
    /**
     * Render the node list
     * @param {string} filterQuery - Optional filter query
     */
    render(filterQuery = "") {
      const nodeList = this.dom.get("nodeList");
      const nodeItemTpl = this.dom.get("nodeItemTpl");
      const choiceRowTpl = this.dom.get("choiceRowTpl");
      const filter = this.dom.get("filter");
      if (!nodeList || !nodeItemTpl || !choiceRowTpl)
        return;
      const nodeIdToFocus = this.pendingFocusNodeId;
      this.pendingFocusNodeId = null;
      const scrollTop = nodeList.scrollTop;
      const activeElement = document.activeElement;
      let activeElementState = null;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        const nodeItem = activeElement.closest(".node-item");
        if (nodeItem) {
          const nidEl = nodeItem.querySelector(".nid");
          const nodeId = nidEl ? nidEl.textContent : null;
          activeElementState = {
            nodeId,
            className: activeElement.className,
            selectionStart: activeElement.selectionStart,
            selectionEnd: activeElement.selectionEnd,
            isTitle: activeElement.classList.contains("ntitle"),
            isBody: activeElement.classList.contains("nbody"),
            isChoiceLabel: activeElement.classList.contains("clabel"),
            isChoiceTo: activeElement.classList.contains("cto"),
            choiceIndex: activeElement.closest(".choice-row") ? Array.from(activeElement.closest(".choice-row").parentElement.children).indexOf(activeElement.closest(".choice-row")) : null
          };
        }
      }
      nodeList.innerHTML = "";
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      const q = filterQuery || (filter ? filter.value.toLowerCase() : "");
      const nodes = [...graph.nodes].sort((a, b) => compareIds(a.id, b.id)).filter((n) => !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
      const ids = new Set(graph.nodes.map((n) => String(n.id)));
      for (const node of nodes) {
        const item = nodeItemTpl.content.firstElementChild.cloneNode(true);
        const nidEl = item.querySelector(".nid");
        nidEl.textContent = node.id;
        const depth = (String(node.id).match(/\./g) || []).length;
        if (depth > 0) {
          item.style.paddingLeft = `${depth * 20}px`;
          item.style.borderLeft = `3px solid #${["ddd", "ccc", "bbb"][Math.min(depth - 1, 2)]}`;
        }
        if (String(session.currentNodeId) === String(node.id)) {
          item.classList.add("active");
        }
        const title = item.querySelector(".ntitle");
        const body = item.querySelector(".nbody");
        const choicesWrap = item.querySelector(".choices");
        const incomingRefsSection = item.querySelector(".incoming-refs-section");
        const incomingRefsContainer = item.querySelector(".incoming-refs");
        const warnTargets = item.querySelector(".warn-targets");
        const warnEmpty = item.querySelector(".warn-empty");
        title.value = node.title;
        body.value = node.body;
        const autoResize = (element, minHeight = 40) => {
          if (!element.classList.contains("expanded")) {
            element.style.height = "";
            return;
          }
          if (element.tagName === "TEXTAREA") {
            element.style.height = "auto";
            const newHeight = Math.max(minHeight, element.scrollHeight);
            element.style.height = newHeight + "px";
          } else if (element.tagName === "INPUT") {
            const temp = document.createElement("div");
            const styles = window.getComputedStyle(element);
            temp.style.position = "absolute";
            temp.style.visibility = "hidden";
            temp.style.whiteSpace = "pre-wrap";
            temp.style.wordWrap = "break-word";
            temp.style.overflowWrap = "break-word";
            temp.style.width = (element.offsetWidth || 200) + "px";
            temp.style.font = styles.font;
            temp.style.fontSize = styles.fontSize;
            temp.style.fontFamily = styles.fontFamily;
            temp.style.fontWeight = styles.fontWeight;
            temp.style.lineHeight = styles.lineHeight;
            temp.style.padding = styles.padding;
            temp.style.border = styles.border;
            temp.style.boxSizing = styles.boxSizing;
            temp.style.margin = styles.margin;
            temp.textContent = element.value || element.placeholder || "M";
            document.body.appendChild(temp);
            const newHeight = Math.max(minHeight, temp.offsetHeight);
            document.body.removeChild(temp);
            element.style.height = newHeight + "px";
          }
        };
        const updateLocalBadges = () => {
          let missing2 = false;
          let empty2 = !title.value.trim() || !body.value.trim();
          const choiceRows = choicesWrap.querySelectorAll(".choice-row");
          choiceRows.forEach((row) => {
            const cLabel = row.querySelector(".clabel");
            const cTo = row.querySelector(".cto");
            if (cLabel && !cLabel.value.trim())
              empty2 = true;
            if (cTo && !ids.has(String(cTo.value)))
              missing2 = true;
          });
          warnTargets.classList.toggle("hidden", !missing2);
          warnEmpty.classList.toggle("hidden", !empty2);
        };
        title.onfocus = () => {
          title.classList.add("expanded");
          setTimeout(() => autoResize(title, 40), 0);
        };
        title.onblur = () => {
          title.classList.remove("expanded");
          title.style.height = "";
        };
        title.oninput = () => {
          autoResize(title, 40);
          node.title = title.value;
          this.events.emit("node:updated", node);
          this.events.emit("node:title-changed", { node, title: title.value });
        };
        body.onfocus = () => {
          body.classList.add("expanded");
          setTimeout(() => autoResize(body, 60), 0);
        };
        body.onblur = () => {
          body.classList.remove("expanded");
          body.style.height = "";
        };
        body.oninput = () => {
          autoResize(body, 60);
          node.body = body.value;
          this.events.emit("node:updated", node);
          this.events.emit("node:body-changed", { node, body: body.value });
        };
        choicesWrap.innerHTML = "";
        let missing = false;
        let empty = !node.title.trim() || !node.body.trim();
        node.choices.forEach((ch, idx) => {
          const cRow = choiceRowTpl.content.firstElementChild.cloneNode(true);
          const cLabel = cRow.querySelector(".clabel");
          const cTo = cRow.querySelector(".cto");
          const btnGoto = cRow.querySelector(".btnGotoTarget");
          const btnRem = cRow.querySelector(".btnRemChoice");
          cLabel.value = ch.label;
          cTo.value = ch.to;
          if (!ids.has(String(ch.to)))
            missing = true;
          if (!ch.label.trim())
            empty = true;
          const updateGotoButton = () => {
            const targetId = String(cTo.value || "").trim();
            const hasValidTarget = targetId && ids.has(targetId);
            if (btnGoto) {
              btnGoto.style.display = hasValidTarget ? "" : "none";
            }
          };
          updateGotoButton();
          if (btnGoto) {
            btnGoto.onclick = () => {
              const targetId = String(cTo.value || "").trim();
              if (targetId && ids.has(targetId)) {
                this.focusOnNode(targetId);
              }
            };
          }
          cLabel.onfocus = () => {
            cLabel.classList.add("expanded");
            setTimeout(() => autoResize(cLabel, 40), 0);
          };
          cLabel.onblur = () => {
            cLabel.classList.remove("expanded");
            cLabel.style.height = "";
          };
          cLabel.oninput = () => {
            autoResize(cLabel, 40);
            ch.label = cLabel.value;
            this.events.emit("node:updated", node);
            this.events.emit("choice:updated", { node, choice: ch });
          };
          cTo.onfocus = () => {
            cTo.classList.add("expanded");
            setTimeout(() => autoResize(cTo, 40), 0);
          };
          cTo.onblur = () => {
            cTo.classList.remove("expanded");
            cTo.style.height = "";
          };
          cTo.oninput = () => {
            autoResize(cTo, 40);
            ch.to = String(cTo.value);
            updateGotoButton();
            this.events.emit("node:updated", node);
            this.events.emit("choice:updated", { node, choice: ch });
          };
          btnRem.onclick = () => {
            node.choices.splice(idx, 1);
            this.events.emit("node:updated", node);
            this.events.emit("choice:removed", { node, index: idx });
          };
          choicesWrap.appendChild(cRow);
        });
        warnTargets.classList.toggle("hidden", !missing);
        warnEmpty.classList.toggle("hidden", !empty);
        const incomingRefs = getIncomingReferences(node.id, graph.nodes);
        const hasIncoming = incomingRefs.length > 0;
        if (incomingRefsSection && incomingRefsContainer) {
          if (hasIncoming) {
            incomingRefsSection.classList.remove("hidden");
            incomingRefsContainer.innerHTML = "";
            incomingRefs.forEach((ref) => {
              const refItem = document.createElement("div");
              refItem.className = "incoming-ref-item";
              const nodeId = String(ref.node.id);
              const nodeAnchor = `#node-${nodeId}`;
              refItem.innerHTML = `
              <a href="${nodeAnchor}" class="ref-node-id-link" data-node-id="${escapeHtml2(nodeId)}" title="Go to node #${escapeHtml2(nodeId)}">#${escapeHtml2(nodeId)}</a>
              <span class="ref-choice-label">"${escapeHtml2(ref.choice.label || "")}"</span>
              <span class="ref-node-title">${escapeHtml2(ref.node.title || "")}</span>
            `;
              const link = refItem.querySelector(".ref-node-id-link");
              if (link) {
                link.onclick = (e) => {
                  e.preventDefault();
                  const targetNodeId = link.dataset.nodeId;
                  if (targetNodeId) {
                    this.focusOnNode(targetNodeId);
                  }
                };
              }
              incomingRefsContainer.appendChild(refItem);
            });
          } else {
            incomingRefsSection.classList.add("hidden");
          }
        }
        item.querySelector(".btnAddChoice").onclick = () => {
          const firstNodeId = graph.nodes[0]?.id ?? "1";
          node.choices.push({ label: "", to: String(firstNodeId) });
          this.events.emit("node:updated", node);
          this.events.emit("choice:added", { node });
        };
        item.querySelector(".btnDelete").onclick = () => {
          if (!confirm(`Delete node #${node.id}? This will remove references.`))
            return;
          this.events.emit("node:delete-requested", node);
        };
        item.querySelector(".btnClone").onclick = () => {
          this.events.emit("node:clone-requested", node);
        };
        item.querySelector(".btnAddChild").onclick = () => {
          this.events.emit("node:add-child-requested", node);
        };
        nodeList.appendChild(item);
      }
      if (scrollTop !== void 0) {
        nodeList.scrollTop = scrollTop;
      }
      if (activeElementState && activeElementState.nodeId) {
        setTimeout(() => {
          const nodeItems = nodeList.querySelectorAll(".node-item");
          let targetNodeItem = null;
          for (const item of nodeItems) {
            const nidEl = item.querySelector(".nid");
            if (nidEl && nidEl.textContent === activeElementState.nodeId) {
              targetNodeItem = item;
              break;
            }
          }
          if (targetNodeItem) {
            let elementToFocus = null;
            if (activeElementState.isTitle) {
              elementToFocus = targetNodeItem.querySelector(".ntitle");
            } else if (activeElementState.isBody) {
              elementToFocus = targetNodeItem.querySelector(".nbody");
            } else if (activeElementState.isChoiceLabel && activeElementState.choiceIndex !== null) {
              const choiceRows = targetNodeItem.querySelectorAll(".choice-row");
              if (choiceRows[activeElementState.choiceIndex]) {
                elementToFocus = choiceRows[activeElementState.choiceIndex].querySelector(".clabel");
              }
            } else if (activeElementState.isChoiceTo && activeElementState.choiceIndex !== null) {
              const choiceRows = targetNodeItem.querySelectorAll(".choice-row");
              if (choiceRows[activeElementState.choiceIndex]) {
                elementToFocus = choiceRows[activeElementState.choiceIndex].querySelector(".cto");
              }
            }
            if (elementToFocus) {
              elementToFocus.focus();
              if (elementToFocus.setSelectionRange && activeElementState.selectionStart !== null) {
                try {
                  elementToFocus.setSelectionRange(activeElementState.selectionStart, activeElementState.selectionEnd);
                } catch (e) {
                }
              }
            }
          }
        }, 0);
      }
      if (nodeIdToFocus) {
        setTimeout(() => {
          this.focusOnNode(nodeIdToFocus);
          this.pendingFocusNodeId = null;
        }, 200);
      }
    }
    /**
     * Focus on a specific node by ID
     * Scrolls to the node item and focuses on the title input
     * @param {string|number} nodeId - Node ID to focus on
     */
    focusOnNode(nodeId) {
      const nodeList = this.dom.get("nodeList");
      if (!nodeList)
        return;
      const nodeItems = nodeList.querySelectorAll(".node-item");
      for (const item of nodeItems) {
        const nidEl = item.querySelector(".nid");
        if (nidEl && nidEl.textContent === String(nodeId)) {
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            const titleInput = item.querySelector(".ntitle");
            if (titleInput) {
              titleInput.focus();
              titleInput.select();
            }
          }, 300);
          return;
        }
      }
    }
  };

  // src/views/NodesPageView.js
  var NodesPageView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.pendingFocusNodeId = null;
      this.filterQuery = "";
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("graph:changed", () => this.render());
      this.events.on("choice:added", () => this.render());
      this.events.on("choice:removed", () => this.render());
      this.events.on("node:child-created", ({ childId }) => {
        this.pendingFocusNodeId = childId;
        const container = this.dom.get("nodesPageContainer");
        if (container && !container.classList.contains("hidden")) {
          this.render();
        }
      });
      this.events.on("node:created", ({ nodeId }) => {
        this.pendingFocusNodeId = nodeId;
        const container = this.dom.get("nodesPageContainer");
        if (container && !container.classList.contains("hidden")) {
          this.render();
        }
      });
    }
    /**
     * Render the nodes page
     * @param {string} filterQuery - Optional filter query
     */
    render(filterQuery = null) {
      const container = this.dom.get("nodesPageContainer");
      if (!container)
        return;
      const graph = this.state.getGraph();
      if (!graph)
        return;
      if (filterQuery !== null) {
        this.filterQuery = filterQuery;
      }
      const nodeIdToFocus = this.pendingFocusNodeId;
      this.pendingFocusNodeId = null;
      const scrollContainer = container.querySelector(".nodes-page-list") || container;
      const scrollTop = scrollContainer.scrollTop;
      const activeElement = document.activeElement;
      let activeElementState = null;
      let searchInputState = null;
      if (activeElement && activeElement.id === "nodesPageSearch") {
        searchInputState = {
          selectionStart: activeElement.selectionStart,
          selectionEnd: activeElement.selectionEnd
        };
      }
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        activeElementState = {
          nodeId: activeElement.dataset?.nodeId,
          choiceIndex: activeElement.dataset?.choiceIndex,
          className: activeElement.className,
          selectionStart: activeElement.selectionStart,
          selectionEnd: activeElement.selectionEnd
        };
      }
      const q = (this.filterQuery || "").toLowerCase();
      const allNodes = [...graph.nodes].sort((a, b) => compareIds(a.id, b.id));
      const nodes = allNodes.filter((n) => {
        if (!q)
          return true;
        if (String(n.id).includes(q) || n.title && n.title.toLowerCase().includes(q) || n.body && n.body.toLowerCase().includes(q)) {
          return true;
        }
        if (n.choices && Array.isArray(n.choices)) {
          return n.choices.some(
            (choice) => choice.label && choice.label.toLowerCase().includes(q)
          );
        }
        return false;
      });
      const nodeIds = new Set(graph.nodes.map((n) => String(n.id)));
      let html = `
      <div class="nodes-page-header">
        <h2>Knowledge Graph Management</h2>
        <div class="nodes-page-actions">
          <button id="btnNodesPageNewNode" class="primary">New Node</button>
        </div>
      </div>
      <div class="nodes-page-search-container">
        <input type="text" id="nodesPageSearch" 
               placeholder="Search nodes (id/title/content/choices)..." 
               value="${escapeHtml2(this.filterQuery)}"
               style="flex: 1; width: 100%;" />
        <button id="btnNodesPageClearFilters" 
                class="ghost" 
                title="Clear filters"
                ${this.filterQuery ? "" : 'style="display: none;"'}>Clear Filters</button>
      </div>
      <div class="nodes-page-stats">
        <span class="stat-item">Total Nodes: <strong>${allNodes.length}</strong></span>
        ${q ? `<span class="stat-item">Filtered: <strong>${nodes.length}</strong></span>` : ""}
      </div>
      <div class="nodes-page-list" id="nodesPageList">
    `;
      for (const node of nodes) {
        const incomingRefs = getIncomingReferences(node.id, graph.nodes);
        const hasIncoming = incomingRefs.length > 0;
        const isOrphan = !isReferenced(node.id, graph.nodes) && node.choices.length === 0;
        const missingTitle = !node.title || !node.title.trim();
        const missingDescription = !node.body || !node.body.trim();
        const invalidChoices = node.choices.filter((c) => {
          const targetId = String(c.to || "").trim();
          return !targetId || !nodeIds.has(targetId);
        });
        html += `
        <div class="node-card" data-node-id="${escapeHtml2(String(node.id))}">
          <div class="node-card-header">
            <div class="node-id-section">
              <span class="node-id-badge">#${escapeHtml2(String(node.id))}</span>
              ${isOrphan ? '<span class="badge warn" title="Node not referenced by any other node">Orphan</span>' : ""}
              ${missingTitle ? '<span class="badge danger" title="Missing title">No Title</span>' : ""}
              ${missingDescription ? '<span class="badge danger" title="Missing description">No Description</span>' : ""}
              ${invalidChoices.length > 0 ? `<span class="badge warn" title="Invalid choice targets">${invalidChoices.length} Invalid Choice${invalidChoices.length > 1 ? "s" : ""}</span>` : ""}
            </div>
            <div class="node-card-actions">
              <button class="btn-node-edit" data-action="edit" data-node-id="${escapeHtml2(String(node.id))}" title="Edit">\u270F\uFE0F</button>
              <button class="btn-node-clone" data-action="clone" data-node-id="${escapeHtml2(String(node.id))}" title="Clone">\u{1F4CB}</button>
              <button class="btn-node-delete" data-action="delete" data-node-id="${escapeHtml2(String(node.id))}" title="Delete">\u{1F5D1}\uFE0F</button>
            </div>
          </div>
          
          <div class="node-card-content">
            <div class="node-field">
              <label>Title</label>
              <input type="text" class="node-title-input" data-node-id="${escapeHtml2(String(node.id))}" 
                     value="${escapeHtml2(node.title || "")}" placeholder="Node title" />
            </div>
            
            <div class="node-field">
              <label>Description</label>
              <textarea class="node-description-input" data-node-id="${escapeHtml2(String(node.id))}" 
                        rows="3" placeholder="Node description">${escapeHtml2(node.body || "")}</textarea>
            </div>
            
            <div class="node-field">
              <div class="node-field-header">
                <label>Choices (${node.choices.length})</label>
                <div class="node-field-actions">
                  <button class="btn-add-child" data-node-id="${escapeHtml2(String(node.id))}" title="Add Child Node">+ Add Child</button>
                  <button class="btn-add-choice" data-node-id="${escapeHtml2(String(node.id))}">+ Add Choice</button>
                </div>
              </div>
              <div class="choices-list" data-node-id="${escapeHtml2(String(node.id))}">
      `;
        node.choices.forEach((choice, idx) => {
          const isValid = nodeIds.has(String(choice.to || ""));
          const targetId = String(choice.to || "").trim();
          const hasValidTarget = targetId && nodeIds.has(targetId);
          html += `
          <div class="choice-item ${!isValid ? "invalid" : ""}" data-choice-index="${idx}">
            <input type="text" class="choice-label-input" 
                   data-node-id="${escapeHtml2(String(node.id))}" 
                   data-choice-index="${idx}"
                   value="${escapeHtml2(choice.label || "")}" 
                   placeholder="Choice label" />
            <button class="btn-goto-choice-target" 
                    data-node-id="${escapeHtml2(String(node.id))}" 
                    data-choice-index="${idx}"
                    data-target-id="${escapeHtml2(targetId)}"
                    title="Go to target node"
                    style="${hasValidTarget ? "" : "display:none;"}">\u2192</button>
            <input type="text" class="choice-target-input" 
                   data-node-id="${escapeHtml2(String(node.id))}" 
                   data-choice-index="${idx}"
                   value="${escapeHtml2(String(choice.to || ""))}" 
                   placeholder="Target node ID" 
                   list="nodeIdsList" />
            ${!isValid ? '<span class="choice-error" title="Target node does not exist">\u26A0\uFE0F</span>' : ""}
            <button class="btn-remove-choice" 
                    data-node-id="${escapeHtml2(String(node.id))}" 
                    data-choice-index="${idx}" 
                    title="Remove choice">\xD7</button>
          </div>
        `;
        });
        html += `
              </div>
            </div>
            
            ${hasIncoming ? `
            <div class="node-field">
              <label>Incoming References (${incomingRefs.length})</label>
              <div class="incoming-refs">
      ` : ""}
      
      ${incomingRefs.map((ref) => {
          const nodeId = String(ref.node.id);
          const nodeAnchor = `#node-${nodeId}`;
          return `
                <div class="incoming-ref-item">
                  <a href="${nodeAnchor}" class="ref-node-id-link" data-node-id="${escapeHtml2(nodeId)}" title="Go to node #${escapeHtml2(nodeId)}">#${escapeHtml2(nodeId)}</a>
                  <span class="ref-choice-label">"${escapeHtml2(ref.choice.label || "")}"</span>
                  <span class="ref-node-title">${escapeHtml2(ref.node.title || "")}</span>
                </div>
      `;
        }).join("")}
      
      ${hasIncoming ? `
              </div>
            </div>
      ` : ""}
          </div>
        </div>
      `;
      }
      html += `
      </div>
      <datalist id="nodeIdsList">
        ${graph.nodes.map((n) => `<option value="${escapeHtml2(String(n.id))}">${escapeHtml2(n.title || "")}</option>`).join("")}
      </datalist>
    `;
      container.innerHTML = html;
      this.attachEventListeners();
      if (searchInputState) {
        setTimeout(() => {
          const searchInput = container.querySelector("#nodesPageSearch");
          if (searchInput) {
            searchInput.focus();
            if (searchInput.setSelectionRange && searchInputState.selectionStart !== null) {
              try {
                searchInput.setSelectionRange(searchInputState.selectionStart, searchInputState.selectionEnd);
              } catch (e) {
              }
            }
          }
        }, 0);
      }
      const newScrollContainer = container.querySelector(".nodes-page-list") || container;
      if (newScrollContainer && scrollTop !== void 0) {
        newScrollContainer.scrollTop = scrollTop;
      }
      if (activeElementState && !nodeIdToFocus) {
        setTimeout(() => {
          let elementToFocus = null;
          if (activeElementState.className.includes("node-title-input")) {
            elementToFocus = container.querySelector(`.node-title-input[data-node-id="${activeElementState.nodeId}"]`);
          } else if (activeElementState.className.includes("node-description-input")) {
            elementToFocus = container.querySelector(`.node-description-input[data-node-id="${activeElementState.nodeId}"]`);
          } else if (activeElementState.className.includes("choice-label-input")) {
            elementToFocus = container.querySelector(`.choice-label-input[data-node-id="${activeElementState.nodeId}"][data-choice-index="${activeElementState.choiceIndex}"]`);
          } else if (activeElementState.className.includes("choice-target-input")) {
            elementToFocus = container.querySelector(`.choice-target-input[data-node-id="${activeElementState.nodeId}"][data-choice-index="${activeElementState.choiceIndex}"]`);
          }
          if (elementToFocus) {
            elementToFocus.focus();
            if (elementToFocus.setSelectionRange && activeElementState.selectionStart !== null) {
              try {
                elementToFocus.setSelectionRange(activeElementState.selectionStart, activeElementState.selectionEnd);
              } catch (e) {
              }
            }
          }
        }, 0);
      }
      if (nodeIdToFocus) {
        setTimeout(() => {
          this.focusOnNode(nodeIdToFocus);
        }, 50);
      }
    }
    /**
     * Function to auto-resize input/textarea to fit content
     */
    autoResize(element, minHeight = 40) {
      if (!element.classList.contains("expanded")) {
        element.style.height = "";
        return;
      }
      if (element.tagName === "TEXTAREA") {
        element.style.height = "auto";
        const newHeight = Math.max(minHeight, element.scrollHeight);
        element.style.height = newHeight + "px";
      } else if (element.tagName === "INPUT") {
        const temp = document.createElement("div");
        const styles = window.getComputedStyle(element);
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.whiteSpace = "pre-wrap";
        temp.style.wordWrap = "break-word";
        temp.style.overflowWrap = "break-word";
        temp.style.width = (element.offsetWidth || 200) + "px";
        temp.style.font = styles.font;
        temp.style.fontSize = styles.fontSize;
        temp.style.fontFamily = styles.fontFamily;
        temp.style.fontWeight = styles.fontWeight;
        temp.style.lineHeight = styles.lineHeight;
        temp.style.padding = styles.padding;
        temp.style.border = styles.border;
        temp.style.boxSizing = styles.boxSizing;
        temp.style.margin = styles.margin;
        temp.textContent = element.value || element.placeholder || "M";
        document.body.appendChild(temp);
        const newHeight = Math.max(minHeight, temp.offsetHeight);
        document.body.removeChild(temp);
        element.style.height = newHeight + "px";
      }
    }
    /**
     * Attach event listeners to dynamically created elements
     */
    attachEventListeners() {
      const container = this.dom.get("nodesPageContainer");
      if (!container)
        return;
      const btnNewNode = container.querySelector("#btnNodesPageNewNode");
      if (btnNewNode) {
        btnNewNode.onclick = () => {
          this.events.emit("node:create-requested");
        };
      }
      const searchInput = container.querySelector("#nodesPageSearch");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          this.filterQuery = searchInput.value;
          const clearBtn = container.querySelector("#btnNodesPageClearFilters");
          if (clearBtn) {
            clearBtn.style.display = this.filterQuery ? "" : "none";
          }
          this.render();
        });
      }
      const clearFiltersBtn = container.querySelector("#btnNodesPageClearFilters");
      if (clearFiltersBtn) {
        clearFiltersBtn.onclick = () => {
          this.filterQuery = "";
          this.render();
        };
      }
      container.querySelectorAll(".node-title-input").forEach((input) => {
        input.onfocus = () => {
          input.classList.add("expanded");
          setTimeout(() => this.autoResize(input, 40), 0);
        };
        input.onblur = () => {
          input.classList.remove("expanded");
          input.style.height = "";
        };
        input.oninput = () => {
          this.autoResize(input, 40);
          const nodeId = input.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            node.title = input.value;
            this.events.emit("node:updated", node);
          }
        };
      });
      container.querySelectorAll(".node-description-input").forEach((textarea) => {
        textarea.onfocus = () => {
          textarea.classList.add("expanded");
          setTimeout(() => this.autoResize(textarea, 60), 0);
        };
        textarea.onblur = () => {
          textarea.classList.remove("expanded");
          textarea.style.height = "";
        };
        textarea.oninput = () => {
          this.autoResize(textarea, 60);
          const nodeId = textarea.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            node.body = textarea.value;
            this.events.emit("node:updated", node);
          }
        };
      });
      container.querySelectorAll(".choice-label-input").forEach((input) => {
        input.onfocus = () => {
          input.classList.add("expanded");
          setTimeout(() => this.autoResize(input, 40), 0);
        };
        input.onblur = () => {
          input.classList.remove("expanded");
          input.style.height = "";
        };
        input.oninput = () => {
          this.autoResize(input, 40);
          const nodeId = input.dataset.nodeId;
          const choiceIndex = parseInt(input.dataset.choiceIndex);
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node && node.choices[choiceIndex]) {
            node.choices[choiceIndex].label = input.value;
            this.events.emit("node:updated", node);
            this.events.emit("choice:updated", { node, choice: node.choices[choiceIndex] });
          }
        };
      });
      container.querySelectorAll(".choice-target-input").forEach((input) => {
        input.onfocus = () => {
          input.classList.add("expanded");
          setTimeout(() => this.autoResize(input, 40), 0);
        };
        input.onblur = () => {
          input.classList.remove("expanded");
          input.style.height = "";
        };
        input.oninput = () => {
          this.autoResize(input, 40);
          const nodeId = input.dataset.nodeId;
          const choiceIndex = parseInt(input.dataset.choiceIndex);
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node && node.choices[choiceIndex]) {
            node.choices[choiceIndex].to = String(input.value);
            const choiceItem = input.closest(".choice-item");
            const gotoBtn = choiceItem ? choiceItem.querySelector(".btn-goto-choice-target") : null;
            if (gotoBtn) {
              const targetId = String(input.value || "").trim();
              const nodeIds = new Set(graph.nodes.map((n) => String(n.id)));
              const hasValidTarget = targetId && nodeIds.has(targetId);
              gotoBtn.style.display = hasValidTarget ? "" : "none";
              gotoBtn.dataset.targetId = escapeHtml2(targetId);
            }
            this.events.emit("node:updated", node);
            this.events.emit("choice:updated", { node, choice: node.choices[choiceIndex] });
          }
        };
      });
      container.querySelectorAll(".btn-goto-choice-target").forEach((btn) => {
        btn.onclick = () => {
          const targetId = btn.dataset.targetId;
          if (targetId) {
            this.focusOnNode(targetId);
          }
        };
      });
      container.querySelectorAll(".btn-add-choice").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            const firstNodeId = graph.nodes[0]?.id ?? "1";
            node.choices.push({ label: "", to: String(firstNodeId) });
            this.events.emit("node:updated", node);
            this.events.emit("choice:added", { node });
          }
        };
      });
      container.querySelectorAll(".btn-remove-choice").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const choiceIndex = parseInt(btn.dataset.choiceIndex);
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node && node.choices[choiceIndex]) {
            node.choices.splice(choiceIndex, 1);
            this.events.emit("node:updated", node);
            this.events.emit("choice:removed", { node, index: choiceIndex });
          }
        };
      });
      container.querySelectorAll(".btn-node-clone").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            this.events.emit("node:clone-requested", node);
          }
        };
      });
      container.querySelectorAll(".btn-node-delete").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            if (!confirm(`Delete node #${node.id}? This will remove all references to this node.`))
              return;
            this.events.emit("node:delete-requested", node);
          }
        };
      });
      container.querySelectorAll(".btn-add-child").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const graph = this.state.getGraph();
          const node = byId(nodeId, graph.nodes);
          if (node) {
            this.events.emit("node:add-child-requested", node);
          }
        };
      });
      container.querySelectorAll(".ref-node-id-link").forEach((link) => {
        link.onclick = (e) => {
          e.preventDefault();
          const nodeId = link.dataset.nodeId;
          if (nodeId) {
            this.focusOnNode(nodeId);
          }
        };
      });
    }
    /**
     * Focus on a specific node by ID
     * Scrolls to the node card and focuses on the title input
     * @param {string|number} nodeId - Node ID to focus on
     */
    focusOnNode(nodeId) {
      const container = this.dom.get("nodesPageContainer");
      if (!container)
        return;
      const nodeCard = container.querySelector(`[data-node-id="${String(nodeId)}"]`);
      if (!nodeCard)
        return;
      nodeCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const titleInput = nodeCard.querySelector(".node-title-input");
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }, 300);
    }
  };

  // src/views/RunnerView.js
  var RunnerView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("session:changed", () => this.render());
      this.events.on("graph:changed", () => this.render());
      this.events.on("state:updated", () => this.render());
      this.events.on("navigation:advanced", () => this.render());
      this.events.on("history:tags-updated", () => this.render());
      this.events.on("node:child-created", ({ childId }) => {
        this.events.emit("navigation:advance-requested", childId);
      });
    }
    /**
     * Render the runner view
     */
    render() {
      const view = this.dom.get("runnerView");
      const startSelect = this.dom.get("startSelect");
      const runnerNodeId = this.dom.get("runnerNodeId");
      if (!view)
        return;
      view.innerHTML = "";
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      if (startSelect) {
        startSelect.innerHTML = graph.nodes.sort((a, b) => compareIds(a.id, b.id)).map((n) => `<option value="${n.id}">#${n.id} \xB7 ${escapeHtml2(n.title)}</option>`).join("");
      }
      if (runnerNodeId) {
        runnerNodeId.value = session.currentNodeId ?? "";
      }
      const node = byId(session.currentNodeId, graph.nodes);
      if (!node) {
        view.innerHTML = `<div class="muted">No node selected. Select Start and click <b>Start</b> or enter ID and click <b>Go</b>.</div>`;
        this.events.emit("history:render-requested");
        return;
      }
      const parentId = getParentId(node.id);
      if (parentId) {
        const parent = byId(parentId, graph.nodes);
        if (parent) {
          const parentLink = document.createElement("div");
          parentLink.className = "muted";
          parentLink.style.marginBottom = "8px";
          parentLink.style.fontSize = "0.9em";
          parentLink.innerHTML = `\u2191 Parent: <a href="#" style="text-decoration: underline; cursor: pointer;">#${parentId} \xB7 ${escapeHtml2(parent.title)}</a>`;
          parentLink.querySelector("a").onclick = (e) => {
            e.preventDefault();
            this.events.emit("navigation:advance-requested", parentId);
          };
          view.appendChild(parentLink);
        }
      }
      const h2 = document.createElement("h2");
      h2.textContent = `#${node.id} \xB7 ${node.title}`;
      view.appendChild(h2);
      const p = document.createElement("div");
      p.innerText = node.body;
      view.appendChild(p);
      const siblings = getSiblings(node.id, graph.nodes, getParentId, getChildren);
      const sortedSiblings = siblings.sort((a, b) => compareIds(a.id, b.id));
      const currentIdx = sortedSiblings.findIndex((n) => String(n.id) === String(node.id));
      const hasSiblings = sortedSiblings.length > 1;
      if (hasSiblings) {
        const navArea = document.createElement("div");
        navArea.className = "row";
        navArea.style.marginTop = "12px";
        navArea.style.gap = "6px";
        navArea.style.alignItems = "center";
        const prevSibling = currentIdx > 0 ? sortedSiblings[currentIdx - 1] : null;
        const nextSibling = currentIdx < sortedSiblings.length - 1 ? sortedSiblings[currentIdx + 1] : null;
        if (prevSibling) {
          const prevBtn = document.createElement("button");
          prevBtn.textContent = `\u2190 #${prevSibling.id}`;
          prevBtn.className = "ghost";
          prevBtn.onclick = () => this.events.emit("navigation:advance-requested", prevSibling.id);
          navArea.appendChild(prevBtn);
        }
        const siblingInfo = document.createElement("span");
        siblingInfo.className = "muted";
        siblingInfo.textContent = `${currentIdx + 1} / ${sortedSiblings.length}`;
        navArea.appendChild(siblingInfo);
        if (nextSibling) {
          const nextBtn = document.createElement("button");
          nextBtn.textContent = `#${nextSibling.id} \u2192`;
          nextBtn.className = "ghost";
          nextBtn.onclick = () => this.events.emit("navigation:advance-requested", nextSibling.id);
          navArea.appendChild(nextBtn);
        }
        view.appendChild(navArea);
      }
      const area = document.createElement("div");
      area.className = "col";
      area.style.marginTop = "8px";
      if (node.choices.length === 0) {
        const end = document.createElement("div");
        end.innerHTML = `<span class="badge ok">End of path</span>`;
        area.appendChild(end);
      } else {
        for (const ch of node.choices) {
          const btn = document.createElement("button");
          btn.textContent = `${ch.label || "(no label)"} \u2192 #${ch.to}`;
          const targetExists = !!byId(String(ch.to), graph.nodes);
          if (!targetExists) {
            btn.disabled = true;
            btn.title = "Target node does not exist";
            btn.classList.add("warn");
          }
          btn.onclick = () => this.events.emit("navigation:advance-requested", ch.to);
          area.appendChild(btn);
        }
      }
      view.appendChild(area);
      const addChildButton = document.createElement("button");
      addChildButton.textContent = "+ Add Child Node";
      addChildButton.className = "primary";
      addChildButton.style.width = "100%";
      addChildButton.style.marginTop = "12px";
      addChildButton.onclick = () => {
        this.events.emit("node:add-child-requested", node);
      };
      view.appendChild(addChildButton);
      const commentDivider = document.createElement("div");
      commentDivider.className = "divider";
      commentDivider.style.marginTop = "16px";
      commentDivider.style.marginBottom = "12px";
      view.appendChild(commentDivider);
      const commentLabel = document.createElement("label");
      commentLabel.className = "muted";
      commentLabel.style.marginBottom = "6px";
      commentLabel.textContent = "Step Comment";
      view.appendChild(commentLabel);
      let currentHistoryEntry = null;
      if (session.currentNodeId && session.history.length > 0) {
        for (let i = session.history.length - 1; i >= 0; i--) {
          if (String(session.history[i].id) === String(session.currentNodeId)) {
            currentHistoryEntry = session.history[i];
            break;
          }
        }
      }
      const commentTextarea = document.createElement("textarea");
      commentTextarea.placeholder = "Add a comment to this step...";
      commentTextarea.rows = 3;
      commentTextarea.value = currentHistoryEntry?.comment || "";
      commentTextarea.style.width = "100%";
      commentTextarea.style.resize = "vertical";
      commentTextarea.oninput = () => {
        if (currentHistoryEntry) {
          currentHistoryEntry.comment = commentTextarea.value;
          this.events.emit("history:comment-updated", currentHistoryEntry);
        } else if (session.currentNodeId && session.history.length > 0) {
          const node2 = byId(session.currentNodeId, graph.nodes);
          if (node2) {
            const newEntry = { id: node2.id, title: node2.title, body: node2.body, comment: commentTextarea.value, tags: [] };
            session.history.push(newEntry);
            currentHistoryEntry = newEntry;
            this.events.emit("history:entry-added", newEntry);
          }
        }
      };
      view.appendChild(commentTextarea);
      const tagsDivider = document.createElement("div");
      tagsDivider.className = "divider";
      tagsDivider.style.marginTop = "16px";
      tagsDivider.style.marginBottom = "12px";
      view.appendChild(tagsDivider);
      const tagsLabel = document.createElement("label");
      tagsLabel.className = "muted";
      tagsLabel.style.marginBottom = "6px";
      tagsLabel.textContent = 'Tags / Notes (e.g. "needs clarification", "customer reacted strongly", "requires SME review")';
      view.appendChild(tagsLabel);
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "col";
      tagsContainer.style.gap = "8px";
      tagsContainer.style.marginBottom = "8px";
      const tagsDisplay = document.createElement("div");
      tagsDisplay.className = "row";
      tagsDisplay.style.flexWrap = "wrap";
      tagsDisplay.style.gap = "6px";
      tagsDisplay.style.minHeight = "32px";
      const updateTagsDisplay = () => {
        tagsDisplay.innerHTML = "";
        const tags = currentHistoryEntry?.tags || [];
        tags.forEach((tag, idx) => {
          const tagPill = document.createElement("span");
          tagPill.className = "badge";
          tagPill.style.cursor = "pointer";
          tagPill.textContent = tag;
          tagPill.title = "Click to remove";
          tagPill.onclick = () => {
            if (currentHistoryEntry) {
              currentHistoryEntry.tags = currentHistoryEntry.tags.filter((_, i) => i !== idx);
              if (!Array.isArray(currentHistoryEntry.tags))
                currentHistoryEntry.tags = [];
              updateTagsDisplay();
              this.events.emit("history:tags-updated", currentHistoryEntry);
            }
          };
          tagsDisplay.appendChild(tagPill);
        });
      };
      updateTagsDisplay();
      tagsContainer.appendChild(tagsDisplay);
      const tagInputRow = document.createElement("div");
      tagInputRow.className = "row";
      tagInputRow.style.gap = "8px";
      tagInputRow.style.alignItems = "center";
      const tagInput = document.createElement("input");
      tagInput.type = "text";
      tagInput.placeholder = "Enter tag and press Enter or click Add";
      tagInput.style.flex = "1";
      tagInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const tagValue = tagInput.value.trim();
          if (tagValue) {
            if (!currentHistoryEntry) {
              const node2 = byId(session.currentNodeId, graph.nodes);
              if (node2) {
                const newEntry = { id: node2.id, title: node2.title, body: node2.body, comment: "", tags: [tagValue] };
                session.history.push(newEntry);
                currentHistoryEntry = newEntry;
                this.events.emit("history:entry-added", newEntry);
              }
            } else {
              if (!Array.isArray(currentHistoryEntry.tags))
                currentHistoryEntry.tags = [];
              if (!currentHistoryEntry.tags.includes(tagValue)) {
                currentHistoryEntry.tags.push(tagValue);
                this.events.emit("history:tags-updated", currentHistoryEntry);
              }
            }
            tagInput.value = "";
            updateTagsDisplay();
          }
        }
      };
      const tagAddBtn = document.createElement("button");
      tagAddBtn.textContent = "Add";
      tagAddBtn.className = "ghost";
      tagAddBtn.onclick = () => {
        const tagValue = tagInput.value.trim();
        if (tagValue) {
          if (!currentHistoryEntry) {
            const node2 = byId(session.currentNodeId, graph.nodes);
            if (node2) {
              const newEntry = { id: node2.id, title: node2.title, body: node2.body, comment: "", tags: [tagValue] };
              session.history.push(newEntry);
              currentHistoryEntry = newEntry;
              this.events.emit("history:entry-added", newEntry);
            }
          } else {
            if (!Array.isArray(currentHistoryEntry.tags))
              currentHistoryEntry.tags = [];
            if (!currentHistoryEntry.tags.includes(tagValue)) {
              currentHistoryEntry.tags.push(tagValue);
              this.events.emit("history:tags-updated", currentHistoryEntry);
            }
          }
          tagInput.value = "";
          updateTagsDisplay();
        }
      };
      tagInputRow.appendChild(tagInput);
      tagInputRow.appendChild(tagAddBtn);
      tagsContainer.appendChild(tagInputRow);
      view.appendChild(tagsContainer);
      const decisionDivider = document.createElement("div");
      decisionDivider.className = "divider";
      decisionDivider.style.marginTop = "16px";
      decisionDivider.style.marginBottom = "12px";
      view.appendChild(decisionDivider);
      const decisionLabel = document.createElement("label");
      decisionLabel.className = "muted";
      decisionLabel.style.marginBottom = "6px";
      decisionLabel.textContent = "Add Decision Option";
      view.appendChild(decisionLabel);
      const decisionForm = document.createElement("div");
      decisionForm.className = "col";
      decisionForm.style.gap = "8px";
      const decisionLabelInput = document.createElement("input");
      decisionLabelInput.type = "text";
      decisionLabelInput.placeholder = "Label (e.g. positive)";
      decisionLabelInput.style.width = "100%";
      decisionForm.appendChild(decisionLabelInput);
      const decisionToRow = document.createElement("div");
      decisionToRow.className = "row";
      decisionToRow.style.gap = "8px";
      decisionToRow.style.alignItems = "center";
      const decisionToInput = document.createElement("input");
      decisionToInput.type = "text";
      decisionToInput.placeholder = "To # (e.g. 1.1)";
      decisionToInput.style.flex = "1";
      decisionToRow.appendChild(decisionToInput);
      const decisionAddBtn = document.createElement("button");
      decisionAddBtn.textContent = "Add";
      decisionAddBtn.className = "primary";
      decisionAddBtn.onclick = () => {
        const label = decisionLabelInput.value.trim();
        const to = decisionToInput.value.trim();
        if (!label || !to) {
          alert("Fill in label and target");
          return;
        }
        if (!byId(to, graph.nodes)) {
          if (!confirm(`Node #${to} does not exist. Do you want to add the option anyway?`)) {
            return;
          }
        }
        this.events.emit("node:choice-add-requested", { node, label, to });
        decisionLabelInput.value = "";
        decisionToInput.value = "";
      };
      decisionToRow.appendChild(decisionAddBtn);
      decisionForm.appendChild(decisionToRow);
      view.appendChild(decisionForm);
      this.events.emit("history:render-requested");
    }
  };

  // src/views/HistoryView.js
  var HistoryView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("session:changed", () => this.render());
      this.events.on("history:render-requested", () => this.render());
      this.events.on("history:comment-updated", () => this.render());
      this.events.on("history:entry-added", () => this.render());
      this.events.on("history:tags-updated", () => this.render());
    }
    /**
     * Render the history view
     */
    render() {
      const history2 = this.dom.get("history");
      if (!history2)
        return;
      history2.innerHTML = "";
      const session = this.state.getSession();
      if (!session || !session.history)
        return;
      for (let i = 0; i < session.history.length; i++) {
        const entry = session.history[i];
        const entryId = typeof entry === "object" && entry !== null ? entry.id : entry;
        const entryTitle = typeof entry === "object" && entry !== null ? entry.title || "" : "";
        const entryBody = typeof entry === "object" && entry !== null ? entry.body || "" : "";
        const entryComment = typeof entry === "object" && entry !== null ? entry.comment || "" : "";
        const entryTags = typeof entry === "object" && entry !== null ? Array.isArray(entry.tags) ? entry.tags : [] : [];
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        if (String(entryId) === String(session.currentNodeId)) {
          historyItem.classList.add("active");
        }
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = `#${entryId}`;
        const content = document.createElement("div");
        content.className = "history-content";
        const title = document.createElement("div");
        title.className = "history-title";
        title.textContent = entryTitle || `#${entryId}`;
        const body = document.createElement("div");
        body.className = "history-body";
        body.textContent = entryBody || "";
        content.appendChild(title);
        if (entryBody) {
          content.appendChild(body);
        }
        if (entryComment) {
          const comment = document.createElement("div");
          comment.className = "history-comment";
          comment.textContent = entryComment;
          content.appendChild(comment);
        }
        if (entryTags && entryTags.length > 0) {
          const tagsContainer = document.createElement("div");
          tagsContainer.className = "row";
          tagsContainer.style.flexWrap = "wrap";
          tagsContainer.style.gap = "4px";
          tagsContainer.style.marginTop = "6px";
          entryTags.forEach((tag) => {
            const tagPill = document.createElement("span");
            tagPill.className = "badge";
            tagPill.style.fontSize = "0.85em";
            tagPill.textContent = tag;
            tagsContainer.appendChild(tagPill);
          });
          content.appendChild(tagsContainer);
        }
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "history-delete-btn";
        deleteBtn.innerHTML = "\xD7";
        deleteBtn.title = "Remove this step from history";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (!confirm(`Remove step #${entryId} from history?`))
            return;
          this.events.emit("history:delete-requested", { index: i, entryId });
        };
        historyItem.appendChild(pill);
        historyItem.appendChild(content);
        historyItem.appendChild(deleteBtn);
        historyItem.onclick = () => {
          this.events.emit("history:entry-selected", entryId);
        };
        history2.appendChild(historyItem);
      }
    }
  };

  // src/views/TilesView.js
  var TilesView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("graph:changed", () => this.render());
      this.events.on("session:changed", () => this.render());
      this.events.on("view:changed", (view) => {
        if (view === "tiles")
          this.render();
      });
      this.events.on("state:updated", () => {
        const viewManager = this.viewManager;
        if (viewManager && viewManager.getCurrentView() === "tiles") {
          this.render();
        }
      });
    }
    setViewManager(viewManager) {
      this.viewManager = viewManager;
    }
    /**
     * Render the tiles view
     */
    render() {
      const container = this.dom.get("tilesContainer");
      const svg = this.dom.get("connectionsSvg");
      const filter = this.dom.get("filter");
      if (!container || !svg)
        return;
      container.innerHTML = "";
      svg.innerHTML = "";
      const graph = this.state.getGraph();
      const session = this.state.getSession();
      if (!graph || !session)
        return;
      const q = filter ? filter.value.toLowerCase() : "";
      const nodes = [...graph.nodes].sort((a, b) => compareIds(a.id, b.id)).filter((n) => !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
      const tiles = [];
      const nodePositions = /* @__PURE__ */ new Map();
      nodes.forEach((node) => {
        const tile = document.createElement("div");
        tile.className = "node-tile";
        tile.dataset.nodeId = String(node.id);
        if (String(session.currentNodeId) === String(node.id)) {
          tile.classList.add("active");
        }
        const tileId = document.createElement("div");
        tileId.className = "tile-id";
        tileId.textContent = `#${node.id}`;
        const tileTitle = document.createElement("div");
        tileTitle.className = "tile-title";
        tileTitle.textContent = node.title || "(no title)";
        const tileBody = document.createElement("div");
        tileBody.className = "tile-body";
        tileBody.textContent = node.body || "(no content)";
        const tileChoices = document.createElement("div");
        tileChoices.className = "tile-choices";
        if (node.choices.length > 0) {
          node.choices.forEach((choice) => {
            const choiceBadge = document.createElement("span");
            choiceBadge.className = "choice-badge";
            choiceBadge.textContent = `${choice.label || "(no label)"} \u2192 #${choice.to}`;
            const targetExists = !!byId(String(choice.to), graph.nodes);
            if (!targetExists) {
              choiceBadge.classList.add("invalid");
            }
            tileChoices.appendChild(choiceBadge);
          });
        } else {
          const endBadge = document.createElement("span");
          endBadge.className = "choice-badge end";
          endBadge.textContent = "End";
          tileChoices.appendChild(endBadge);
        }
        tile.appendChild(tileId);
        tile.appendChild(tileTitle);
        tile.appendChild(tileBody);
        tile.appendChild(tileChoices);
        container.appendChild(tile);
        tiles.push({ node, tile });
      });
      const tileWidth = 280;
      const tileHeight = 200;
      const padding = 20;
      const cols = Math.max(1, Math.floor((container.offsetWidth || 400) / (tileWidth + padding)));
      tiles.forEach((item, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * (tileWidth + padding) + padding;
        const y = row * (tileHeight + padding) + padding;
        item.tile.style.position = "absolute";
        item.tile.style.left = `${x}px`;
        item.tile.style.top = `${y}px`;
        item.tile.style.width = `${tileWidth}px`;
        const centerX = x + tileWidth / 2;
        const centerY = y + tileHeight / 2;
        nodePositions.set(String(item.node.id), { x: centerX, y: centerY, tile: item.tile });
      });
      const totalRows = Math.ceil(tiles.length / cols);
      container.style.height = `${totalRows * (tileHeight + padding) + padding}px`;
      svg.setAttribute("width", container.offsetWidth || 400);
      svg.setAttribute("height", container.style.height);
      nodes.forEach((node) => {
        node.choices.forEach((choice) => {
          const fromPos = nodePositions.get(String(node.id));
          const toPos = nodePositions.get(String(choice.to));
          if (fromPos && toPos) {
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const offsetX = Math.cos(angle) * (tileWidth / 2);
            const offsetY = Math.sin(angle) * (tileHeight / 2);
            const x1 = fromPos.x + offsetX;
            const y1 = fromPos.y + offsetY;
            const x2 = toPos.x - offsetX;
            const y2 = toPos.y - offsetY;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", "var(--primary)");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("marker-end", "url(#arrowhead)");
            line.setAttribute("opacity", "0.5");
            svg.appendChild(line);
          }
        });
      });
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", "arrowhead");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "3");
      marker.setAttribute("orient", "auto");
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", "0 0, 10 3, 0 6");
      polygon.setAttribute("fill", "var(--primary)");
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svg.appendChild(defs);
      tiles.forEach((item) => {
        item.tile.style.cursor = "pointer";
        item.tile.onclick = () => {
          this.events.emit("navigation:start-requested", item.node.id);
        };
      });
      if (session.currentNodeId) {
        const activeTile = container.querySelector(`[data-node-id="${session.currentNodeId}"]`);
        if (activeTile) {
          setTimeout(() => {
            activeTile.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }
      if (!window.tilesResizeHandler) {
        window.tilesResizeHandler = true;
        let resizeTimeout;
        window.addEventListener("resize", () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (this.viewManager && this.viewManager.getCurrentView() === "tiles") {
              this.render();
            }
          }, 250);
        });
      }
    }
  };

  // src/views/ErrorsView.js
  var ErrorsView = class {
    constructor(validationService, eventBus, domRegistry) {
      this.validation = validationService;
      this.events = eventBus;
      this.dom = domRegistry;
      this.emptyReferences = [];
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("validation:updated", (data) => {
        this.emptyReferences = data.emptyReferences || [];
        this.render();
      });
    }
    /**
     * Render the errors view
     */
    render() {
      const errorsSection = this.dom.get("errorsSection");
      const errorsList = this.dom.get("errorsList");
      if (!errorsSection || !errorsList)
        return;
      if (this.emptyReferences.length === 0) {
        errorsSection.classList.add("hidden");
        return;
      }
      errorsSection.classList.remove("hidden");
      errorsList.innerHTML = "";
      for (const error of this.emptyReferences) {
        const errorItem = document.createElement("div");
        errorItem.className = "error-item";
        const nodeInfo = document.createElement("div");
        nodeInfo.className = "error-item-node";
        nodeInfo.textContent = `#${error.nodeId} \xB7 ${error.nodeTitle || "(no title)"}`;
        const detail = document.createElement("div");
        detail.className = "error-item-detail";
        if (error.targetId) {
          detail.textContent = `Choice "${error.choiceLabel}" \u2192 Missing target: #${error.targetId}`;
        } else {
          detail.textContent = `Choice "${error.choiceLabel}" \u2192 Empty reference (no target specified)`;
        }
        errorItem.appendChild(nodeInfo);
        errorItem.appendChild(detail);
        errorsList.appendChild(errorItem);
      }
    }
  };

  // src/views/KnowledgeGapsView.js
  var KnowledgeGapsView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
      this.setupEventListeners();
    }
    setupEventListeners() {
      this.events.on("graph:changed", () => this.render());
      this.events.on("node:updated", () => this.render());
      this.events.on("choice:added", () => this.render());
      this.events.on("choice:removed", () => this.render());
      this.events.on("choice:updated", () => this.render());
    }
    /**
     * Analyze the graph for knowledge gaps
     * @returns {Object} Analysis results with categorized issues
     */
    analyzeGaps() {
      const graph = this.state.getGraph();
      if (!graph || !graph.nodes) {
        return {
          brokenConnections: [],
          deadEnds: [],
          emptyTitles: [],
          emptyDescriptions: [],
          emptyChoiceLabels: [],
          summary: {
            brokenLinks: 0,
            deadEnds: 0,
            emptyTitles: 0,
            emptyDescriptions: 0,
            emptyChoiceLabels: 0
          }
        };
      }
      const nodeIds = new Set(graph.nodes.map((n) => String(n.id)));
      const brokenConnections = [];
      const deadEnds = [];
      const emptyTitles = [];
      const emptyDescriptions = [];
      const emptyChoiceLabels = [];
      for (const node of graph.nodes) {
        const nodeId = String(node.id);
        if (!node.title || !node.title.trim()) {
          emptyTitles.push({ nodeId, node });
        }
        if (!node.body || !node.body.trim()) {
          emptyDescriptions.push({ nodeId, node });
        }
        for (let i = 0; i < node.choices.length; i++) {
          const choice = node.choices[i];
          const targetId = String(choice.to || "").trim();
          if (!choice.label || !choice.label.trim()) {
            emptyChoiceLabels.push({ nodeId, choiceIndex: i, choice, node });
          }
          if (!targetId || !nodeIds.has(targetId)) {
            brokenConnections.push({
              nodeId,
              choiceIndex: i,
              choice,
              node,
              targetId: targetId || "(empty)"
            });
          }
        }
        if (node.choices.length === 0) {
          const isReferencedByOthers = isReferenced(nodeId, graph.nodes);
          if (!isReferencedByOthers) {
            const isRootNode = !nodeId.includes(".");
            deadEnds.push({ nodeId, node, isRootNode });
          }
        }
      }
      return {
        brokenConnections,
        deadEnds,
        emptyTitles,
        emptyDescriptions,
        emptyChoiceLabels,
        summary: {
          brokenLinks: brokenConnections.length,
          deadEnds: deadEnds.length,
          emptyTitles: emptyTitles.length,
          emptyDescriptions: emptyDescriptions.length,
          emptyChoiceLabels: emptyChoiceLabels.length
        }
      };
    }
    /**
     * Render the knowledge gaps page
     */
    render() {
      const container = this.dom.get("knowledgeGapsContainer");
      if (!container) {
        console.warn("KnowledgeGapsView: Container not found");
        return;
      }
      const analysis = this.analyzeGaps();
      const totalIssues = Object.values(analysis.summary).reduce((sum, count) => sum + count, 0);
      let html = `
      <div class="knowledge-gaps-header">
        <h2>Knowledge Gaps \u2013 Quality Assurance</h2>
        <div class="knowledge-gaps-summary">
          ${totalIssues === 0 ? '<span class="badge ok">All Clear \u2013 No Issues Found</span>' : `<span class="badge danger">${totalIssues} Total Issue${totalIssues !== 1 ? "s" : ""}</span>`}
        </div>
      </div>

      <div class="knowledge-gaps-stats">
        <div class="stat-card ${analysis.summary.brokenLinks > 0 ? "has-issues" : ""}">
          <div class="stat-label">Broken Links</div>
          <div class="stat-value ${analysis.summary.brokenLinks > 0 ? "danger" : "ok"}">${analysis.summary.brokenLinks}</div>
          <div class="stat-severity">High</div>
        </div>
        <div class="stat-card ${analysis.summary.deadEnds > 0 ? "has-issues" : ""}">
          <div class="stat-label">Dead Ends</div>
          <div class="stat-value ${analysis.summary.deadEnds > 0 ? "warn" : "ok"}">${analysis.summary.deadEnds}</div>
          <div class="stat-severity">High</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyTitles > 0 ? "has-issues" : ""}">
          <div class="stat-label">Empty Titles</div>
          <div class="stat-value ${analysis.summary.emptyTitles > 0 ? "warn" : "ok"}">${analysis.summary.emptyTitles}</div>
          <div class="stat-severity">Medium</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyDescriptions > 0 ? "has-issues" : ""}">
          <div class="stat-label">Empty Descriptions</div>
          <div class="stat-value ${analysis.summary.emptyDescriptions > 0 ? "warn" : "ok"}">${analysis.summary.emptyDescriptions}</div>
          <div class="stat-severity">Medium</div>
        </div>
        <div class="stat-card ${analysis.summary.emptyChoiceLabels > 0 ? "has-issues" : ""}">
          <div class="stat-label">Empty Choice Labels</div>
          <div class="stat-value ${analysis.summary.emptyChoiceLabels > 0 ? "warn" : "ok"}">${analysis.summary.emptyChoiceLabels}</div>
          <div class="stat-severity">Medium</div>
        </div>
      </div>
    `;
      if (analysis.brokenConnections.length > 0) {
        html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge danger">${analysis.brokenConnections.length}</span>
            Broken Connections
            <span class="gaps-section-subtitle">Choices pointing to non-existing nodes</span>
          </h3>
          <div class="gaps-list">
      `;
        for (const issue of analysis.brokenConnections) {
          html += `
          <div class="gap-item" data-node-id="${escapeHtml2(issue.nodeId)}" data-choice-index="${issue.choiceIndex}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml2(issue.nodeId)}</span>
                <span class="badge danger">Broken Link</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Choice Label:</strong> 
                  <span class="${!issue.choice.label || !issue.choice.label.trim() ? "text-muted" : ""}">
                    ${escapeHtml2(issue.choice.label || "(empty)")}
                  </span>
                </div>
                <div class="gap-detail">
                  <strong>Target Node:</strong> 
                  <span class="text-danger">#${escapeHtml2(issue.targetId)} (does not exist)</span>
                </div>
                ${issue.node.title ? `<div class="gap-detail"><strong>Node Title:</strong> ${escapeHtml2(issue.node.title)}</div>` : ""}
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml2(issue.nodeId)}" data-choice-index="${issue.choiceIndex}" title="Jump to node">Go to Node</button>
          </div>
        `;
        }
        html += `
          </div>
        </div>
      `;
      }
      if (analysis.deadEnds.length > 0) {
        html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.deadEnds.length}</span>
            Dead Ends
            <span class="gaps-section-subtitle">Nodes that do not lead anywhere and are not referenced</span>
          </h3>
          <div class="gaps-list">
      `;
        for (const issue of analysis.deadEnds) {
          html += `
          <div class="gap-item" data-node-id="${escapeHtml2(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml2(issue.nodeId)}</span>
                <span class="badge warn">Dead End</span>
                ${issue.isRootNode ? '<span class="badge" title="Root level node">Root</span>' : ""}
              </div>
              <div class="gap-item-details">
                ${issue.node.title ? `<div class="gap-detail"><strong>Title:</strong> ${escapeHtml2(issue.node.title)}</div>` : '<div class="gap-detail"><strong>Title:</strong> <span class="text-muted">(empty)</span></div>'}
                <div class="gap-detail">
                  <strong>Choices:</strong> 
                  <span class="text-muted">0 (no outgoing connections)</span>
                </div>
                <div class="gap-detail">
                  <strong>Incoming References:</strong> 
                  <span class="text-muted">None</span>
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml2(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
        }
        html += `
          </div>
        </div>
      `;
      }
      if (analysis.emptyTitles.length > 0) {
        html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyTitles.length}</span>
            Empty Titles
          </h3>
          <div class="gaps-list">
      `;
        for (const issue of analysis.emptyTitles) {
          html += `
          <div class="gap-item" data-node-id="${escapeHtml2(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml2(issue.nodeId)}</span>
                <span class="badge warn">Missing Title</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Description:</strong> 
                  ${issue.node.body && issue.node.body.trim() ? `<span>${escapeHtml2(issue.node.body.substring(0, 100))}${issue.node.body.length > 100 ? "..." : ""}</span>` : '<span class="text-muted">(empty)</span>'}
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml2(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
        }
        html += `
          </div>
        </div>
      `;
      }
      if (analysis.emptyDescriptions.length > 0) {
        html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyDescriptions.length}</span>
            Empty Descriptions
          </h3>
          <div class="gaps-list">
      `;
        for (const issue of analysis.emptyDescriptions) {
          html += `
          <div class="gap-item" data-node-id="${escapeHtml2(issue.nodeId)}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml2(issue.nodeId)}</span>
                <span class="badge warn">Missing Description</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Title:</strong> 
                  ${issue.node.title && issue.node.title.trim() ? `<span>${escapeHtml2(issue.node.title)}</span>` : '<span class="text-muted">(empty)</span>'}
                </div>
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml2(issue.nodeId)}" title="Jump to node">Go to Node</button>
          </div>
        `;
        }
        html += `
          </div>
        </div>
      `;
      }
      if (analysis.emptyChoiceLabels.length > 0) {
        html += `
        <div class="gaps-section">
          <h3 class="gaps-section-title">
            <span class="badge warn">${analysis.emptyChoiceLabels.length}</span>
            Empty Choice Labels
          </h3>
          <div class="gaps-list">
      `;
        for (const issue of analysis.emptyChoiceLabels) {
          html += `
          <div class="gap-item" data-node-id="${escapeHtml2(issue.nodeId)}" data-choice-index="${issue.choiceIndex}">
            <div class="gap-item-content">
              <div class="gap-item-header">
                <span class="gap-node-id">Node #${escapeHtml2(issue.nodeId)}</span>
                <span class="badge warn">Empty Label</span>
              </div>
              <div class="gap-item-details">
                <div class="gap-detail">
                  <strong>Choice Target:</strong> 
                  <span>#${escapeHtml2(String(issue.choice.to || ""))}</span>
                </div>
                ${issue.node.title ? `<div class="gap-detail"><strong>Node Title:</strong> ${escapeHtml2(issue.node.title)}</div>` : ""}
              </div>
            </div>
            <button class="btn-goto-node" data-node-id="${escapeHtml2(issue.nodeId)}" data-choice-index="${issue.choiceIndex}" title="Jump to node">Go to Node</button>
          </div>
        `;
        }
        html += `
          </div>
        </div>
      `;
      }
      if (totalIssues === 0) {
        html += `
        <div class="gaps-empty-state">
          <div class="empty-state-icon">\u2713</div>
          <h3>No Knowledge Gaps Found</h3>
          <p>Your decision graph is complete and consistent. All nodes have titles and descriptions, all choices have labels, and all connections are valid.</p>
        </div>
      `;
      }
      container.innerHTML = html;
      this.attachEventListeners();
    }
    /**
     * Attach event listeners to dynamically created elements
     */
    attachEventListeners() {
      const container = this.dom.get("knowledgeGapsContainer");
      if (!container)
        return;
      container.querySelectorAll(".btn-goto-node").forEach((btn) => {
        btn.onclick = () => {
          const nodeId = btn.dataset.nodeId;
          const choiceIndex = btn.dataset.choiceIndex;
          this.events.emit("gaps:goto-node", { nodeId, choiceIndex });
        };
      });
    }
  };

  // src/views/HelpView.js
  var HelpView = class {
    constructor(stateManager, eventBus, domRegistry) {
      this.state = stateManager;
      this.events = eventBus;
      this.dom = domRegistry;
    }
    /**
     * Render the help page
     */
    render() {
      const container = this.dom.get("helpContainer");
      if (!container) {
        console.warn("HelpView: Container not found");
        return;
      }
      const html = `
      <div class="help-page">
        <div class="help-header">
          <h1>PathwiseAurora User Guide</h1>
          <p class="help-subtitle">Step-by-step guide to using the problem-solving tool</p>
        </div>

        <div class="help-content">
          <!-- Introduction -->
          <section class="help-section">
            <h2>1. Introduction</h2>
            <p>PathwiseAurora is a tool for creating and navigating decision graphs. It allows you to:</p>
            <ul>
              <li>Create nodes representing problems or steps</li>
              <li>Define choices leading to subsequent nodes</li>
              <li>Track problem-solving sessions</li>
              <li>Add comments and tags to steps</li>
              <li>Export and import graphs</li>
            </ul>
          </section>

          <!-- Basic steps -->
          <section class="help-section">
            <h2>2. Getting Started</h2>
            
            <h3>2.1. Starting a Session</h3>
            <ol>
              <li>In the right panel (Runner), select a starting node from the <strong>Start</strong> dropdown</li>
              <li>Click the <strong>Start</strong> button (blue button)</li>
              <li>Alternatively, enter a node ID (e.g., "1" or "1.1") in the <strong>Current Node</strong> field and click <strong>Go</strong></li>
            </ol>

            <h3>2.2. Navigating Through Problems</h3>
            <ol>
              <li>After starting a session, you'll see the problem/step description in the right panel</li>
              <li>Read the problem description in the <strong>Body</strong> section</li>
              <li>Below you'll find choice buttons - each button leads to a different node</li>
              <li>Click the button that matches your situation</li>
              <li>The application will automatically navigate to the next node</li>
            </ol>

            <h3>2.3. Solving Problems Step by Step</h3>
            <ol>
              <li><strong>Read the title and description</strong> - Each node contains a title (short summary) and description (detailed information about the problem/step)</li>
              <li><strong>Analyze available choices</strong> - Each button represents a possible solution path</li>
              <li><strong>Select the appropriate option</strong> - Click the button that best describes your situation</li>
              <li><strong>Continue navigation</strong> - Repeat the process until you reach a solution (a node without choices indicates the end of a path)</li>
              <li><strong>Add comments</strong> - In the "Step Comment" section, you can add notes to each step</li>
              <li><strong>Add tags</strong> - In the "Tags / Notes" section, you can tag steps (e.g., "needs clarification", "customer reacted strongly", "requires SME review")</li>
            </ol>
          </section>

          <!-- Buttons and their functions -->
          <section class="help-section">
            <h2>3. Button Descriptions and Functions</h2>

            <h3>3.1. Navigation Buttons (Top Bar)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example nav-button active">Main</button>
                <div class="help-button-desc">
                  <strong>Main</strong> - Switches to the main view with node list and Runner panel
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Nodes</button>
                <div class="help-button-desc">
                  <strong>Nodes</strong> - Switches to the node management page (editing, creating, deleting)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Gaps</button>
                <div class="help-button-desc">
                  <strong>Gaps</strong> - Switches to the knowledge gaps analysis page (detects incomplete nodes, broken connections)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Help</button>
                <div class="help-button-desc">
                  <strong>Help</strong> - Opens this help page with instructions
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Import JSON</button>
                <div class="help-button-desc">
                  <strong>Import JSON</strong> - Imports a graph from a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Export JSON</button>
                <div class="help-button-desc">
                  <strong>Export JSON</strong> - Exports the current graph to a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Save Session Flow</button>
                <div class="help-button-desc">
                  <strong>Save Session Flow</strong> - Saves the session history (the path taken) to a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Email Summary</button>
                <div class="help-button-desc">
                  <strong>Email Summary</strong> - Generates a session summary in text or HTML format for copying
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">New Node</button>
                <div class="help-button-desc">
                  <strong>New Node</strong> - Creates a new node in the graph
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example danger">New Session</button>
                <div class="help-button-desc">
                  <strong>New Session</strong> - Starts a new session (clears history, preserves graph)
                </div>
              </div>
            </div>

            <h3>3.2. Runner Panel Buttons (Right Panel)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example primary">Start</button>
                <div class="help-button-desc">
                  <strong>Start</strong> - Starts a session from the selected node in the dropdown
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Go</button>
                <div class="help-button-desc">
                  <strong>Go</strong> - Navigates to the node with the ID entered in the "Current Node" field
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">Back</button>
                <div class="help-button-desc">
                  <strong>Back</strong> - Returns to the previous node in history (keyboard shortcut: \u2190)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example warn">Reset</button>
                <div class="help-button-desc">
                  <strong>Reset</strong> - Resets the session (clears history, sets current node to null)
                </div>
              </div>
            </div>

            <h3>3.3. Node List View Buttons (Left Panel)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example view-switcher active">List</button>
                <div class="help-button-desc">
                  <strong>List</strong> - Switches to list view of nodes
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example view-switcher">Tiles</button>
                <div class="help-button-desc">
                  <strong>Tiles</strong> - Switches to tiles view with connection visualization
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">Clear</button>
                <div class="help-button-desc">
                  <strong>Clear</strong> - Clears the search filter (keyboard shortcut: Esc)
                </div>
              </div>
            </div>

            <h3>3.4. Node Editor Buttons</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example">Add Choice</button>
                <div class="help-button-desc">
                  <strong>Add Choice</strong> - Adds a new choice to the node. Each choice has:
                  <ul>
                    <li><strong>Label</strong> - Choice label (e.g., "positive", "negative")</li>
                    <li><strong>To #</strong> - Target node ID (e.g., "1.1", "2")</li>
                  </ul>
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Add Child</button>
                <div class="help-button-desc">
                  <strong>Add Child</strong> - Creates a new child node (e.g., if node has ID "1", creates "1.1")
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Clone</button>
                <div class="help-button-desc">
                  <strong>Clone</strong> - Clones the node (creates a copy with a new ID)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example danger">Delete</button>
                <div class="help-button-desc">
                  <strong>Delete</strong> - Deletes the node (warning: also removes all references)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Remove</button>
                <div class="help-button-desc">
                  <strong>Remove</strong> - Removes a choice from the node
                </div>
              </div>
            </div>

            <h3>3.5. Runner Panel Buttons During Navigation</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <div class="help-button-desc">
                  <strong>Choice Buttons</strong> - Each node can have buttons representing different solution paths. 
                  Clicking a button navigates to the target node. The button is grayed out if the target node doesn't exist.
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">\u2190 #1.1</button>
                <div class="help-button-desc">
                  <strong>Sibling Navigation</strong> - If a node has siblings, buttons appear to navigate between them
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Add</button>
                <div class="help-button-desc">
                  <strong>Add (in Tags section)</strong> - Adds a tag to the current step
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Add</button>
                <div class="help-button-desc">
                  <strong>Add (in Add Decision Option section)</strong> - Adds a new choice to the current node during a session
                </div>
              </div>
            </div>
          </section>

          <!-- Keyboard shortcuts -->
          <section class="help-section">
            <h2>4. Keyboard Shortcuts</h2>
            <ul>
              <li><strong>Esc</strong> - Clears the search filter</li>
              <li><strong>\u2190</strong> (Left Arrow) - Goes back to the previous node</li>
              <li><strong>\u2192</strong> (Right Arrow) - Advances to the first choice of the current node</li>
              <li><strong>Ctrl + \u2190</strong> - Navigates to the previous sibling node</li>
              <li><strong>Ctrl + \u2192</strong> - Navigates to the next sibling node</li>
            </ul>
          </section>

          <!-- Problem solving -->
          <section class="help-section">
            <h2>5. How to Solve Problem Descriptions</h2>
            
            <h3>5.1. Node Structure</h3>
            <p>Each node consists of:</p>
            <ul>
              <li><strong>Title</strong> - Short summary of the problem/step</li>
              <li><strong>Body/Content</strong> - Detailed description of the situation, problem, or step to take</li>
              <li><strong>Choices</strong> - List of possible solution paths</li>
            </ul>

            <h3>5.2. Problem-Solving Process</h3>
            <ol>
              <li><strong>Read the title and description</strong> - Understand the problem context</li>
              <li><strong>Analyze available choices</strong> - Each button represents a different path</li>
              <li><strong>Select the appropriate option</strong> - Click the button that best describes your situation</li>
              <li><strong>Continue</strong> - Repeat the process until you reach a solution</li>
              <li><strong>Add notes</strong> - In the "Step Comment" section, you can record your thoughts</li>
              <li><strong>Tag important steps</strong> - Use tags to mark steps that require attention</li>
            </ol>

            <h3>5.3. Usage Example</h3>
            <div class="help-example">
              <p><strong>Step 1:</strong> Start a session by clicking "Start" at node "1"</p>
              <p><strong>Step 2:</strong> Read the problem description: "Production users report random 500 responses..."</p>
              <p><strong>Step 3:</strong> You'll see two choices:
                <ul>
                  <li>"Assess incident scope & impact" \u2192 leads to node 1.1</li>
                  <li>"Apply immediate mitigation" \u2192 leads to node 1.2</li>
                </ul>
              </p>
              <p><strong>Step 4:</strong> Select the appropriate option depending on your situation</p>
              <p><strong>Step 5:</strong> Continue navigation until you reach a solution (node without choices)</p>
            </div>
          </section>

          <!-- Node management -->
          <section class="help-section">
            <h2>6. Node Management</h2>
            
            <h3>6.1. Creating a Node</h3>
            <ol>
              <li>Click the <strong>New Node</strong> button in the top bar</li>
              <li>Or go to the <strong>Nodes</strong> page and use the node creation option</li>
              <li>Fill in the title and description</li>
              <li>Add choices if needed</li>
            </ol>

            <h3>6.2. Editing a Node</h3>
            <ol>
              <li>In the <strong>List</strong> view, find the node in the left panel</li>
              <li>Click in the <strong>Title</strong> or <strong>Content</strong> field and edit</li>
              <li>Changes are saved automatically</li>
              <li>You can add/remove choices using the <strong>Add Choice</strong> and <strong>Remove</strong> buttons</li>
            </ol>

            <h3>6.3. Hierarchical Structure</h3>
            <p>Nodes can be nested:</p>
            <ul>
              <li>Node "1" - main node</li>
              <li>Node "1.1" - child of node "1"</li>
              <li>Node "1.1.1" - child of node "1.1"</li>
            </ul>
            <p>Use the <strong>Add Child</strong> button to create a child node.</p>
          </section>

          <!-- Session history -->
          <section class="help-section">
            <h2>7. Session History</h2>
            <p>In the bottom Runner panel, you'll see the history of all visited nodes:</p>
            <ul>
              <li>Each node in history can be clicked to return to it</li>
              <li>You can add a comment to each step</li>
              <li>You can tag steps</li>
              <li>History is saved automatically</li>
            </ul>
          </section>

          <!-- Export and import -->
          <section class="help-section">
            <h2>8. Export and Import</h2>
            
            <h3>8.1. Export JSON</h3>
            <p>Exports the entire graph (all nodes) to a JSON file. Use this to:</p>
            <ul>
              <li>Save a backup</li>
              <li>Share the graph with other users</li>
              <li>Transfer the graph to another application instance</li>
            </ul>

            <h3>8.2. Save Session Flow</h3>
            <p>Saves only the session history (the path taken) to a JSON file. Useful for:</p>
            <ul>
              <li>Documenting a specific problem solution</li>
              <li>Analyzing chosen paths</li>
              <li>Reporting</li>
            </ul>

            <h3>8.3. Email Summary</h3>
            <p>Generates a session summary in text or HTML format. You can:</p>
            <ul>
              <li>Copy text to clipboard</li>
              <li>Paste into email</li>
              <li>Save as document</li>
            </ul>

            <h3>8.4. Import JSON</h3>
            <p>Imports a graph from a JSON file. Warning: import replaces the current graph!</p>
          </section>

          <!-- Knowledge gaps analysis -->
          <section class="help-section">
            <h2>9. Knowledge Gaps Page</h2>
            <p>The <strong>Gaps</strong> page analyzes the graph and detects:</p>
            <ul>
              <li><strong>Broken Links</strong> - Choices pointing to non-existing nodes</li>
              <li><strong>Dead Ends</strong> - Nodes without choices that are not used</li>
              <li><strong>Empty Titles</strong> - Nodes without a title</li>
              <li><strong>Empty Descriptions</strong> - Nodes without a description</li>
              <li><strong>Empty Choice Labels</strong> - Choices without a label</li>
            </ul>
            <p>Click <strong>Go to Node</strong> next to each issue to navigate to the node and fix it.</p>
          </section>

          <!-- Tips -->
          <section class="help-section">
            <h2>10. Tips and Best Practices</h2>
            <ul>
              <li>Always fill in the node title and description - this makes navigation easier</li>
              <li>Use meaningful labels for choices (e.g., "positive", "negative", "needs clarification")</li>
              <li>Regularly check the <strong>Gaps</strong> page to find incomplete parts of the graph</li>
              <li>Add comments to important steps during sessions</li>
              <li>Use tags to categorize steps (e.g., "critical", "needs review")</li>
              <li>Export the graph regularly as a backup</li>
              <li>Use the <strong>Tiles</strong> view to see a visualization of connections between nodes</li>
            </ul>
          </section>
        </div>
      </div>
    `;
      container.innerHTML = html;
    }
  };

  // src/controllers/AppController.js
  var AppController = class {
    constructor() {
      this.eventBus = new EventBus();
      this.dom = new DOMRegistry();
      this.storage = new StorageService();
      this.validation = new ValidationService();
      this.importExport = new ImportExportService(this.storage);
      this.url = new UrlService();
      this.state = new StateManager(this.eventBus);
      this.viewManager = new ViewManager(this.dom, this.eventBus);
      this.resizeHandler = new ResizeHandler(this.dom, this.storage);
      this.nodeController = new NodeController(this.state, this.eventBus, this.storage);
      this.navigationController = new NavigationController(this.state, this.eventBus, this.url, this.storage);
      this.nodeListView = new NodeListView(this.state, this.eventBus, this.dom);
      this.nodesPageView = new NodesPageView(this.state, this.eventBus, this.dom);
      this.runnerView = new RunnerView(this.state, this.eventBus, this.dom);
      this.historyView = new HistoryView(this.state, this.eventBus, this.dom);
      this.tilesView = new TilesView(this.state, this.eventBus, this.dom);
      this.errorsView = new ErrorsView(this.validation, this.eventBus, this.dom);
      this.knowledgeGapsView = new KnowledgeGapsView(this.state, this.eventBus, this.dom);
      this.helpView = new HelpView(this.state, this.eventBus, this.dom);
      this.tilesView.setViewManager(this.viewManager);
      this.currentPage = "main";
      this.setupEventListeners();
      this.setupUIHandlers();
      this.boot();
    }
    setupEventListeners() {
      this.eventBus.on("validation:requested", () => {
        this.validateAndUpdate();
      });
      const filter = this.dom.get("filter");
      if (filter) {
        filter.addEventListener("input", () => {
          this.nodeListView.render();
          if (this.viewManager.getCurrentView() === "tiles") {
            this.tilesView.render();
          }
        });
      }
      const clearFilter = this.dom.get("clearFilter");
      if (clearFilter) {
        clearFilter.onclick = () => {
          if (filter)
            filter.value = "";
          this.nodeListView.render();
          if (this.viewManager.getCurrentView() === "tiles") {
            this.tilesView.render();
          }
        };
      }
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (filter)
            filter.value = "";
          this.nodeListView.render();
        }
        if (e.key === "ArrowLeft" && !e.ctrlKey) {
          this.eventBus.emit("navigation:back-requested");
        }
        if (e.key === "ArrowRight" && !e.ctrlKey) {
          const session = this.state.getSession();
          const graph = this.state.getGraph();
          if (session && graph) {
            const n = byId(session.currentNodeId, graph.nodes);
            if (n && n.choices[0]) {
              this.eventBus.emit("navigation:advance-requested", n.choices[0].to);
            }
          }
        }
        if (e.key === "ArrowLeft" && e.ctrlKey) {
          const session = this.state.getSession();
          const graph = this.state.getGraph();
          if (session && graph) {
            const n = byId(session.currentNodeId, graph.nodes);
            if (n) {
              const prevSibling = getPrevSibling(n.id, graph.nodes, compareIds);
              if (prevSibling) {
                this.eventBus.emit("navigation:advance-requested", prevSibling);
              }
            }
          }
        }
        if (e.key === "ArrowRight" && e.ctrlKey) {
          const session = this.state.getSession();
          const graph = this.state.getGraph();
          if (session && graph) {
            const n = byId(session.currentNodeId, graph.nodes);
            if (n) {
              const nextSibling = getNextSibling(n.id, graph.nodes, compareIds);
              if (nextSibling) {
                this.eventBus.emit("navigation:advance-requested", nextSibling);
              }
            }
          }
        }
      });
      this.eventBus.on("history:comment-updated", (entry) => {
        this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        this.historyView.render();
      });
      this.eventBus.on("history:entry-added", (entry) => {
        this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        this.historyView.render();
      });
      this.eventBus.on("history:tags-updated", (entry) => {
        this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        this.historyView.render();
      });
      this.eventBus.on("node:create-requested", () => {
        setTimeout(() => {
          if (this.currentPage !== "nodes") {
            this.switchToPage("nodes");
          } else {
            this.nodesPageView.render();
          }
        }, 100);
      });
    }
    setupUIHandlers() {
      const els = this.dom.getAll();
      if (els.title) {
        els.title.addEventListener("input", () => {
          const graph = this.state.getGraph();
          if (graph) {
            graph.title = els.title.textContent.trim();
            this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
            this.state.setGraph(graph);
          }
        });
      }
      if (els.btnNewNode) {
        els.btnNewNode.onclick = () => {
          this.eventBus.emit("node:create-requested");
        };
      }
      if (els.btnExport) {
        els.btnExport.onclick = () => {
          this.importExport.exportJson(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        };
      }
      if (els.btnExportSession) {
        els.btnExportSession.onclick = () => {
          this.importExport.exportSession(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
        };
      }
      if (els.btnEmailSummary) {
        els.btnEmailSummary.onclick = () => {
          const graph = this.state.getGraph();
          const session = this.state.getSession();
          if (!graph || !session) {
            alert("No graph or session available.");
            return;
          }
          this.importExport.showEmailSummary(graph.toJSON(), session.toJSON(), this.dom);
        };
      } else {
        console.warn("btnEmailSummary button not found in DOM");
      }
      if (els.btnExportConfluence) {
        els.btnExportConfluence.onclick = () => {
          const graph = this.state.getGraph();
          if (!graph) {
            alert("No graph available.");
            return;
          }
          this.importExport.showConfluenceExport(graph.toJSON(), this.dom);
        };
      } else {
        console.warn("btnExportConfluence button not found in DOM");
      }
      if (els.btnNewSession) {
        els.btnNewSession.onclick = () => {
          this.newSession();
        };
      }
      if (els.btnImport) {
        els.btnImport.onclick = () => {
          if (els.importFile)
            els.importFile.click();
        };
      }
      if (els.importFile) {
        els.importFile.onchange = (e) => {
          const f = e.target.files[0];
          if (f) {
            this.importExport.importJson(f, (graph, session) => {
              this.state.setGraph(new Graph(graph));
              this.state.setSession(new Session(session));
              this.renderAll();
              this.validateAndUpdate();
            }, (error) => {
              alert("Import error: " + error.message);
            });
          }
          e.target.value = "";
        };
      }
      if (els.btnStart) {
        els.btnStart.onclick = () => {
          const startSelect = els.startSelect;
          if (startSelect) {
            this.eventBus.emit("navigation:start-requested", String(startSelect.value));
          }
        };
      }
      if (els.btnJump) {
        els.btnJump.onclick = () => {
          const runnerNodeId = els.runnerNodeId;
          if (runnerNodeId) {
            this.eventBus.emit("navigation:start-requested", String(runnerNodeId.value));
          }
        };
      }
      if (els.btnBack) {
        els.btnBack.onclick = () => {
          this.eventBus.emit("navigation:back-requested");
        };
      }
      if (els.btnReset) {
        els.btnReset.onclick = () => {
          this.eventBus.emit("navigation:reset-requested");
        };
      }
      if (els.btnCloseErrors) {
        els.btnCloseErrors.onclick = () => {
          const errorsSection = els.errorsSection;
          if (errorsSection) {
            errorsSection.classList.add("hidden");
          }
        };
      }
      if (els.btnNavMain) {
        els.btnNavMain.onclick = () => {
          this.switchToPage("main");
        };
      }
      if (els.btnNavNodes) {
        els.btnNavNodes.onclick = () => {
          this.switchToPage("nodes");
        };
      }
      if (els.btnNavGaps) {
        els.btnNavGaps.onclick = () => {
          this.switchToPage("gaps");
        };
      }
      if (els.btnNavHelp) {
        els.btnNavHelp.onclick = () => {
          this.switchToPage("help");
        };
      }
      this.eventBus.on("gaps:goto-node", ({ nodeId, choiceIndex }) => {
        this.switchToPage("nodes");
        setTimeout(() => {
          this.nodesPageView.focusOnNode(nodeId);
          if (choiceIndex !== void 0 && choiceIndex !== "") {
            const choiceIdx = parseInt(choiceIndex, 10);
            if (!isNaN(choiceIdx)) {
              setTimeout(() => {
                const container = this.dom.get("nodesPageContainer");
                if (container) {
                  const nodeCard = container.querySelector(`[data-node-id="${String(nodeId)}"]`);
                  if (nodeCard) {
                    const choiceItem = nodeCard.querySelector(`[data-choice-index="${choiceIdx}"]`);
                    if (choiceItem) {
                      choiceItem.scrollIntoView({ behavior: "smooth", block: "center" });
                      const choiceInput = choiceItem.querySelector(".choice-label-input, .choice-target-input");
                      if (choiceInput) {
                        choiceInput.focus();
                      }
                    }
                  }
                }
              }, 400);
            }
          }
        }, 100);
      });
    }
    /**
     * Switch between main view, nodes page, gaps page, and help page
     * @param {string} page - Page name ('main', 'nodes', 'gaps', or 'help')
     */
    switchToPage(page) {
      const mainView = this.dom.get("mainView");
      const nodesPageContainer = this.dom.get("nodesPageContainer");
      const knowledgeGapsContainer = this.dom.get("knowledgeGapsContainer");
      const helpContainer = this.dom.get("helpContainer");
      const btnNavMain = this.dom.get("btnNavMain");
      const btnNavNodes = this.dom.get("btnNavNodes");
      const btnNavGaps = this.dom.get("btnNavGaps");
      const btnNavHelp = this.dom.get("btnNavHelp");
      if (mainView)
        mainView.classList.add("hidden");
      if (nodesPageContainer)
        nodesPageContainer.classList.add("hidden");
      if (knowledgeGapsContainer)
        knowledgeGapsContainer.classList.add("hidden");
      if (helpContainer)
        helpContainer.classList.add("hidden");
      if (btnNavMain)
        btnNavMain.classList.remove("active");
      if (btnNavNodes)
        btnNavNodes.classList.remove("active");
      if (btnNavGaps)
        btnNavGaps.classList.remove("active");
      if (btnNavHelp)
        btnNavHelp.classList.remove("active");
      if (page === "nodes") {
        this.currentPage = "nodes";
        if (nodesPageContainer)
          nodesPageContainer.classList.remove("hidden");
        if (btnNavNodes)
          btnNavNodes.classList.add("active");
        this.nodesPageView.render();
      } else if (page === "gaps") {
        this.currentPage = "gaps";
        if (knowledgeGapsContainer)
          knowledgeGapsContainer.classList.remove("hidden");
        if (btnNavGaps)
          btnNavGaps.classList.add("active");
        this.knowledgeGapsView.render();
      } else if (page === "help") {
        this.currentPage = "help";
        if (helpContainer)
          helpContainer.classList.remove("hidden");
        if (btnNavHelp)
          btnNavHelp.classList.add("active");
        this.helpView.render();
      } else {
        this.currentPage = "main";
        if (mainView)
          mainView.classList.remove("hidden");
        if (btnNavMain)
          btnNavMain.classList.add("active");
      }
    }
    /**
     * Validate graph and update UI
     */
    validateAndUpdate() {
      const graph = this.state.getGraph();
      if (!graph)
        return;
      const result = this.validation.validate(graph.toJSON());
      const validationBadge = this.dom.get("validationBadge");
      if (validationBadge) {
        validationBadge.textContent = result.ok ? "Validation: OK" : "Validation: " + result.messages.slice(0, 3).join(", ") + (result.messages.length > 3 ? "\u2026" : "");
        validationBadge.className = "badge " + (result.ok ? "ok" : "danger");
      }
      this.eventBus.emit("validation:updated", {
        ok: result.ok,
        messages: result.messages,
        emptyReferences: result.emptyReferences
      });
    }
    /**
     * Render all views
     */
    renderAll() {
      const graph = this.state.getGraph();
      if (!graph)
        return;
      const title = this.dom.get("title");
      if (title) {
        title.textContent = graph.title || "Graph";
      }
      this.nodeListView.render();
      this.runnerView.render();
      this.validateAndUpdate();
      if (this.viewManager.getCurrentView() === "tiles") {
        this.tilesView.render();
      }
    }
    /**
     * Create new session
     */
    newSession() {
      if (!confirm("Are you sure you want to start a new session? This will remove all current steps and cannot be undone.")) {
        return;
      }
      const newGraph = new Graph({
        title: "New Process",
        nodes: []
      });
      const newSession = new Session();
      this.storage.save(newGraph.toJSON(), newSession.toJSON());
      this.state.setGraph(newGraph);
      this.state.setSession(newSession);
      this.renderAll();
      this.validateAndUpdate();
    }
    /**
     * Boot the application
     */
    boot() {
      const saved = this.storage.load(migrateHistory);
      if (saved && saved.graph && Array.isArray(saved.graph.nodes)) {
        this.state.setGraph(new Graph(saved.graph));
        this.state.setSession(new Session(saved.session));
      } else {
        const seedGraph = Graph.createSeed();
        const firstNode = seedGraph.nodes.find((n) => n.id === "1");
        const seedSession = Session.createFromNode(firstNode);
        this.state.setGraph(seedGraph);
        this.state.setSession(seedSession);
        this.storage.save(seedGraph.toJSON(), seedSession.toJSON());
      }
      const nodeIdFromUrl = this.url.getNodeIdFromUrl();
      if (nodeIdFromUrl) {
        const id = String(nodeIdFromUrl);
        const graph = this.state.getGraph();
        if (graph) {
          const node = byId(id, graph.nodes);
          if (node) {
            const session2 = this.state.getSession();
            if (session2) {
              session2.currentNodeId = id;
              const lastEntry = session2.history.length > 0 ? session2.history[session2.history.length - 1] : null;
              if (!lastEntry || String(lastEntry.id) !== String(id)) {
                const historyEntry = createHistoryEntry(node);
                session2.history = session2.history.length > 0 ? [...session2.history, historyEntry] : [historyEntry];
              }
              this.storage.save(graph.toJSON(), session2.toJSON());
              this.state.setSession(session2);
            }
          }
        }
      }
      const session = this.state.getSession();
      if (session && session.currentNodeId) {
        this.url.updateUrl(session.currentNodeId, true);
      }
      this.renderAll();
      this.nodesPageView.render();
      this.knowledgeGapsView.render();
      this.helpView.render();
    }
  };

  // src/main.js
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.app = new AppController();
    });
  } else {
    window.app = new AppController();
  }
})();
