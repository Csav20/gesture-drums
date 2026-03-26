/* ============================================
   Hit Detector — Velocity-based strike detection
   Detects downward striking motion of index
   fingertips and maps to drum zones.
   ============================================ */

class HitDetector {
    constructor() {
        // Per-hand tracking state
        this.hands = [
            this._createHandState(),
            this._createHandState()
        ];

        // Detection thresholds (tuned with IronHands-inspired high-confidence tracking)
        this.STRIKE_VELOCITY_THRESHOLD = 0.008; // Min downward velocity to trigger (lowered for responsiveness)
        this.COOLDOWN_MS = 60;                   // Min time between hits per hand (faster rolls)
        this.HISTORY_LENGTH = 6;                  // Position history frames (smoother velocity)
        this.PEAK_DECEL_RATIO = 0.35;            // Deceleration ratio for strike detection
        this.VELOCITY_MAP_MAX = 0.045;           // Velocity ceiling for mapping to 1.0
        this.VELOCITY_FLOOR = 0.25;              // Min output velocity

        // Fist detection for hi-hat control
        this.leftFist = false;
        this.rightFist = false;
    }

    _createHandState() {
        return {
            history: [],           // [{x, y, t}]
            lastHitTime: 0,
            lastHitZone: null,
            wasMovingDown: false,
            peakVelocity: 0,
            strikePhase: 'idle'    // idle -> descending -> struck -> recovering
        };
    }

    /**
     * Update with new hand data and check for hits.
     * @param {number} handIndex - 0=left, 1=right
     * @param {object} landmarks - MediaPipe 21 landmarks
     * @param {DrumKit} drumKit - The drum kit for zone lookup
     * @returns {object|null} Hit result {zone, velocity, handIndex} or null
     */
    update(handIndex, landmarks, drumKit) {
        var state = this.hands[handIndex];
        var now = Date.now();

        // Index fingertip is landmark 8
        var tip = landmarks[8];
        var screenX = (1 - tip.x) * window.innerWidth;  // Mirror X
        var screenY = tip.y * window.innerHeight;

        // Track fist state for hi-hat (all fingers curled)
        this._updateFistState(handIndex, landmarks);

        // Add to history
        state.history.push({ x: screenX, y: screenY, t: now });
        if (state.history.length > this.HISTORY_LENGTH) {
            state.history.shift();
        }

        // Need at least 3 frames
        if (state.history.length < 3) return null;

        // Calculate velocity (positive = moving down)
        var velocityY = this._getVelocityY(state);
        var speed = Math.abs(velocityY);

        // State machine for strike detection
        var hit = null;

        switch (state.strikePhase) {
            case 'idle':
                // Start tracking when moving down fast enough
                if (velocityY > this.STRIKE_VELOCITY_THRESHOLD * 0.4) {
                    state.strikePhase = 'descending';
                    state.peakVelocity = velocityY;
                }
                break;

            case 'descending':
                // Track peak velocity
                if (velocityY > state.peakVelocity) {
                    state.peakVelocity = velocityY;
                }

                // Detect strike: velocity was high and now decelerating or reversing
                if (velocityY < state.peakVelocity * this.PEAK_DECEL_RATIO && state.peakVelocity > this.STRIKE_VELOCITY_THRESHOLD) {
                    // Check cooldown
                    if (now - state.lastHitTime > this.COOLDOWN_MS) {
                        // Find which drum zone the tip is over
                        var zone = drumKit.getZoneAt(screenX, screenY);
                        if (zone) {
                            // Hi-hat: if fist is closed, force closed hi-hat
                            var hitZone = zone;
                            if (zone.id === 'hihat_open' || zone.id === 'hihat_closed') {
                                if (this.leftFist || this.rightFist) {
                                    hitZone = { id: 'hihat_closed', x: zone.x, y: zone.y, rx: zone.rx, ry: zone.ry, color: zone.color, darkColor: zone.darkColor, type: zone.type, label: zone.label, sublabel: 'CLOSE' };
                                } else {
                                    hitZone = { id: 'hihat_open', x: zone.x, y: zone.y, rx: zone.rx, ry: zone.ry, color: zone.color, darkColor: zone.darkColor, type: zone.type, label: zone.label, sublabel: 'OPEN' };
                                }
                            }

                            // Map peak velocity to 0-1 range with interpolation (np.interp style)
                            var raw = (state.peakVelocity - this.STRIKE_VELOCITY_THRESHOLD) /
                                      (this.VELOCITY_MAP_MAX - this.STRIKE_VELOCITY_THRESHOLD);
                            var velocity = Math.max(0, Math.min(1.0, raw));
                            velocity = velocity * (1.0 - this.VELOCITY_FLOOR) + this.VELOCITY_FLOOR;

                            hit = {
                                zone: hitZone,
                                velocity: velocity,
                                handIndex: handIndex,
                                x: screenX,
                                y: screenY
                            };

                            state.lastHitTime = now;
                            state.lastHitZone = hitZone;
                        }
                    }
                    state.strikePhase = 'struck';
                }
                break;

            case 'struck':
                // Wait for upward motion (recovery) before allowing new strikes
                if (velocityY < -this.STRIKE_VELOCITY_THRESHOLD * 0.2) {
                    state.strikePhase = 'recovering';
                }
                // Or if too much time passed, go back to idle
                if (now - state.lastHitTime > 200) {
                    state.strikePhase = 'idle';
                    state.peakVelocity = 0;
                }
                break;

            case 'recovering':
                // Back to idle when hand stabilizes or starts moving down again
                if (Math.abs(velocityY) < this.STRIKE_VELOCITY_THRESHOLD * 0.25) {
                    state.strikePhase = 'idle';
                    state.peakVelocity = 0;
                }
                // Also allow quick transition if already moving down again
                if (velocityY > this.STRIKE_VELOCITY_THRESHOLD) {
                    state.strikePhase = 'descending';
                    state.peakVelocity = velocityY;
                }
                break;
        }

        return hit;
    }

    _getVelocityY(state) {
        var h = state.history;
        var len = h.length;
        if (len < 2) return 0;

        // Exponentially weighted average of recent velocity samples
        // More recent samples get exponentially higher weight (inspired by IronHands interp approach)
        var totalVel = 0;
        var totalWeight = 0;
        for (var i = 1; i < len; i++) {
            var dt = h[i].t - h[i - 1].t;
            if (dt <= 0) dt = 16; // assume ~60fps
            var vel = (h[i].y - h[i - 1].y) / dt;
            var weight = Math.pow(2, i); // Exponential weight: 2, 4, 8, 16...
            totalVel += vel * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? totalVel / totalWeight : 0;
    }

    _updateFistState(handIndex, lm) {
        // Simplified fist detection (IronHands approach):
        // Check if middle fingertip (12) is below middle finger MCP (9)
        // Combined with ring finger check for reliability
        var middleCurled = lm[12].y > lm[9].y;
        var ringCurled = lm[16].y > lm[13].y;
        var isFist = middleCurled && ringCurled;
        if (handIndex === 0) {
            this.leftFist = isFist;
        } else {
            this.rightFist = isFist;
        }
    }

    /**
     * Get the current screen position of a hand's index tip
     */
    getTipPosition(handIndex) {
        var state = this.hands[handIndex];
        if (state.history.length === 0) return null;
        var last = state.history[state.history.length - 1];
        return { x: last.x, y: last.y };
    }

    /**
     * Get whether the hand is in a striking motion
     */
    isStriking(handIndex) {
        return this.hands[handIndex].strikePhase === 'descending';
    }

    /**
     * Reset a hand's state (when hand disappears)
     */
    resetHand(handIndex) {
        this.hands[handIndex] = this._createHandState();
    }
}

window.HitDetector = HitDetector;
