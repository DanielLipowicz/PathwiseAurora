/**
 * Node Controller
 * Handles node-related operations
 */

import { nextId, nextChildId, compareIds } from '../utils/IdUtils.js';
import { getChildren, migrateNode } from '../utils/NodeUtils.js';

export class NodeController {
  constructor(stateManager, eventBus, storageService) {
    this.state = stateManager;
    this.events = eventBus;
    this.storage = storageService;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Node operations
    this.events.on('node:updated', () => {
      this.storage.save(this.state.getGraph().toJSON(), this.state.getSession().toJSON());
      this.state.notifyUpdate();
    });

    this.events.on('node:delete-requested', (node) => {
      this.deleteNode(node);
    });

    this.events.on('node:clone-requested', (node) => {
      this.cloneNode(node);
    });

    this.events.on('node:add-child-requested', (node) => {
      this.addChildNode(node);
    });

    this.events.on('node:choice-add-requested', ({ node, label, to }) => {
      node.choices.push({ label, to: String(to) });
      this.events.emit('node:updated', node);
      this.events.emit('validation:requested');
    });

    this.events.on('node:create-requested', () => {
      this.createNode();
    });

    // Node migration (move)
    this.events.on('node:move-requested', ({ nodeId, newParentId }) => {
      this.moveNode(nodeId, newParentId);
    });
  }

  /**
   * Create a new node
   */
  createNode() {
    const graph = this.state.getGraph();
    if (!graph) return;

    const newId = nextId(graph.nodes);
    const newNode = {
      id: newId,
      title: 'New Node',
      body: 'Description…',
      choices: []
    };

    graph.nodes.push(newNode);
    this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
    this.state.setGraph(graph);
    this.events.emit('validation:requested');
    // Emit event with the new node ID for focus handling
    this.events.emit('node:created', { nodeId: newId, node: newNode });
  }

  /**
   * Delete a node
   * @param {Object} node - Node to delete
   */
  deleteNode(node) {
    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    // Remove references to this node
    graph.nodes.forEach(n => {
      n.choices = n.choices.filter(c => String(c.to) !== String(node.id));
    });

    // Remove the node and all its children
    const nodeIdStr = String(node.id);
    graph.nodes = graph.nodes.filter(n => {
      const nIdStr = String(n.id);
      return nIdStr !== nodeIdStr && !nIdStr.startsWith(nodeIdStr + '.');
    });

    // Session - if it was current, reset
    if (String(session.currentNodeId) === String(node.id)) {
      session.currentNodeId = null;
      session.history = [];
    }

    this.storage.save(graph.toJSON(), session.toJSON());
    this.state.setGraph(graph);
    this.state.setSession(session);
    this.events.emit('validation:requested');
  }

  /**
   * Clone a node
   * @param {Object} node - Node to clone
   */
  cloneNode(node) {
    const graph = this.state.getGraph();
    if (!graph) return;

    const clone = JSON.parse(JSON.stringify(node));
    clone.id = nextId(graph.nodes);
    // Reset choices IDs to prevent invalid references
    clone.choices = clone.choices.map(c => ({ ...c, to: String(c.to) }));
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
    if (!graph) return;

    const childId = nextChildId(String(parentNode.id), graph.nodes, getChildren);
    const child = {
      id: childId,
      title: 'New Child Node',
      body: 'Description…',
      choices: []
    };

    graph.nodes.push(child);
    // Automatically add a choice from parent to the new child
    parentNode.choices.push({ label: '', to: String(childId) });

    this.storage.save(graph.toJSON(), this.state.getSession().toJSON());
    this.state.setGraph(graph);
    this.events.emit('validation:requested');
    // Emit event with the new child node ID for focus handling
    this.events.emit('node:child-created', { childId, child });
  }

  /**
   * Move a node to another parent (or to root)
   * @param {string|number} nodeId - Node to move
   * @param {string|number|null} newParentId - New parent node id, or null for root
   */
  moveNode(nodeId, newParentId) {
    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    try {
      graph.nodes = migrateNode(graph.nodes, nodeId, newParentId);
    } catch (e) {
      alert(`Move failed: ${e.message}`);
      return;
    }

    this.storage.save(graph.toJSON(), session.toJSON());
    this.state.setGraph(graph);
    this.events.emit('validation:requested');
  }
}

