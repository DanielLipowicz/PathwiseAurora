/**
 * App Controller
 * Main application controller that coordinates all modules
 */

import { EventBus } from '../ui/EventBus.js';
import { DOMRegistry } from '../ui/DOMRegistry.js';
import { ViewManager } from '../ui/ViewManager.js';
import { ResizeHandler } from '../ui/ResizeHandler.js';
import { StateManager } from '../core/StateManager.js';
import { Graph } from '../core/Graph.js';
import { Session } from '../core/Session.js';
import { StorageService } from '../services/StorageService.js';
import { ValidationService } from '../services/ValidationService.js';
import { ImportExportService } from '../services/ImportExportService.js';
import { UrlService } from '../services/UrlService.js';
import { NodeController } from './NodeController.js';
import { NavigationController } from './NavigationController.js';
import { NodeListView } from '../views/NodeListView.js';
import { NodesPageView } from '../views/NodesPageView.js';
import { RunnerView } from '../views/RunnerView.js';
import { HistoryView } from '../views/HistoryView.js';
import { TilesView } from '../views/TilesView.js';
import { ErrorsView } from '../views/ErrorsView.js';
import { migrateHistory, byId, createHistoryEntry, getPrevSibling, getNextSibling } from '../utils/NodeUtils.js';
import { compareIds } from '../utils/IdUtils.js';

export class AppController {
  constructor() {
    // Initialize core services
    this.eventBus = new EventBus();
    this.dom = new DOMRegistry();
    this.storage = new StorageService();
    this.validation = new ValidationService();
    this.importExport = new ImportExportService(this.storage);
    this.url = new UrlService();

    // Initialize state
    this.state = new StateManager(this.eventBus);

    // Initialize UI
    this.viewManager = new ViewManager(this.dom, this.eventBus);
    this.resizeHandler = new ResizeHandler(this.dom, this.storage);

    // Initialize controllers
    this.nodeController = new NodeController(this.state, this.eventBus, this.storage);
    this.navigationController = new NavigationController(this.state, this.eventBus, this.url, this.storage);

    // Initialize views
    this.nodeListView = new NodeListView(this.state, this.eventBus, this.dom);
    this.nodesPageView = new NodesPageView(this.state, this.eventBus, this.dom);
    this.runnerView = new RunnerView(this.state, this.eventBus, this.dom);
    this.historyView = new HistoryView(this.state, this.eventBus, this.dom);
    this.tilesView = new TilesView(this.state, this.eventBus, this.dom);
    this.errorsView = new ErrorsView(this.validation, this.eventBus, this.dom);

    // Set view manager reference for tiles view
    this.tilesView.setViewManager(this.viewManager);

    // Current page state
    this.currentPage = 'main';

    // Setup event listeners
    this.setupEventListeners();

    // Setup UI event handlers
    this.setupUIHandlers();

    // Initialize app
    this.boot();
  }

  setupEventListeners() {
    // Validation
    this.eventBus.on('validation:requested', () => {
      this.validateAndUpdate();
    });

    // Filter changes
    const filter = this.dom.get('filter');
    if (filter) {
      filter.addEventListener('input', () => {
        this.nodeListView.render();
        if (this.viewManager.getCurrentView() === 'tiles') {
          this.tilesView.render();
        }
      });
    }

    const clearFilter = this.dom.get('clearFilter');
    if (clearFilter) {
      clearFilter.onclick = () => {
        if (filter) filter.value = '';
        this.nodeListView.render();
        if (this.viewManager.getCurrentView() === 'tiles') {
          this.tilesView.render();
        }
      };
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (filter) filter.value = '';
        this.nodeListView.render();
      }
      if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        this.eventBus.emit('navigation:back-requested');
      }
      if (e.key === 'ArrowRight' && !e.ctrlKey) {
        const session = this.state.getSession();
        const graph = this.state.getGraph();
        if (session && graph) {
          const n = byId(session.currentNodeId, graph.nodes);
          if (n && n.choices[0]) {
            this.eventBus.emit('navigation:advance-requested', n.choices[0].to);
          }
        }
      }
      // Sibling navigation: Ctrl+ArrowLeft/Right
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        const session = this.state.getSession();
        const graph = this.state.getGraph();
        if (session && graph) {
          const n = byId(session.currentNodeId, graph.nodes);
          if (n) {
            const prevSibling = getPrevSibling(n.id, graph.nodes, compareIds);
            if (prevSibling) {
              this.eventBus.emit('navigation:advance-requested', prevSibling);
            }
          }
        }
      }
      if (e.key === 'ArrowRight' && e.ctrlKey) {
        const session = this.state.getSession();
        const graph = this.state.getGraph();
        if (session && graph) {
          const n = byId(session.currentNodeId, graph.nodes);
          if (n) {
            const nextSibling = getNextSibling(n.id, graph.nodes, compareIds);
            if (nextSibling) {
              this.eventBus.emit('navigation:advance-requested', nextSibling);
            }
          }
        }
      }
    });

    // History comment updates
    this.eventBus.on('history:comment-updated', (entry) => {
      this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
      this.historyView.render();
    });

    this.eventBus.on('history:entry-added', (entry) => {
      this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
      this.historyView.render();
    });

    // Node updates - don't re-render nodes page to prevent focus loss while typing
    // Data is already updated directly in event handlers
    // this.eventBus.on('node:updated', () => {
    //   if (this.currentPage === 'nodes') {
    //     this.nodesPageView.render();
    //   }
    // });

    this.eventBus.on('node:create-requested', () => {
      // After node is created, switch to nodes page if not already there
      setTimeout(() => {
        if (this.currentPage !== 'nodes') {
          this.switchToPage('nodes');
        } else {
          this.nodesPageView.render();
        }
      }, 100);
    });
  }

  setupUIHandlers() {
    const els = this.dom.getAll();

    // Title editing
    if (els.title) {
      els.title.addEventListener('input', () => {
        const graph = this.state.getGraph();
        if (graph) {
          graph.title = els.title.textContent.trim();
          this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
          this.state.setGraph(graph);
        }
      });
    }

    // New node button
    if (els.btnNewNode) {
      els.btnNewNode.onclick = () => {
        this.eventBus.emit('node:create-requested');
      };
    }

    // Export buttons
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

    // New session button
    if (els.btnNewSession) {
      els.btnNewSession.onclick = () => {
        this.newSession();
      };
    }

    // Import button
    if (els.btnImport) {
      els.btnImport.onclick = () => {
        if (els.importFile) els.importFile.click();
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
            alert('Import error: ' + error.message);
          });
        }
        e.target.value = '';
      };
    }

    // Runner controls
    if (els.btnStart) {
      els.btnStart.onclick = () => {
        const startSelect = els.startSelect;
        if (startSelect) {
          this.eventBus.emit('navigation:start-requested', String(startSelect.value));
        }
      };
    }

    if (els.btnJump) {
      els.btnJump.onclick = () => {
        const runnerNodeId = els.runnerNodeId;
        if (runnerNodeId) {
          this.eventBus.emit('navigation:start-requested', String(runnerNodeId.value));
        }
      };
    }

    if (els.btnBack) {
      els.btnBack.onclick = () => {
        this.eventBus.emit('navigation:back-requested');
      };
    }

    if (els.btnReset) {
      els.btnReset.onclick = () => {
        this.eventBus.emit('navigation:reset-requested');
      };
    }

    // Errors section close button
    if (els.btnCloseErrors) {
      els.btnCloseErrors.onclick = () => {
        const errorsSection = els.errorsSection;
        if (errorsSection) {
          errorsSection.classList.add('hidden');
        }
      };
    }

    // Navigation buttons
    if (els.btnNavMain) {
      els.btnNavMain.onclick = () => {
        this.switchToPage('main');
      };
    }

    if (els.btnNavNodes) {
      els.btnNavNodes.onclick = () => {
        this.switchToPage('nodes');
      };
    }
  }

  /**
   * Switch between main view and nodes page
   * @param {string} page - Page name ('main' or 'nodes')
   */
  switchToPage(page) {
    const mainView = this.dom.get('mainView');
    const nodesPageContainer = this.dom.get('nodesPageContainer');
    const btnNavMain = this.dom.get('btnNavMain');
    const btnNavNodes = this.dom.get('btnNavNodes');

    if (page === 'nodes') {
      this.currentPage = 'nodes';
      if (mainView) mainView.classList.add('hidden');
      if (nodesPageContainer) nodesPageContainer.classList.remove('hidden');
      if (btnNavMain) btnNavMain.classList.remove('active');
      if (btnNavNodes) btnNavNodes.classList.add('active');
      // Render nodes page
      this.nodesPageView.render();
    } else {
      this.currentPage = 'main';
      if (mainView) mainView.classList.remove('hidden');
      if (nodesPageContainer) nodesPageContainer.classList.add('hidden');
      if (btnNavMain) btnNavMain.classList.add('active');
      if (btnNavNodes) btnNavNodes.classList.remove('active');
    }
  }

  /**
   * Validate graph and update UI
   */
  validateAndUpdate() {
    const graph = this.state.getGraph();
    if (!graph) return;

    const result = this.validation.validate(graph.toJSON());
    const validationBadge = this.dom.get('validationBadge');
    if (validationBadge) {
      validationBadge.textContent = result.ok
        ? 'Validation: OK'
        : 'Validation: ' + result.messages.slice(0, 3).join(', ') + (result.messages.length > 3 ? '…' : '');
      validationBadge.className = 'badge ' + (result.ok ? 'ok' : 'danger');
    }

    this.eventBus.emit('validation:updated', {
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
    if (!graph) return;

    const title = this.dom.get('title');
    if (title) {
      title.textContent = graph.title || 'Graph';
    }

    this.nodeListView.render();
    this.runnerView.render();
    this.validateAndUpdate();

    if (this.viewManager.getCurrentView() === 'tiles') {
      this.tilesView.render();
    }
  }

  /**
   * Create new session
   */
  newSession() {
    if (!confirm('Are you sure you want to start a new session? This will remove all current steps and cannot be undone.')) {
      return;
    }

    const newGraph = new Graph({
      title: 'New Process',
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
    // Load saved data
    const saved = this.storage.load(migrateHistory);
    if (saved && saved.graph && Array.isArray(saved.graph.nodes)) {
      this.state.setGraph(new Graph(saved.graph));
      this.state.setSession(new Session(saved.session));
    } else {
      // Seed if empty
      const seedGraph = Graph.createSeed();
      const firstNode = seedGraph.nodes.find(n => n.id === '1');
      const seedSession = Session.createFromNode(firstNode);
      this.state.setGraph(seedGraph);
      this.state.setSession(seedSession);
      this.storage.save(seedGraph.toJSON(), seedSession.toJSON());
    }

    // Check URL parameter on startup
    const nodeIdFromUrl = this.url.getNodeIdFromUrl();
    if (nodeIdFromUrl) {
      const id = String(nodeIdFromUrl);
      const graph = this.state.getGraph();
      if (graph) {
        const node = byId(id, graph.nodes);
        if (node) {
          const session = this.state.getSession();
          if (session) {
            session.currentNodeId = id;
            // History only expands - add new entry if node is not last in history
            const lastEntry = session.history.length > 0 ? session.history[session.history.length - 1] : null;
            if (!lastEntry || String(lastEntry.id) !== String(id)) {
              // Add new entry only if it's a different node than the last one
              const historyEntry = createHistoryEntry(node);
              session.history = session.history.length > 0 ? [...session.history, historyEntry] : [historyEntry];
            }
            this.storage.save(graph.toJSON(), session.toJSON());
            this.state.setSession(session);
          }
        }
      }
    }

    // Update URL without adding to history (replaceState)
    const session = this.state.getSession();
    if (session && session.currentNodeId) {
      this.url.updateUrl(session.currentNodeId, true);
    }

    this.renderAll();
    
    // Initialize nodes page (but keep it hidden until user navigates)
    this.nodesPageView.render();
  }
}

