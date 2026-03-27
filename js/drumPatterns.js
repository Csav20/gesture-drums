/* ============================================
   Drum Patterns — Learning & Practice System
   Visual sequence guide with levels and
   well-known rhythm patterns.
   ============================================ */

class DrumPatterns {
    constructor(audioEngine, drumKit) {
        this.audioEngine = audioEngine;
        this.drumKit = drumKit;
        this.active = false;
        this.currentPattern = null;
        this.currentStep = 0;
        this.bpm = 90;
        this.lastStepTime = 0;
        this.score = 0;
        this.totalHits = 0;
        this.missedHits = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.isPlaying = false;
        this.countdownBeats = 0;
        this.stepTimeout = null;
        this.activeHighlights = []; // zones currently highlighted
        this.hitWindow = 600; // ms window to hit the right drum
        this.onStepChange = null; // callback
        this.onComplete = null;
        this.onScore = null;
    }

    // ---- Pattern Library ----
    static get PATTERNS() {
        return {
            // ===== BÁSICO =====
            basic_hihat: {
                name: 'Hi-Hat Básico',
                level: 'basico',
                emoji: '🔒',
                bpm: 80,
                description: 'Mantén el ritmo con el hi-hat cerrado',
                timeSignature: 4,
                // Each step: array of drum IDs to hit simultaneously
                // '.' means rest
                steps: [
                    ['hihat_closed'], ['hihat_closed'], ['hihat_closed'], ['hihat_closed'],
                    ['hihat_closed'], ['hihat_closed'], ['hihat_closed'], ['hihat_closed'],
                    ['hihat_closed'], ['hihat_closed'], ['hihat_closed'], ['hihat_closed'],
                    ['hihat_closed'], ['hihat_closed'], ['hihat_closed'], ['hihat_closed']
                ]
            },
            basic_kick_snare: {
                name: 'Kick y Snare',
                level: 'basico',
                emoji: '🦶🥁',
                bpm: 70,
                description: 'Alterna entre kick y snare',
                timeSignature: 4,
                steps: [
                    ['kick'], ['.'], ['snare'], ['.'],
                    ['kick'], ['.'], ['snare'], ['.'],
                    ['kick'], ['.'], ['snare'], ['.'],
                    ['kick'], ['.'], ['snare'], ['.']
                ]
            },
            basic_rock_simple: {
                name: 'Rock Simple',
                level: 'basico',
                emoji: '🎸',
                bpm: 80,
                description: 'El ritmo de rock más básico',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['.'], ['snare', 'hihat_closed'], ['.'],
                    ['kick', 'hihat_closed'], ['.'], ['snare', 'hihat_closed'], ['.'],
                    ['kick', 'hihat_closed'], ['.'], ['snare', 'hihat_closed'], ['.'],
                    ['kick', 'hihat_closed'], ['.'], ['snare', 'hihat_closed'], ['.']
                ]
            },

            // ===== MEDIO =====
            mid_8th_rock: {
                name: 'Rock 8th Notes',
                level: 'medio',
                emoji: '🎵',
                bpm: 90,
                description: 'Rock con hi-hat en corcheas',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed']
                ]
            },
            mid_funk_basic: {
                name: 'Funk Básico',
                level: 'medio',
                emoji: '🕺',
                bpm: 95,
                description: 'Groove funk con kick sincopado',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed']
                ]
            },
            mid_disco: {
                name: 'Disco Beat',
                level: 'medio',
                emoji: '🪩',
                bpm: 110,
                description: 'El clásico ritmo disco con hi-hat abierto',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed']
                ]
            },

            // ===== AVANZADO =====
            adv_paradiddle: {
                name: 'Paradiddle',
                level: 'avanzado',
                emoji: '🔥',
                bpm: 85,
                description: 'RLRR LRLL sobre snare y tom',
                timeSignature: 4,
                steps: [
                    ['snare'], ['tom_high'], ['snare'], ['snare'],
                    ['tom_high'], ['snare'], ['tom_high'], ['tom_high'],
                    ['snare'], ['tom_high'], ['snare'], ['snare'],
                    ['tom_high'], ['snare'], ['tom_high'], ['tom_high']
                ]
            },
            adv_shuffle: {
                name: 'Blues Shuffle',
                level: 'avanzado',
                emoji: '🎷',
                bpm: 85,
                description: 'Shuffle tripleteado con swing',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['.'], ['hihat_closed'],
                    ['snare', 'hihat_closed'], ['.'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['.'], ['hihat_closed'],
                    ['snare', 'hihat_closed'], ['.'], ['hihat_closed']
                ]
            },
            adv_latin: {
                name: 'Bossa Nova',
                level: 'avanzado',
                emoji: '🌴',
                bpm: 130,
                description: 'Ritmo brasileño con ride y cross-stick',
                timeSignature: 4,
                steps: [
                    ['kick', 'ride'], ['ride'], ['rim', 'ride'], ['ride'],
                    ['ride'], ['kick', 'ride'], ['rim', 'ride'], ['ride'],
                    ['kick', 'ride'], ['ride'], ['rim', 'ride'], ['ride'],
                    ['ride'], ['kick', 'ride'], ['rim', 'ride'], ['ride']
                ]
            },

            // ===== RITMOS FAMOSOS =====
            famous_billie_jean: {
                name: 'Billie Jean (MJ)',
                level: 'famosos',
                emoji: '🕴️',
                bpm: 117,
                description: 'El icónico beat de Michael Jackson',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed']
                ]
            },
            famous_we_will_rock: {
                name: 'We Will Rock You',
                level: 'famosos',
                emoji: '👑',
                bpm: 82,
                description: 'BUM BUM CLAP — Queen',
                timeSignature: 4,
                steps: [
                    ['kick'], ['kick'], ['snare'], ['.'],
                    ['kick'], ['kick'], ['snare'], ['.'],
                    ['kick'], ['kick'], ['snare'], ['.'],
                    ['kick'], ['kick'], ['snare'], ['.']
                ]
            },
            famous_back_in_black: {
                name: 'Back in Black (AC/DC)',
                level: 'famosos',
                emoji: '⚡',
                bpm: 94,
                description: 'Hard rock clásico de Phil Rudd',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_open'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed']
                ]
            },
            famous_another_one: {
                name: 'Another One Bites (Queen)',
                level: 'famosos',
                emoji: '🎤',
                bpm: 110,
                description: 'Groove funky de Roger Taylor',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['kick', 'hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['kick', 'hihat_closed']
                ]
            },
            famous_smells_teen: {
                name: 'Smells Like Teen Spirit',
                level: 'famosos',
                emoji: '🎸',
                bpm: 116,
                description: 'El beat grunge de Dave Grohl',
                timeSignature: 4,
                steps: [
                    ['kick', 'crash'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed'],
                    ['kick', 'hihat_closed'], ['kick', 'hihat_closed'], ['snare', 'hihat_closed'], ['hihat_closed']
                ]
            },
            famous_stayin_alive: {
                name: "Stayin' Alive (Bee Gees)",
                level: 'famosos',
                emoji: '🕺',
                bpm: 104,
                description: 'El beat disco por excelencia',
                timeSignature: 4,
                steps: [
                    ['kick', 'hihat_closed'], ['hihat_open'], ['snare', 'hihat_closed'], ['hihat_open'],
                    ['kick', 'hihat_closed'], ['hihat_open'], ['snare', 'hihat_closed'], ['hihat_open'],
                    ['kick', 'hihat_closed'], ['hihat_open'], ['snare', 'hihat_closed'], ['hihat_open'],
                    ['kick', 'hihat_closed'], ['hihat_open'], ['snare', 'hihat_closed'], ['hihat_open']
                ]
            }
        };
    }

    // ---- Color map for drum zones ----
    static get ZONE_COLORS() {
        return {
            kick:         '#e74c3c',  // Rojo
            snare:        '#3498db',  // Azul
            hihat_closed: '#2ecc71',  // Verde
            hihat_open:   '#27ae60',  // Verde oscuro
            tom_high:     '#e67e22',  // Naranja
            tom_mid:      '#f39c12',  // Amarillo naranja
            tom_low:      '#d35400',  // Naranja oscuro
            crash:        '#9b59b6',  // Morado
            ride:         '#1abc9c',  // Turquesa
            ride_bell:    '#16a085',  // Turquesa oscuro
            rim:          '#95a5a6'   // Gris
        };
    }

    // ---- Get patterns by level ----
    static getPatternsByLevel(level) {
        var all = DrumPatterns.PATTERNS;
        var result = [];
        for (var key in all) {
            if (all[key].level === level) {
                result.push({ key: key, pattern: all[key] });
            }
        }
        return result;
    }

    static getLevels() {
        return [
            { id: 'basico', name: 'Básico', emoji: '🟢', description: 'Ritmos simples para empezar' },
            { id: 'medio', name: 'Medio', emoji: '🟡', description: 'Combinaciones con más elementos' },
            { id: 'avanzado', name: 'Avanzado', emoji: '🔴', description: 'Patrones complejos y técnicos' },
            { id: 'famosos', name: 'Ritmos Famosos', emoji: '⭐', description: 'Canciones icónicas' }
        ];
    }

    // ---- Start a pattern ----
    start(patternKey) {
        var pattern = DrumPatterns.PATTERNS[patternKey];
        if (!pattern) return;

        this.currentPattern = pattern;
        this.currentStep = -4; // 4 beats countdown
        this.bpm = pattern.bpm;
        this.score = 0;
        this.totalHits = 0;
        this.missedHits = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.active = true;
        this.isPlaying = true;
        this.activeHighlights = [];
        this.lastStepTime = performance.now();
        this._pendingHits = [];
        this._stepHitDrums = new Set();
        this._advance();
    }

    stop() {
        this.active = false;
        this.isPlaying = false;
        this.activeHighlights = [];
        this._pendingHits = [];
        if (this.stepTimeout) {
            clearTimeout(this.stepTimeout);
            this.stepTimeout = null;
        }
        if (this.onComplete) {
            this.onComplete(this._getResults());
        }
    }

    _getResults() {
        var total = this.totalHits + this.missedHits;
        return {
            score: this.score,
            total: total,
            perfect: this.perfectHits,
            good: this.goodHits,
            missed: this.missedHits,
            bestStreak: this.bestStreak,
            accuracy: total > 0 ? Math.round((this.totalHits / total) * 100) : 0
        };
    }

    // ---- Advance to next step ----
    _advance() {
        if (!this.active) return;

        var interval = (60000 / this.bpm) / 2; // 8th note steps

        // Check missed hits from previous step
        if (this.currentStep >= 0 && this._pendingHits.length > 0) {
            this.missedHits += this._pendingHits.length;
            this.streak = 0;
        }

        this.currentStep++;

        // Pattern complete — loop or stop
        if (this.currentPattern && this.currentStep >= this.currentPattern.steps.length) {
            this.stop();
            return;
        }

        // Countdown phase
        if (this.currentStep < 0) {
            var beat = 4 + this.currentStep; // 0,1,2,3
            this.audioEngine.click(null, beat === 0);
            this.activeHighlights = [];
            this._pendingHits = [];

            if (this.onStepChange) {
                this.onStepChange({
                    countdown: true,
                    beat: 4 + this.currentStep + 1,
                    total: 4
                });
            }

            this.stepTimeout = setTimeout(() => this._advance(), interval);
            return;
        }

        var step = this.currentPattern.steps[this.currentStep];
        this._stepHitDrums = new Set();

        if (step[0] === '.') {
            // Rest — no highlight
            this.activeHighlights = [];
            this._pendingHits = [];
        } else {
            // Set active zones to highlight
            this.activeHighlights = step.slice();
            this._pendingHits = step.slice();
        }

        this.lastStepTime = performance.now();

        if (this.onStepChange) {
            this.onStepChange({
                countdown: false,
                step: this.currentStep,
                total: this.currentPattern.steps.length,
                drums: step,
                highlights: this.activeHighlights
            });
        }

        this.stepTimeout = setTimeout(() => this._advance(), interval);
    }

    // ---- Register a hit from the player ----
    registerHit(drumId) {
        if (!this.active || this.currentStep < 0) return null;

        var timeSinceStep = performance.now() - this.lastStepTime;

        // Check if this drum is in the pending hits
        var idx = this._pendingHits.indexOf(drumId);
        if (idx !== -1 && !this._stepHitDrums.has(drumId)) {
            this._pendingHits.splice(idx, 1);
            this._stepHitDrums.add(drumId);
            this.totalHits++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;

            // Score based on timing
            var result;
            if (timeSinceStep < this.hitWindow * 0.4) {
                this.perfectHits++;
                this.score += 100 + (this.streak * 5);
                result = 'perfect';
            } else if (timeSinceStep < this.hitWindow) {
                this.goodHits++;
                this.score += 50 + (this.streak * 2);
                result = 'good';
            } else {
                this.score += 10;
                result = 'late';
            }

            if (this.onScore) {
                this.onScore({
                    result: result,
                    score: this.score,
                    streak: this.streak,
                    drumId: drumId
                });
            }

            return result;
        }

        return null;
    }

    // ---- Draw highlights on drum zones ----
    drawHighlights(ctx, zones) {
        if (!this.active || this.activeHighlights.length === 0) return;

        var now = performance.now();
        var elapsed = now - this.lastStepTime;
        var interval = (60000 / this.bpm) / 2;
        var progress = Math.min(1, elapsed / interval);

        // Pulsing alpha
        var pulseAlpha = 0.3 + 0.3 * Math.sin(now * 0.008);

        for (var h = 0; h < this.activeHighlights.length; h++) {
            var drumId = this.activeHighlights[h];
            if (drumId === '.') continue;

            var color = DrumPatterns.ZONE_COLORS[drumId] || '#ffffff';

            // Find matching zones
            for (var z = 0; z < zones.length; z++) {
                if (zones[z].id === drumId) {
                    var zone = zones[z];

                    ctx.save();

                    // Outer glow ring
                    ctx.beginPath();
                    ctx.ellipse(zone.x, zone.y, zone.rx * 1.15, zone.ry * 1.15, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = pulseAlpha * (1 - progress * 0.5);
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 25;
                    ctx.stroke();

                    // Filled zone highlight
                    ctx.beginPath();
                    ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.globalAlpha = (0.2 + 0.15 * Math.sin(now * 0.01)) * (1 - progress * 0.3);
                    ctx.shadowBlur = 40;
                    ctx.fill();

                    // Timer arc (countdown within the step)
                    ctx.beginPath();
                    ctx.ellipse(zone.x, zone.y, zone.rx * 1.2, zone.ry * 1.2, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress));
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 4;
                    ctx.globalAlpha = 0.7;
                    ctx.shadowBlur = 10;
                    ctx.stroke();

                    ctx.restore();

                    break; // only highlight first matching zone
                }
            }
        }
    }
}
