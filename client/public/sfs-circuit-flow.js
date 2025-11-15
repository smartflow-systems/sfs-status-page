/**
 * SFS Circuit Flow Animation
 * Golden animated nodes with circuit connections
 * Part of SmartFlow Systems design system
 */

(function() {
  'use strict';

  const CONFIG = {
    nodeCount: 35,
    nodeRadius: 3,
    connectionDistance: 150,
    nodeSpeed: 0.3,
    goldColor: '#FFD700',
    goldAlpha: 0.6,
    lineAlpha: 0.15,
  };

  class Node {
    constructor(canvas) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * CONFIG.nodeSpeed;
      this.vy = (Math.random() - 0.5) * CONFIG.nodeSpeed;
      this.radius = CONFIG.nodeRadius;
    }

    update(canvas) {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Keep within bounds
      this.x = Math.max(0, Math.min(canvas.width, this.x));
      this.y = Math.max(0, Math.min(canvas.height, this.y));
    }

    draw(ctx) {
      ctx.fillStyle = CONFIG.goldColor;
      ctx.globalAlpha = CONFIG.goldAlpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class CircuitFlow {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.warn(`SFS Circuit Flow: Canvas element with id "${canvasId}" not found`);
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      this.nodes = [];
      this.animationId = null;
      this.isVisible = true;

      this.init();
      this.setupListeners();
      this.animate();
    }

    init() {
      this.resize();
      this.nodes = Array.from({ length: CONFIG.nodeCount }, () => new Node(this.canvas));
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

      this.ctx.scale(dpr, dpr);
    }

    setupListeners() {
      window.addEventListener('resize', () => {
        this.resize();
        this.nodes = Array.from({ length: CONFIG.nodeCount }, () => new Node(this.canvas));
      });

      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
      });
    }

    drawConnections() {
      const distanceSquared = CONFIG.connectionDistance ** 2;

      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const dx = this.nodes[i].x - this.nodes[j].x;
          const dy = this.nodes[i].y - this.nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < distanceSquared) {
            const opacity = (1 - Math.sqrt(distSq) / CONFIG.connectionDistance) * CONFIG.lineAlpha;

            this.ctx.strokeStyle = CONFIG.goldColor;
            this.ctx.globalAlpha = opacity;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
            this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
          }
        }
      }
    }

    animate() {
      if (!this.isVisible) {
        this.animationId = requestAnimationFrame(() => this.animate());
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw connections first (behind nodes)
      this.drawConnections();

      // Update and draw nodes
      this.nodes.forEach(node => {
        node.update(this.canvas);
        node.draw(this.ctx);
      });

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      window.removeEventListener('resize', this.resize);
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  // Auto-initialize when DOM is ready
  function initSFSCircuitFlow() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.sfsCircuitFlow = new CircuitFlow('sfs-circuit');
      });
    } else {
      window.sfsCircuitFlow = new CircuitFlow('sfs-circuit');
    }
  }

  // Export for module environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CircuitFlow, initSFSCircuitFlow };
  } else {
    window.CircuitFlow = CircuitFlow;
    initSFSCircuitFlow();
  }
})();
