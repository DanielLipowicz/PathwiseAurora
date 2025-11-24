# Application Audit & Modularization Plan

## Executive Summary

PathwiseAurora is a decision-tree/flowchart application for creating interactive playbooks. The current codebase is functional but has significant architectural issues that make it difficult to maintain, test, and extend. This document provides a comprehensive audit and proposes a modularization strategy.

---

## Current Architecture Analysis

### File Structure Overview

```
app.js          - Main application entry, DOM references, event handlers, boot logic
data.js         - State management, utilities, ID management, localStorage
render.js       - All rendering logic (list, runner, tiles, history, errors)
runner.js       - Navigation logic, URL management, browser history
io.js           - Import/Export functionality
validation.js   - Graph validation logic
index.html      - HTML structure
styles.css      - Styling
schema.json     - JSON schema definition
```

### Critical Issues Identified

#### 1. **Global State Management**
- **Problem**: `graph` and `session` are global variables shared across all modules
- **Impact**: 
  - No clear ownership of state
  - Difficult to track state changes
  - Impossible to have multiple instances
  - Hard to test in isolation
- **Location**: `data.js` lines 5-7

#### 2. **Tight Coupling**
- **Problem**: All modules depend on global variables and functions from other modules
- **Impact**:
  - Changes in one file can break others
  - Circular dependencies risk
  - Difficult to refactor
- **Example**: `render.js` calls `byId()`, `saveLocal()`, `validateGraph()` from other modules

#### 3. **Mixed Concerns**
- **Problem**: Single files handle multiple responsibilities
- **Examples**:
  - `data.js`: State + utilities + storage + ID management + initialization
  - `render.js`: DOM manipulation + business logic + event handlers
  - `app.js`: DOM references + event handlers + view state + resize logic + boot

#### 4. **No Clear Module Boundaries**
- **Problem**: Functions are scattered without clear organization
- **Impact**: Hard to understand what belongs where
- **Example**: `renderAll()` in `render.js` calls functions from multiple modules

#### 5. **DOM Manipulation Mixed with Logic**
- **Problem**: Business logic embedded in rendering functions
- **Impact**: 
  - Hard to test business logic
  - Difficult to change UI without touching logic
- **Example**: `renderNodeList()` contains validation logic, save logic, and DOM manipulation

#### 6. **Global DOM References**
- **Problem**: `els` object is global and used everywhere
- **Impact**: 
  - Hard to test
  - No dependency injection
  - Tight coupling to HTML structure
- **Location**: `app.js` lines 2-27

#### 7. **No Dependency Injection**
- **Problem**: Functions directly access globals instead of receiving dependencies
- **Impact**: Impossible to mock dependencies for testing
- **Example**: All functions access `graph`, `session`, `els` directly

#### 8. **Inconsistent Error Handling**
- **Problem**: Some functions use `alert()`, others silently fail
- **Impact**: Poor user experience, hard to debug

#### 9. **Code Duplication**
- **Problem**: Similar logic repeated in multiple places
- **Examples**:
  - History migration logic duplicated in `data.js` and `io.js`
  - ID normalization scattered across files
  - Filter logic duplicated in `renderNodeList()` and `renderTilesView()`

#### 10. **No Type Safety**
- **Problem**: No TypeScript or JSDoc types (minimal JSDoc)
- **Impact**: Runtime errors, harder to refactor

---

## Proposed Modular Architecture

### New Directory Structure

```
src/
├── core/
│   ├── Graph.js          - Graph data model and operations
│   ├── Session.js        - Session state management
│   └── StateManager.js   - Centralized state management
├── services/
│   ├── StorageService.js - localStorage operations
│   ├── ValidationService.js - Graph validation
│   ├── ImportExportService.js - File I/O
│   └── UrlService.js     - URL and browser history management
├── utils/
│   ├── IdUtils.js        - ID generation and comparison
│   ├── NodeUtils.js      - Node relationship utilities
│   └── HtmlUtils.js      - HTML escaping, etc.
├── ui/
│   ├── DOMRegistry.js    - DOM element references
│   ├── ViewManager.js    - View switching logic
│   ├── ResizeHandler.js  - Sidebar resize functionality
│   └── EventBus.js       - Event system for decoupling
├── views/
│   ├── NodeListView.js   - List view rendering
│   ├── TilesView.js      - Tiles view rendering
│   ├── RunnerView.js     - Runner panel rendering
│   ├── HistoryView.js    - History panel rendering
│   └── ErrorsView.js     - Errors panel rendering
├── controllers/
│   ├── NodeController.js - Node CRUD operations
│   ├── NavigationController.js - Navigation logic
│   └── AppController.js  - Main application controller
└── app.js                - Application entry point
```

### Module Responsibilities

#### **Core Layer** (`core/`)
- **Graph.js**: 
  - Graph data structure
  - Node operations (add, remove, update, find)
  - Choice management
  - Immutable operations where possible
  
- **Session.js**:
  - Session state structure
  - History management
  - Current node tracking
  
- **StateManager.js**:
  - Centralized state store
  - State change notifications (observer pattern)
  - State persistence coordination

#### **Services Layer** (`services/`)
- **StorageService.js**:
  - localStorage read/write
  - Data migration
  - Serialization/deserialization
  
- **ValidationService.js**:
  - Graph validation rules
  - Error collection
  - Validation result formatting
  
- **ImportExportService.js**:
  - JSON import/export
  - Session export
  - File format handling
  
- **UrlService.js**:
  - URL parameter management
  - Browser history integration
  - Deep linking

#### **Utils Layer** (`utils/`)
- **IdUtils.js**:
  - ID generation (`nextId`, `nextChildId`)
  - ID comparison (`compareIds`)
  - ID normalization
  
- **NodeUtils.js**:
  - Parent/child relationships
  - Sibling navigation
  - Tree traversal
  
- **HtmlUtils.js**:
  - HTML escaping
  - Template utilities

#### **UI Layer** (`ui/`)
- **DOMRegistry.js**:
  - Centralized DOM element references
  - Lazy initialization
  - Element validation
  
- **ViewManager.js**:
  - View state management
  - View switching logic
  
- **ResizeHandler.js**:
  - Sidebar resize functionality
  - Width persistence
  
- **EventBus.js**:
  - Pub/sub event system
  - Decouple components

#### **Views Layer** (`views/`)
- **NodeListView.js**:
  - List view rendering
  - Node item templates
  - Filter integration
  
- **TilesView.js**:
  - Tiles view rendering
  - SVG connections
  - Grid layout
  
- **RunnerView.js**:
  - Runner panel rendering
  - Choice buttons
  - Comment section
  
- **HistoryView.js**:
  - History list rendering
  - History item interactions
  
- **ErrorsView.js**:
  - Error list rendering
  - Error item display

#### **Controllers Layer** (`controllers/`)
- **NodeController.js**:
  - Node creation/deletion
  - Node updates
  - Choice management
  - Coordinates between views and state
  
- **NavigationController.js**:
  - Navigation logic (`startAt`, `advance`, `back`)
  - History management
  - URL updates
  
- **AppController.js**:
  - Application initialization
  - Event handler registration
  - Component coordination

---

## Migration Strategy

### Phase 1: Foundation (Low Risk)
1. **Create utility modules**
   - Extract `IdUtils.js` from `data.js`
   - Extract `NodeUtils.js` from `data.js`
   - Extract `HtmlUtils.js` from `render.js`
   - **Benefit**: Low risk, no behavior change

2. **Create service modules**
   - Extract `StorageService.js` from `data.js`
   - Extract `ValidationService.js` from `validation.js`
   - Extract `ImportExportService.js` from `io.js`
   - **Benefit**: Isolated, testable services

3. **Create DOMRegistry**
   - Extract DOM references to `DOMRegistry.js`
   - Initialize lazily
   - **Benefit**: Centralized DOM access

### Phase 2: Core Refactoring (Medium Risk)
4. **Create core data models**
   - Create `Graph.js` class
   - Create `Session.js` class
   - Migrate state to classes
   - **Benefit**: Encapsulated state, better API

5. **Create StateManager**
   - Implement observer pattern
   - Centralize state updates
   - **Benefit**: Predictable state changes

### Phase 3: View Separation (Medium Risk)
6. **Extract view modules**
   - Create `NodeListView.js`
   - Create `TilesView.js`
   - Create `RunnerView.js`
   - Create `HistoryView.js`
   - Create `ErrorsView.js`
   - **Benefit**: Separated rendering logic

7. **Create EventBus**
   - Implement pub/sub system
   - Replace direct function calls with events
   - **Benefit**: Loose coupling

### Phase 4: Controller Pattern (Higher Risk)
8. **Create controllers**
   - Create `NodeController.js`
   - Create `NavigationController.js`
   - Create `AppController.js`
   - **Benefit**: Clear separation of concerns

9. **Refactor app.js**
   - Simplify to initialization only
   - Delegate to controllers
   - **Benefit**: Clean entry point

### Phase 5: Polish (Low Risk)
10. **Add TypeScript (Optional)**
    - Convert to TypeScript
    - Add type definitions
    - **Benefit**: Type safety, better IDE support

11. **Add tests**
    - Unit tests for utilities
    - Integration tests for controllers
    - **Benefit**: Confidence in refactoring

---

## Implementation Details

### Example: Graph.js Module

```javascript
// core/Graph.js
export class Graph {
  constructor(data = { title: '', nodes: [] }) {
    this.title = data.title || '';
    this.nodes = (data.nodes || []).map(n => ({ ...n }));
  }

  findNodeById(id) {
    return this.nodes.find(n => String(n.id) === String(id)) || null;
  }

  addNode(node) {
    this.nodes.push({ ...node });
    return this;
  }

  removeNode(id) {
    const nodeIdStr = String(id);
    this.nodes = this.nodes.filter(n => {
      const nIdStr = String(n.id);
      return nIdStr !== nodeIdStr && !nIdStr.startsWith(nodeIdStr + '.');
    });
    // Remove references
    this.nodes.forEach(n => {
      n.choices = n.choices.filter(c => String(c.to) !== nodeIdStr);
    });
    return this;
  }

  updateNode(id, updates) {
    const node = this.findNodeById(id);
    if (node) {
      Object.assign(node, updates);
    }
    return this;
  }

  toJSON() {
    return { title: this.title, nodes: [...this.nodes] };
  }
}
```

### Example: StateManager.js

```javascript
// core/StateManager.js
export class StateManager {
  constructor() {
    this.graph = null;
    this.session = null;
    this.listeners = [];
  }

  setGraph(graph) {
    this.graph = graph;
    this.notify('graph:changed', graph);
  }

  setSession(session) {
    this.session = session;
    this.notify('session:changed', session);
  }

  subscribe(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l !== { event, callback });
    };
  }

  notify(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }
}
```

### Example: EventBus.js

```javascript
// ui/EventBus.js
export class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}
```

### Example: Controller Pattern

```javascript
// controllers/NodeController.js
export class NodeController {
  constructor(stateManager, eventBus, storageService) {
    this.state = stateManager;
    this.events = eventBus;
    this.storage = storageService;
  }

  createNode(nodeData) {
    const node = {
      id: IdUtils.nextId(this.state.graph),
      title: nodeData.title || 'New Node',
      body: nodeData.body || 'Description…',
      choices: []
    };
    
    this.state.graph.addNode(node);
    this.storage.save(this.state);
    this.events.emit('node:created', node);
    this.events.emit('render:all');
    
    return node;
  }

  deleteNode(id) {
    this.state.graph.removeNode(id);
    if (String(this.state.session.currentNodeId) === String(id)) {
      this.state.session.reset();
    }
    this.storage.save(this.state);
    this.events.emit('node:deleted', id);
    this.events.emit('render:all');
  }
}
```

---

## Benefits of Modularization

### 1. **Maintainability**
- Clear module boundaries
- Easier to locate and fix bugs
- Simpler to understand codebase

### 2. **Testability**
- Isolated modules can be unit tested
- Mock dependencies easily
- Integration tests for controllers

### 3. **Extensibility**
- Easy to add new views
- Easy to add new features
- Plugin architecture possible

### 4. **Reusability**
- Utility functions reusable
- Services can be used independently
- Core models can be used in other contexts

### 5. **Team Collaboration**
- Clear ownership of modules
- Reduced merge conflicts
- Easier code reviews

### 6. **Performance**
- Lazy loading possible
- Code splitting potential
- Better tree shaking

---

## Risks and Mitigation

### Risk 1: Breaking Existing Functionality
- **Mitigation**: 
  - Incremental migration
  - Keep old code until new code is tested
  - Feature flags for gradual rollout

### Risk 2: Increased Complexity
- **Mitigation**:
  - Clear documentation
  - Consistent patterns
  - Code examples

### Risk 3: Migration Time
- **Mitigation**:
  - Phased approach
  - Prioritize high-value modules
  - Parallel development possible

### Risk 4: Learning Curve
- **Mitigation**:
  - Documentation
  - Code comments
  - Team training

---

## Recommended Next Steps

1. **Immediate (Week 1)**
   - Review and approve this plan
   - Set up new directory structure
   - Create utility modules (Phase 1)

2. **Short-term (Weeks 2-4)**
   - Extract services (Phase 1)
   - Create core models (Phase 2)
   - Implement StateManager (Phase 2)

3. **Medium-term (Weeks 5-8)**
   - Extract views (Phase 3)
   - Implement EventBus (Phase 3)
   - Create controllers (Phase 4)

4. **Long-term (Weeks 9-12)**
   - Refactor app.js (Phase 4)
   - Add tests (Phase 5)
   - Consider TypeScript (Phase 5)

---

## Conclusion

The current codebase is functional but suffers from architectural issues that will make future development increasingly difficult. The proposed modularization plan provides a clear path to a more maintainable, testable, and extensible codebase while minimizing risk through incremental migration.

The key principles of the new architecture are:
- **Separation of Concerns**: Each module has a single, clear responsibility
- **Dependency Injection**: Dependencies are explicit and injectable
- **Event-Driven**: Loose coupling through events
- **Testability**: All modules can be tested in isolation
- **Extensibility**: Easy to add new features without modifying existing code

