/**
 * Tiles View
 * Renders the tiles/grid view of nodes
 */

import { compareIds } from '../utils/IdUtils.js';
import { byId } from '../utils/NodeUtils.js';

export class TilesView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.events.on('graph:changed', () => this.render());
    this.events.on('session:changed', () => this.render());
    this.events.on('view:changed', (view) => {
      if (view === 'tiles') this.render();
    });
    this.events.on('state:updated', () => {
      // Only render if tiles view is active
      const viewManager = this.viewManager;
      if (viewManager && viewManager.getCurrentView() === 'tiles') {
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
    const container = this.dom.get('tilesContainer');
    const svg = this.dom.get('connectionsSvg');
    const filter = this.dom.get('filter');

    if (!container || !svg) return;

    container.innerHTML = '';
    svg.innerHTML = '';

    const graph = this.state.getGraph();
    const session = this.state.getSession();
    if (!graph || !session) return;

    const q = filter ? filter.value.toLowerCase() : '';
    const nodes = [...graph.nodes]
      .sort((a, b) => compareIds(a.id, b.id))
      .filter(n => (
        !q || String(n.id).includes(q) || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      ));

    // Create tiles for each node
    const tiles = [];
    const nodePositions = new Map();

    nodes.forEach((node) => {
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
          const targetExists = !!byId(String(choice.to), graph.nodes);
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

    // Position tiles in grid
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

      // Save position for drawing arrows
      const centerX = x + tileWidth / 2;
      const centerY = y + tileHeight / 2;
      nodePositions.set(String(item.node.id), { x: centerX, y: centerY, tile: item.tile });
    });

    // Set container height
    const totalRows = Math.ceil(tiles.length / cols);
    container.style.height = `${totalRows * (tileHeight + padding) + padding}px`;
    svg.setAttribute('width', container.offsetWidth || 400);
    svg.setAttribute('height', container.style.height);

    // Draw arrows between connected nodes
    nodes.forEach(node => {
      node.choices.forEach(choice => {
        const fromPos = nodePositions.get(String(node.id));
        const toPos = nodePositions.get(String(choice.to));

        if (fromPos && toPos) {
          // Calculate arrow start and end positions (on tile edges)
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Arrow angle
          const angle = Math.atan2(dy, dx);

          // Offset from center to tile edge
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

    // Add arrow marker
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

    // Handle tile clicks - navigate to node in runner
    tiles.forEach(item => {
      item.tile.style.cursor = 'pointer';
      item.tile.onclick = () => {
        this.events.emit('navigation:start-requested', item.node.id);
      };
    });

    // Scroll to active node if exists
    if (session.currentNodeId) {
      const activeTile = container.querySelector(`[data-node-id="${session.currentNodeId}"]`);
      if (activeTile) {
        setTimeout(() => {
          activeTile.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

    // Update arrows on window resize (only once)
    if (!window.tilesResizeHandler) {
      window.tilesResizeHandler = true;
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (this.viewManager && this.viewManager.getCurrentView() === 'tiles') {
            this.render();
          }
        }, 250);
      });
    }
  }
}

