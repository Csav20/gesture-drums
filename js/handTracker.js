/* ============================================
   Hand Tracker — MediaPipe Hands wrapper
   Tracks both hands and draws landmarks.
   ============================================ */

class HandTracker {
    constructor(videoEl, canvasEl, onResults) {
        this.video = videoEl;
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.onResults = onResults;
        this.hands = null;
        this.camera = null;
    }

    async init() {
        this.hands = new Hands({
            locateFile: function(file) {
                return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.9,
            minTrackingConfidence: 0.9
        });

        // EMA smoothing buffers per hand (reduces jitter)
        this._smoothed = [null, null];
        this._smoothAlpha = 0.45; // 0 = full smoothing, 1 = no smoothing

        var self = this;
        this.hands.onResults(function(results) {
            self._smoothLandmarks(results);
            self._drawLandmarks(results);
            if (self.onResults) self.onResults(results);
        });
    }

    _smoothLandmarks(results) {
        if (!results.multiHandLandmarks) return;
        var alpha = this._smoothAlpha;
        for (var h = 0; h < results.multiHandLandmarks.length; h++) {
            var lm = results.multiHandLandmarks[h];
            if (!this._smoothed[h]) {
                this._smoothed[h] = lm.map(function(p) { return { x: p.x, y: p.y, z: p.z }; });
            } else {
                for (var i = 0; i < lm.length; i++) {
                    this._smoothed[h][i].x = alpha * lm[i].x + (1 - alpha) * this._smoothed[h][i].x;
                    this._smoothed[h][i].y = alpha * lm[i].y + (1 - alpha) * this._smoothed[h][i].y;
                    this._smoothed[h][i].z = alpha * lm[i].z + (1 - alpha) * this._smoothed[h][i].z;
                }
            }
            results.multiHandLandmarks[h] = this._smoothed[h];
        }
        // Clear buffer for disappeared hands
        for (var j = results.multiHandLandmarks.length; j < 2; j++) {
            this._smoothed[j] = null;
        }
    }

    async start() {
        var self = this;
        this.camera = new Camera(this.video, {
            onFrame: async function() {
                await self.hands.send({ image: self.video });
            },
            width: 640,
            height: 480
        });
        await this.camera.start();
    }

    _drawLandmarks(results) {
        var ctx = this.ctx;
        var cw = this.canvas.width = this.video.videoWidth || 640;
        var ch = this.canvas.height = this.video.videoHeight || 480;
        ctx.clearRect(0, 0, cw, ch);

        if (!results.multiHandLandmarks) return;

        var colors = [
            { line: 'rgba(247, 112, 98, 0.7)', dot: '#f77062' },
            { line: 'rgba(52, 152, 219, 0.7)', dot: '#3498db' }
        ];

        for (var h = 0; h < results.multiHandLandmarks.length; h++) {
            var lm = results.multiHandLandmarks[h];
            var c = colors[h] || colors[0];

            // Draw connections
            drawConnectors(ctx, lm, HAND_CONNECTIONS, {
                color: c.line,
                lineWidth: 2
            });

            // Draw landmarks
            drawLandmarks(ctx, lm, {
                color: c.dot,
                lineWidth: 1,
                radius: 2
            });

            // Highlight index fingertip (drumstick tip) with larger circle
            var tip = lm[8];
            ctx.beginPath();
            ctx.arc(tip.x * cw, tip.y * ch, 6, 0, Math.PI * 2);
            ctx.fillStyle = c.dot;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

window.HandTracker = HandTracker;
