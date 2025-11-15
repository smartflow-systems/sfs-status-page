/* ============================================================================
   # SFS CIRCUIT FLOW - GOLDEN BACKGROUND ANIMATION
   # Creates animated golden circuit patterns on canvas
   ============================================================================ */

(function() {
  'use strict';

  /* ## Configuration */
  const config = {
    lineColor: '#d4af37',
    nodeColor: '#f4e4c1',
    glowColor: '#d4af37',
    lineWidth: 1.5,
    nodeRadius: 3,
    glowRadius: 8,
    animationSpeed: 0.0008,
    gridSpacing: 150,
    opacity: 0.6,
    glowOpacity: 0.3
  };

  /* ## Circuit Flow Class */
  class CircuitFlow {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.warn(`Canvas with id "${canvasId}" not found`);
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      this.nodes = [];
      this.connections = [];
      this.animationFrame = null;
      this.time = 0;

      this.init();
      this.setupEventListeners();
    }

    /* ### Initialize Canvas and Circuit */
    init() {
      this.resize();
      this.generateCircuit();
      this.animate();
    }

    /* ### Resize Canvas to Fill Container */
    resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      this.ctx.scale(dpr, dpr);

      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';

      this.width = rect.width;
      this.height = rect.height;
    }

    /* ### Generate Circuit Nodes in Grid Pattern */
    generateCircuit() {
      this.nodes = [];
      this.connections = [];

      const cols = Math.ceil(this.width / config.gridSpacing);
      const rows = Math.ceil(this.height / config.gridSpacing);

      /* #### Create Grid of Nodes */
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          /* Add slight randomness to position */
          const offsetX = (Math.random() - 0.5) * 30;
          const offsetY = (Math.random() - 0.5) * 30;

          this.nodes.push({
            x: col * config.gridSpacing + offsetX,
            y: row * config.gridSpacing + offsetY,
            row,
            col,
            pulse: Math.random() * Math.PI * 2, /* Random starting phase */
            pulseSpeed: 0.5 + Math.random() * 0.5
          });
        }
      }

      /* #### Create Connections Between Nearby Nodes */
      this.nodes.forEach((node, index) => {
        /* Connect to right neighbor */
        const rightIndex = index + 1;
        if (rightIndex < this.nodes.length &&
            this.nodes[rightIndex].row === node.row) {
          this.connections.push({
            from: index,
            to: rightIndex,
            flow: Math.random(), /* Flow animation offset */
            flowSpeed: 0.3 + Math.random() * 0.4
          });
        }

        /* Connect to bottom neighbor */
        const cols = Math.ceil(this.width / config.gridSpacing);
        const bottomIndex = index + cols;
        if (bottomIndex < this.nodes.length) {
          this.connections.push({
            from: index,
            to: bottomIndex,
            flow: Math.random(),
            flowSpeed: 0.3 + Math.random() * 0.4
          });
        }

        /* Occasional diagonal connection for variety */
        if (Math.random() > 0.7) {
          const diagIndex = index + cols + 1;
          if (diagIndex < this.nodes.length &&
              this.nodes[diagIndex].col === node.col + 1) {
            this.connections.push({
              from: index,
              to: diagIndex,
              flow: Math.random(),
              flowSpeed: 0.3 + Math.random() * 0.4
            });
          }
        }
      });
    }

    /* ### Main Animation Loop */
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.time += config.animationSpeed;

      /* #### Draw Connections First (Behind Nodes) */
      this.drawConnections();

      /* #### Draw Nodes on Top */
      this.drawNodes();

      this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /* ### Draw Connection Lines with Flow Animation */
    drawConnections() {
      this.connections.forEach(conn => {
        const from = this.nodes[conn.from];
        const to = this.nodes[conn.to];

        if (!from || !to) return;

        /* #### Update Flow Position */
        conn.flow += conn.flowSpeed * config.animationSpeed * 100;
        if (conn.flow > 1) conn.flow = 0;

        /* #### Calculate Flow Position */
        const flowX = from.x + (to.x - from.x) * conn.flow;
        const flowY = from.y + (to.y - from.y) * conn.flow;

        /* #### Draw Base Line */
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = config.lineColor;
        this.ctx.globalAlpha = config.opacity * 0.4;
        this.ctx.lineWidth = config.lineWidth;
        this.ctx.stroke();

        /* #### Draw Flow Glow */
        const gradient = this.ctx.createRadialGradient(
          flowX, flowY, 0,
          flowX, flowY, config.glowRadius * 2
        );
        gradient.addColorStop(0, `${config.glowColor}ff`);
        gradient.addColorStop(0.5, `${config.glowColor}66`);
        gradient.addColorStop(1, `${config.glowColor}00`);

        this.ctx.beginPath();
        this.ctx.arc(flowX, flowY, config.glowRadius * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = config.glowOpacity;
        this.ctx.fill();
      });
    }

    /* ### Draw Circuit Nodes with Pulse Animation */
    drawNodes() {
      this.nodes.forEach(node => {
        /* #### Update Pulse */
        node.pulse += node.pulseSpeed * config.animationSpeed * 100;

        /* #### Calculate Pulse Size */
        const pulseSize = 1 + Math.sin(node.pulse) * 0.3;

        /* #### Draw Node Glow */
        const gradient = this.ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, config.glowRadius * pulseSize
        );
        gradient.addColorStop(0, `${config.glowColor}ff`);
        gradient.addColorStop(0.5, `${config.glowColor}44`);
        gradient.addColorStop(1, `${config.glowColor}00`);

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, config.glowRadius * pulseSize, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = config.glowOpacity * pulseSize;
        this.ctx.fill();

        /* #### Draw Node Core */
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, config.nodeRadius * pulseSize, 0, Math.PI * 2);
        this.ctx.fillStyle = config.nodeColor;
        this.ctx.globalAlpha = config.opacity;
        this.ctx.fill();
      });

      this.ctx.globalAlpha = 1; /* Reset alpha */
    }

    /* ### Setup Event Listeners */
    setupEventListeners() {
      /* #### Handle Window Resize */
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.resize();
          this.generateCircuit();
        }, 250);
      });

      /* #### Pause When Tab is Hidden (Performance) */
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
          }
        } else {
          if (!this.animationFrame) {
            this.animate();
          }
        }
      });
    }

    /* ### Cleanup */
    destroy() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      window.removeEventListener('resize', this.resize);
    }
  }

  /* ## Auto-Initialize When DOM is Ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new CircuitFlow('sfs-circuit');
    });
  } else {
    new CircuitFlow('sfs-circuit');
  }

  /* ## Expose to Window for Manual Control */
  window.SFSCircuitFlow = CircuitFlow;

})();

/* ============================================================================
   # END SFS CIRCUIT FLOW
   ============================================================================ */
