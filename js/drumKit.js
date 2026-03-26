/* ============================================
   Drum Kit — First-person visual drum kit
   Renders drums from the drummer's perspective
   with hit zones and visual feedback.
   ============================================ */

class DrumKit {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.zones = [];
        this.ripples = [];
        this.kitStyle = 0; // 0 = classic, 1 = neon
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._buildZones();
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this._buildZones();
    }

    _buildZones() {
        var w = this.w;
        var h = this.h;
        // All positions relative to screen, first-person drummer view
        // Layout inspired by the Simple Drums image
        this.zones = [
            // Hi-Hat (left side)
            {
                id: 'hihat_closed', label: 'HI-HAT', sublabel: 'CLOSE',
                x: w * 0.1, y: h * 0.35,
                rx: w * 0.09, ry: w * 0.04,
                color: '#c9a84c', darkColor: '#8a7133',
                type: 'cymbal'
            },
            {
                id: 'hihat_open', label: 'HI-HAT', sublabel: 'OPEN',
                x: w * 0.08, y: h * 0.52,
                rx: w * 0.07, ry: w * 0.03,
                color: '#c9a84c', darkColor: '#8a7133',
                type: 'cymbal'
            },
            // Crash (left-center top)
            {
                id: 'crash', label: 'CRASH', sublabel: '',
                x: w * 0.28, y: h * 0.2,
                rx: w * 0.1, ry: w * 0.045,
                color: '#d4af37', darkColor: '#9a7d25',
                type: 'cymbal'
            },
            // Ride (right side)
            {
                id: 'ride', label: 'RIDE', sublabel: '',
                x: w * 0.78, y: h * 0.25,
                rx: w * 0.1, ry: w * 0.045,
                color: '#d4af37', darkColor: '#9a7d25',
                type: 'cymbal'
            },
            // Ride Bell
            {
                id: 'ride_bell', label: 'BELL', sublabel: '',
                x: w * 0.78, y: h * 0.25,
                rx: w * 0.03, ry: w * 0.015,
                color: '#e8c84a', darkColor: '#b8952a',
                type: 'cymbal'
            },
            // Crash 2 (right)
            {
                id: 'crash', label: 'CRASH', sublabel: '2',
                x: w * 0.88, y: h * 0.48,
                rx: w * 0.08, ry: w * 0.035,
                color: '#d4af37', darkColor: '#9a7d25',
                type: 'cymbal'
            },
            // Snare (center-left)
            {
                id: 'snare', label: 'SNARE', sublabel: '',
                x: w * 0.35, y: h * 0.58,
                rx: w * 0.08, ry: w * 0.055,
                color: '#e8e8e8', darkColor: '#a0a0a0',
                type: 'drum'
            },
            // Rim
            {
                id: 'rim', label: 'RIM', sublabel: 'SHOT',
                x: w * 0.27, y: h * 0.65,
                rx: w * 0.035, ry: w * 0.025,
                color: '#c0c0c0', darkColor: '#808080',
                type: 'drum'
            },
            // Rim right
            {
                id: 'rim', label: 'RIM', sublabel: 'SHOT',
                x: w * 0.56, y: h * 0.65,
                rx: w * 0.035, ry: w * 0.025,
                color: '#c0c0c0', darkColor: '#808080',
                type: 'drum'
            },
            // Tom High (center top)
            {
                id: 'tom_high', label: 'TOM', sublabel: 'HIGH',
                x: w * 0.43, y: h * 0.38,
                rx: w * 0.065, ry: w * 0.045,
                color: '#2c2c2c', darkColor: '#1a1a1a',
                type: 'drum'
            },
            // Tom Mid (center-right top)
            {
                id: 'tom_mid', label: 'TOM', sublabel: 'MID',
                x: w * 0.58, y: h * 0.38,
                rx: w * 0.065, ry: w * 0.045,
                color: '#2c2c2c', darkColor: '#1a1a1a',
                type: 'drum'
            },
            // Tom Low / Floor Tom (far right)
            {
                id: 'tom_low', label: 'FLOOR', sublabel: 'TOM',
                x: w * 0.72, y: h * 0.6,
                rx: w * 0.075, ry: w * 0.055,
                color: '#2c2c2c', darkColor: '#1a1a1a',
                type: 'drum'
            },
            // Kick (center bottom)
            {
                id: 'kick', label: 'KICK', sublabel: '',
                x: w * 0.5, y: h * 0.82,
                rx: w * 0.12, ry: w * 0.06,
                color: '#1a1a1a', darkColor: '#0a0a0a',
                type: 'kick'
            }
        ];
    }

    /**
     * Get the drum zone at screen coordinates
     * @returns {object|null} zone with id
     */
    getZoneAt(x, y) {
        // Check in reverse order so smaller zones (ride_bell, rim) are checked first
        for (var i = this.zones.length - 1; i >= 0; i--) {
            var z = this.zones[i];
            // Smaller zones should be checked first — ride_bell sits on top of ride
            var dx = (x - z.x) / z.rx;
            var dy = (y - z.y) / z.ry;
            if (dx * dx + dy * dy <= 1) {
                return z;
            }
        }
        return null;
    }

    /**
     * Trigger hit ripple effect
     */
    triggerHit(zone, velocity) {
        this.ripples.push({
            x: zone.x,
            y: zone.y,
            rx: zone.rx,
            ry: zone.ry,
            color: zone.type === 'cymbal' ? '#ffd700' : '#ffffff',
            alpha: Math.min(1, velocity * 1.2),
            scale: 1,
            maxScale: 1.8 + velocity * 0.5,
            type: zone.type
        });
    }

    /**
     * Toggle kit visual style
     */
    toggleStyle() {
        this.kitStyle = (this.kitStyle + 1) % 2;
    }

    /**
     * Render the drum kit
     */
    render() {
        var ctx = this.ctx;
        var w = this.w;
        var h = this.h;

        // Background
        if (this.kitStyle === 0) {
            // Classic wood/dark
            var bg = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.8);
            bg.addColorStop(0, '#2a1f14');
            bg.addColorStop(0.5, '#1a1209');
            bg.addColorStop(1, '#0a0805');
            ctx.fillStyle = bg;
        } else {
            // Neon dark
            var bg2 = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.8);
            bg2.addColorStop(0, '#0f1020');
            bg2.addColorStop(0.5, '#080812');
            bg2.addColorStop(1, '#020208');
            ctx.fillStyle = bg2;
        }
        ctx.fillRect(0, 0, w, h);

        // Draw hardware/stands (simplified lines)
        this._drawStands(ctx);

        // Draw each zone
        for (var i = 0; i < this.zones.length; i++) {
            this._drawZone(ctx, this.zones[i]);
        }

        // Draw ripples
        this._drawRipples(ctx);
    }

    _drawStands(ctx) {
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.3)';
        ctx.lineWidth = 3;

        // Hi-hat stand
        ctx.beginPath();
        ctx.moveTo(this.w * 0.1, this.h * 0.55);
        ctx.lineTo(this.w * 0.1, this.h * 0.95);
        ctx.stroke();

        // Crash stand
        ctx.beginPath();
        ctx.moveTo(this.w * 0.28, this.h * 0.25);
        ctx.lineTo(this.w * 0.3, this.h * 0.75);
        ctx.stroke();

        // Ride stand
        ctx.beginPath();
        ctx.moveTo(this.w * 0.78, this.h * 0.3);
        ctx.lineTo(this.w * 0.76, this.h * 0.75);
        ctx.stroke();

        // Snare stand
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.w * 0.35, this.h * 0.63);
        ctx.lineTo(this.w * 0.33, this.h * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.w * 0.35, this.h * 0.63);
        ctx.lineTo(this.w * 0.37, this.h * 0.9);
        ctx.stroke();

        // Kick pedal
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.w * 0.5, this.h * 0.88);
        ctx.lineTo(this.w * 0.5, this.h * 0.98);
        ctx.stroke();
    }

    _drawZone(ctx, zone) {
        var neon = this.kitStyle === 1;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);

        if (zone.type === 'cymbal') {
            // Cymbal — metallic gradient
            var grad = ctx.createRadialGradient(
                zone.x - zone.rx * 0.2, zone.y - zone.ry * 0.3, 0,
                zone.x, zone.y, zone.rx
            );
            if (neon) {
                grad.addColorStop(0, 'rgba(255, 215, 50, 0.35)');
                grad.addColorStop(0.7, 'rgba(180, 140, 20, 0.2)');
                grad.addColorStop(1, 'rgba(100, 80, 10, 0.15)');
            } else {
                grad.addColorStop(0, zone.color);
                grad.addColorStop(0.6, zone.darkColor);
                grad.addColorStop(1, '#3d2e14');
            }
            ctx.fillStyle = grad;
            ctx.fill();

            // Groove lines for cymbal
            ctx.strokeStyle = neon ? 'rgba(255, 215, 0, 0.3)' : 'rgba(180, 150, 60, 0.3)';
            ctx.lineWidth = 0.5;
            for (var r = zone.rx * 0.3; r < zone.rx; r += zone.rx * 0.12) {
                ctx.beginPath();
                ctx.ellipse(zone.x, zone.y, r, r * (zone.ry / zone.rx), 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Outer edge
            ctx.beginPath();
            ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = neon ? 'rgba(255, 215, 0, 0.5)' : 'rgba(200, 170, 70, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (neon) {
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

        } else if (zone.type === 'drum') {
            // Drum head
            var drumGrad = ctx.createRadialGradient(
                zone.x, zone.y - zone.ry * 0.2, 0,
                zone.x, zone.y, zone.rx
            );
            if (neon) {
                drumGrad.addColorStop(0, 'rgba(200, 200, 220, 0.2)');
                drumGrad.addColorStop(0.8, 'rgba(80, 80, 100, 0.15)');
                drumGrad.addColorStop(1, 'rgba(40, 40, 60, 0.3)');
            } else {
                drumGrad.addColorStop(0, '#e8e0d0');
                drumGrad.addColorStop(0.8, '#c8b8a0');
                drumGrad.addColorStop(1, zone.darkColor);
            }
            ctx.fillStyle = drumGrad;
            ctx.fill();

            // Rim
            ctx.beginPath();
            ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = neon ? 'rgba(200, 200, 255, 0.4)' : '#888';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Shell visible at bottom
            ctx.beginPath();
            ctx.ellipse(zone.x, zone.y + zone.ry * 0.15, zone.rx, zone.ry, 0, 0.1, Math.PI - 0.1);
            ctx.strokeStyle = neon ? 'rgba(100, 100, 160, 0.3)' : 'rgba(60, 40, 30, 0.5)';
            ctx.lineWidth = 8;
            ctx.stroke();

            if (neon) {
                ctx.beginPath();
                ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
                ctx.shadowColor = '#8080ff';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = 'rgba(150, 150, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

        } else if (zone.type === 'kick') {
            // Kick drum (viewed from top)
            var kickGrad = ctx.createRadialGradient(
                zone.x, zone.y, zone.rx * 0.2,
                zone.x, zone.y, zone.rx
            );
            if (neon) {
                kickGrad.addColorStop(0, 'rgba(30, 30, 50, 0.5)');
                kickGrad.addColorStop(0.5, 'rgba(20, 20, 35, 0.4)');
                kickGrad.addColorStop(1, 'rgba(10, 10, 20, 0.6)');
            } else {
                kickGrad.addColorStop(0, '#2a2a2a');
                kickGrad.addColorStop(0.5, '#1a1a1a');
                kickGrad.addColorStop(1, '#0a0a0a');
            }
            ctx.fillStyle = kickGrad;
            ctx.fill();

            // Kick logo circle
            ctx.beginPath();
            ctx.ellipse(zone.x, zone.y, zone.rx * 0.45, zone.ry * 0.45, 0, 0, Math.PI * 2);
            ctx.strokeStyle = neon ? 'rgba(247, 112, 98, 0.4)' : 'rgba(150, 150, 150, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Outer rim
            ctx.beginPath();
            ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = neon ? 'rgba(247, 112, 98, 0.3)' : '#444';
            ctx.lineWidth = 4;
            ctx.stroke();

            if (neon) {
                ctx.shadowColor = '#f77062';
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        // Label
        ctx.fillStyle = neon ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)';
        ctx.font = 'bold ' + Math.max(10, zone.rx * 0.22) + 'px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.label, zone.x, zone.y - (zone.sublabel ? 6 : 0));
        if (zone.sublabel) {
            ctx.font = Math.max(8, zone.rx * 0.16) + 'px -apple-system, sans-serif';
            ctx.fillText(zone.sublabel, zone.x, zone.y + 10);
        }

        ctx.restore();
    }

    _drawRipples(ctx) {
        for (var i = this.ripples.length - 1; i >= 0; i--) {
            var r = this.ripples[i];
            r.scale += 0.08;
            r.alpha -= 0.035;

            if (r.alpha <= 0 || r.scale >= r.maxScale) {
                this.ripples.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = r.alpha;

            // Expanding ring
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.rx * r.scale, r.ry * r.scale, 0, 0, Math.PI * 2);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 20;
            ctx.stroke();

            // Flash fill
            if (r.scale < 1.2) {
                ctx.beginPath();
                ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
                ctx.fillStyle = r.color;
                ctx.globalAlpha = r.alpha * 0.3;
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

window.DrumKit = DrumKit;
