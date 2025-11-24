# Modularization Quick Reference

## Current vs Proposed Structure

### Current Structure (Issues)

```
app.js          → DOM refs + Events + View state + Resize + Boot
data.js         → State + Utils + Storage + ID mgmt + Init
render.js       → All rendering (list, tiles, runner, history, errors)
runner.js       → Navigation + URL + Browser history
io.js           → Import/Export
validation.js   → Validation logic
```

**Problems:**
- ❌ Global state (`graph`, `session`)
- ❌ Tight coupling (direct function calls)
- ❌ Mixed concerns (logic + UI)
- ❌ No dependency injection
- ❌ Hard to test

---

### Proposed Structure (Benefits)

```
src/
├── core/              → Data models & state
│   ├── Graph.js       → Graph operations
│   ├── Session.js     → Session state
│   └── StateManager.js → Centralized state
│
├── services/          → Business logic services
│   ├── StorageService.js
│   ├── ValidationService.js
│   ├── ImportExportService.js
│   └── UrlService.js
│
├── utils/             → Pure utility functions
│   ├── IdUtils.js
│   ├── NodeUtils.js
│   └── HtmlUtils.js
│
├── ui/                → UI infrastructure
│   ├── DOMRegistry.js
│   ├── ViewManager.js
│   ├── ResizeHandler.js
│   └── EventBus.js
│
├── views/             → Rendering only
│   ├── NodeListView.js
│   ├── TilesView.js
│   ├── RunnerView.js
│   ├── HistoryView.js
│   └── ErrorsView.js
│
└── controllers/       → Coordination layer
    ├── NodeController.js
    ├── NavigationController.js
    └── AppController.js
```

**Benefits:**
- ✅ Encapsulated state
- ✅ Loose coupling (events)
- ✅ Separated concerns
- ✅ Dependency injection
- ✅ Testable modules

---

## Migration Mapping

### Where Current Code Goes

| Current File | New Location(s) |
|-------------|----------------|
| `data.js` (state) | `core/Graph.js`, `core/Session.js` |
| `data.js` (utils) | `utils/IdUtils.js`, `utils/NodeUtils.js` |
| `data.js` (storage) | `services/StorageService.js` |
| `data.js` (init) | `controllers/AppController.js` |
| `render.js` (list) | `views/NodeListView.js` |
| `render.js` (tiles) | `views/TilesView.js` |
| `render.js` (runner) | `views/RunnerView.js` |
| `render.js` (history) | `views/HistoryView.js` |
| `render.js` (errors) | `views/ErrorsView.js` |
| `render.js` (helpers) | `utils/HtmlUtils.js` |
| `runner.js` | `controllers/NavigationController.js` |
| `io.js` | `services/ImportExportService.js` |
| `validation.js` | `services/ValidationService.js` |
| `app.js` (DOM refs) | `ui/DOMRegistry.js` |
| `app.js` (events) | `controllers/AppController.js` |
| `app.js` (view state) | `ui/ViewManager.js` |
| `app.js` (resize) | `ui/ResizeHandler.js` |
| `app.js` (boot) | `controllers/AppController.js` |

---

## Key Patterns

### 1. State Management Pattern

**Before:**
```javascript
// Global state
let graph = { ... };
let session = { ... };

// Direct mutation
graph.nodes.push(newNode);
```

**After:**
```javascript
// Encapsulated state
class StateManager {
  setGraph(graph) {
    this.graph = graph;
    this.notify('graph:changed', graph);
  }
}

// Controlled updates
stateManager.setGraph(newGraph);
```

### 2. Event-Driven Communication

**Before:**
```javascript
// Direct function calls
renderNodeList();
renderRunner();
validateGraph();
```

**After:**
```javascript
// Event-driven
eventBus.emit('node:created', node);
// Views subscribe and update automatically
```

### 3. Dependency Injection

**Before:**
```javascript
// Direct global access
function renderNodeList() {
  const nodes = graph.nodes; // global
  // ...
}
```

**After:**
```javascript
// Injected dependencies
class NodeListView {
  constructor(stateManager, eventBus) {
    this.state = stateManager;
    this.events = eventBus;
  }
  
  render() {
    const nodes = this.state.graph.nodes;
    // ...
  }
}
```

### 4. Service Pattern

**Before:**
```javascript
// Mixed with state
function saveLocal() {
  localStorage.setItem('dd_graph_v1', JSON.stringify({ graph, session }));
}
```

**After:**
```javascript
// Isolated service
class StorageService {
  save(stateManager) {
    const data = {
      graph: stateManager.graph.toJSON(),
      session: stateManager.session.toJSON()
    };
    localStorage.setItem('dd_graph_v1', JSON.stringify(data));
  }
}
```

---

## Module Dependencies

```
controllers/
  ├── AppController
  │   ├── depends on: StateManager, EventBus, DOMRegistry, all Controllers
  ├── NodeController
  │   ├── depends on: StateManager, EventBus, StorageService, IdUtils
  └── NavigationController
      ├── depends on: StateManager, EventBus, UrlService, NodeUtils

views/
  ├── NodeListView
  │   ├── depends on: StateManager, EventBus, HtmlUtils
  ├── TilesView
  │   ├── depends on: StateManager, EventBus, NodeUtils
  ├── RunnerView
  │   ├── depends on: StateManager, EventBus, HtmlUtils
  ├── HistoryView
  │   ├── depends on: StateManager, EventBus
  └── ErrorsView
      ├── depends on: ValidationService, EventBus

services/
  ├── StorageService
  │   ├── depends on: (none - pure service)
  ├── ValidationService
  │   ├── depends on: (none - pure service)
  ├── ImportExportService
  │   ├── depends on: StorageService
  └── UrlService
      ├── depends on: (none - pure service)

core/
  ├── Graph
  │   ├── depends on: (none - pure model)
  ├── Session
  │   ├── depends on: (none - pure model)
  └── StateManager
      ├── depends on: Graph, Session

utils/
  ├── IdUtils
  │   ├── depends on: (none - pure functions)
  ├── NodeUtils
  │   ├── depends on: (none - pure functions)
  └── HtmlUtils
      ├── depends on: (none - pure functions)

ui/
  ├── DOMRegistry
  │   ├── depends on: (none - DOM access only)
  ├── ViewManager
  │   ├── depends on: EventBus
  ├── ResizeHandler
  │   ├── depends on: DOMRegistry, StorageService
  └── EventBus
      ├── depends on: (none - pure event system)
```

---

## Testing Strategy

### Unit Tests
- **Utils**: Pure functions, easy to test
- **Services**: Mock dependencies, test in isolation
- **Core**: Test data models and state management

### Integration Tests
- **Controllers**: Test with real StateManager and EventBus
- **Views**: Test rendering with mock state

### E2E Tests
- **Full flow**: Test complete user workflows

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `src/utils/` directory
- [ ] Extract `IdUtils.js`
- [ ] Extract `NodeUtils.js`
- [ ] Extract `HtmlUtils.js`
- [ ] Create `src/services/` directory
- [ ] Extract `StorageService.js`
- [ ] Extract `ValidationService.js`
- [ ] Extract `ImportExportService.js`
- [ ] Create `src/ui/DOMRegistry.js`
- [ ] Update imports in existing files

### Phase 2: Core
- [ ] Create `src/core/` directory
- [ ] Create `Graph.js` class
- [ ] Create `Session.js` class
- [ ] Create `StateManager.js`
- [ ] Migrate state initialization
- [ ] Update all state access

### Phase 3: Views
- [ ] Create `src/views/` directory
- [ ] Extract `NodeListView.js`
- [ ] Extract `TilesView.js`
- [ ] Extract `RunnerView.js`
- [ ] Extract `HistoryView.js`
- [ ] Extract `ErrorsView.js`
- [ ] Create `EventBus.js`
- [ ] Wire up events

### Phase 4: Controllers
- [ ] Create `src/controllers/` directory
- [ ] Create `NodeController.js`
- [ ] Create `NavigationController.js`
- [ ] Create `AppController.js`
- [ ] Refactor `app.js` to use controllers
- [ ] Remove old code

### Phase 5: Polish
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Code review
- [ ] Performance testing

---

## Common Questions

**Q: Will this break existing functionality?**  
A: No, we're doing incremental migration. Old code stays until new code is tested.

**Q: How long will this take?**  
A: Estimated 8-12 weeks for full migration, but benefits start immediately.

**Q: Can we do this incrementally?**  
A: Yes! That's the recommended approach. Each phase can be done independently.

**Q: What if we need to add features during migration?**  
A: Add features to the new structure. Old code remains for existing features.

**Q: Do we need TypeScript?**  
A: Not required, but recommended for better type safety and IDE support.

