/**
 * DOM Registry
 * Centralized registry for DOM element references
 */

export class DOMRegistry {
  constructor() {
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize DOM element references
   */
  initialize() {
    this.elements = {
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
      btnEmailSummary: document.getElementById('btnEmailSummary'),
      btnExportConfluence: document.getElementById('btnExportConfluence'),
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
      errorsSection: document.getElementById('errorsSection'),
      errorsList: document.getElementById('errorsList'),
      btnCloseErrors: document.getElementById('btnCloseErrors'),
      resizeHandle: document.getElementById('resizeHandle'),
      nodeItemTpl: document.getElementById('nodeItemTpl'),
      choiceRowTpl: document.getElementById('choiceRowTpl'),
      mainView: document.getElementById('mainView'),
      nodesPageContainer: document.getElementById('nodesPageContainer'),
      knowledgeGapsContainer: document.getElementById('knowledgeGapsContainer'),
      helpContainer: document.getElementById('helpContainer'),
      btnNavMain: document.getElementById('btnNavMain'),
      btnNavNodes: document.getElementById('btnNavNodes'),
      btnNavGaps: document.getElementById('btnNavGaps'),
      btnNavHelp: document.getElementById('btnNavHelp'),
      emailSummaryModal: document.getElementById('emailSummaryModal'),
      emailSummaryFormat: document.getElementById('emailSummaryFormat'),
      emailSummaryText: document.getElementById('emailSummaryText'),
      btnCopyEmailSummary: document.getElementById('btnCopyEmailSummary'),
      btnCloseEmailSummary: document.getElementById('btnCloseEmailSummary'),
      confluenceExportModal: document.getElementById('confluenceExportModal'),
      confluenceExportText: document.getElementById('confluenceExportText'),
      btnCopyConfluenceExport: document.getElementById('btnCopyConfluenceExport'),
      btnCloseConfluenceExport: document.getElementById('btnCloseConfluenceExport')
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
}

