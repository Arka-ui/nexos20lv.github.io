/*
 * Pierre Bouteman — Space Star Background
 * Rotating 3D starfield (inspired by sanidhyy/space-portfolio Three.js StarsCanvas)
 * Implemented in vanilla Canvas 2D — no dependencies.
 */

export class SpaceStars {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.rotX = 0;
        this.rotY = 0;
        this.raf = null;
        this.active = true;

        this._resize = () => this._onResize();
        window.addEventListener('resize', this._resize);

        this._onResize();
        this._init();
        this._tick();
    }

    _onResize() {
        this.W = this.canvas.width  = window.innerWidth;
        this.H = this.canvas.height = window.innerHeight;
        this.cx = this.W / 2;
        this.cy = this.H / 2;
        // Sphere radius: large enough to fill the viewport at any rotation
        this.R = Math.hypot(this.cx, this.cy) * 1.25;
    }

    _init() {
        const COUNT = 5000;
        this.stars = [];
        for (let i = 0; i < COUNT; i++) {
            // Uniform random point on a sphere shell (maath/random inSphere equivalent)
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi   = Math.acos(2 * v - 1);
            const r     = this.R * Math.cbrt(Math.random()); // uniform in sphere volume
            this.stars.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                size: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.6 + 0.4,
            });
        }
    }

    _tick() {
        if (!this.active) return;

        // Slow dual-axis rotation (matches @react-three/fiber useFrame delta/10, delta/15)
        this.rotX -= 0.0006;  // ~delta/10 at 60fps
        this.rotY -= 0.0004;  // ~delta/15 at 60fps

        const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);

        this.ctx.clearRect(0, 0, this.W, this.H);

        for (const s of this.stars) {
            // Rotate around X then Y (group rotation=[0,0,Math.PI/4] in original)
            let { x, y, z } = s;

            // Rotate X
            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            // Rotate Y
            const x2 = x * cosY + z1 * sinY;
            const z2 = -x * sinY + z1 * cosY;

            // Perspective projection
            const fov  = this.R * 1.4;
            const d    = fov / (fov + z2);
            if (d <= 0) continue;

            const px   = this.cx + x2 * d;
            const py   = this.cy + y1 * d;
            if (px < -2 || px > this.W + 2 || py < -2 || py > this.H + 2) continue;

            const sz   = Math.max(0.3, s.size * d);
            const a    = s.alpha * Math.min(1, d * 1.2);

            this.ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, sz, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.raf = requestAnimationFrame(() => this._tick());
    }

    /** Call to pause when perf-mode is on */
    pause() {
        this.active = false;
        if (this.raf) cancelAnimationFrame(this.raf);
    }

    /** Call to resume */
    resume() {
        if (this.active) return;
        this.active = true;
        this._tick();
    }

    destroy() {
        this.active = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this._resize);
    }
}
