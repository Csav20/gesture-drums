/* ============================================
   Main Application — Gesture Drums
   Connects hand tracking, hit detection,
   audio engine, and drum kit rendering.
   ============================================ */

(function () {
    'use strict';

    // ---- DOM Elements ----
    var startBtn = document.getElementById('start-btn');
    var startupOverlay = document.getElementById('startup-overlay');
    var appEl = document.getElementById('app');
    var drumCanvas = document.getElementById('drum-canvas');
    var webcamVideo = document.getElementById('webcam');
    var handCanvas = document.getElementById('hand-canvas');
    var stickLeft = document.getElementById('stick-left');
    var stickRight = document.getElementById('stick-right');
    var fpsEl = document.getElementById('fps-counter');
    var latencyEl = document.getElementById('latency');
    var lastHitEl = document.getElementById('hud-center');
    var velocityBarLeft = document.getElementById('velocity-bar-left');
    var velocityBarRight = document.getElementById('velocity-bar-right');
    var btnToggleCamera = document.getElementById('btn-toggle-camera');
    var btnToggleKit = document.getElementById('btn-toggle-kit');
    var btnMetronome = document.getElementById('btn-metronome');
    var btnSettings = document.getElementById('btn-settings');
    var sensitivityPanel = document.getElementById('sensitivity-panel');
    var btnClosePanel = document.getElementById('btn-close-panel');
    var cameraOverlay = document.getElementById('camera-overlay');
    var btnPatterns = document.getElementById('btn-patterns');
    var patternsPanel = document.getElementById('patterns-panel');
    var btnClosePatterns = document.getElementById('btn-close-patterns');
    var patternsLevels = document.getElementById('patterns-levels');
    var patternsList = document.getElementById('patterns-list');
    var patternProgress = document.getElementById('pattern-progress');
    var progressName = document.getElementById('progress-name');
    var progressScore = document.getElementById('progress-score');
    var progressBarFill = document.getElementById('progress-bar-fill');
    var btnStopPattern = document.getElementById('btn-stop-pattern');
    var patternScore = document.getElementById('pattern-score');
    var scoreResult = document.getElementById('score-result');
    var scoreStreak = document.getElementById('score-streak');
    var patternCountdown = document.getElementById('pattern-countdown');
    var countdownNumber = document.getElementById('countdown-number');
    var patternResults = document.getElementById('pattern-results');
    var btnRetryPattern = document.getElementById('btn-retry-pattern');
    var btnBackPatterns = document.getElementById('btn-back-patterns');

    // ---- Core Systems ----
    var drumKit = null;
    var audioEngine = null;
    var handTracker = null;
    var hitDetector = null;
    var drumPatternsEngine = null;
    var currentPatternKey = null;

    // ---- State ----
    var isRunning = false;
    var frameCount = 0;
    var lastFpsTime = Date.now();
    var fps = 0;
    var cameraVisible = true;
    var handsVisible = [false, false];

    // Metronome
    var metronomeActive = false;
    var metronomeBPM = 120;
    var metronomeBeat = 0;
    var lastMetronomeTick = 0;

    // Hit display
    var lastHitName = '';
    var lastHitTime = 0;

    // Drum name map for display
    var drumLabels = {
        kick: '🦶 KICK',
        snare: '🥁 SNARE',
        hihat_closed: '🔒 HI-HAT',
        hihat_open: '🔓 HI-HAT',
        tom_high: '🔴 TOM HIGH',
        tom_mid: '🟠 TOM MID',
        tom_low: '🟤 FLOOR TOM',
        crash: '💥 CRASH',
        ride: '🔔 RIDE',
        ride_bell: '🔔 BELL',
        rim: '🪵 RIM SHOT'
    };

    var drumEmojis = {
        kick: '🦶',
        snare: '🥁',
        hihat_closed: '🔒',
        hihat_open: '🔓',
        tom_high: '🔴',
        tom_mid: '🟠',
        tom_low: '🟤',
        crash: '💥',
        ride: '🔔',
        ride_bell: '🛎️',
        rim: '🪵'
    };

    // ---- Initialization ----

    startBtn.addEventListener('click', async function () {
        try {
            startBtn.textContent = 'Cargando MediaPipe...';
            startBtn.disabled = true;

            await initApp();

            startupOverlay.classList.add('hidden');
            appEl.classList.remove('hidden');
            isRunning = true;
            gameLoop();
        } catch (err) {
            console.error('Error initializing:', err);
            startBtn.textContent = 'Error — Reintentar';
            startBtn.disabled = false;
            alert('Error al iniciar: ' + err.message + '\n\nAsegúrate de permitir el acceso a la cámara.');
        }
    });

    async function initApp() {
        // Audio engine (must init on user gesture)
        audioEngine = new AudioEngine();
        audioEngine.init();

        // Drum kit
        drumKit = new DrumKit(drumCanvas);

        // Hit detector
        hitDetector = new HitDetector();

        // Hand tracker
        handTracker = new HandTracker(webcamVideo, handCanvas, onHandResults);
        await handTracker.init();
        await handTracker.start();

        // Drum patterns engine
        drumPatternsEngine = new DrumPatterns(audioEngine, drumKit);
        drumPatternsEngine.onStepChange = onPatternStep;
        drumPatternsEngine.onComplete = onPatternComplete;
        drumPatternsEngine.onScore = onPatternScore;

        // Setup controls
        setupControls();

        // Mouse/touch fallback
        setupMouseFallback();
    }

    // ---- Hand Tracking Results ----

    function onHandResults(results) {
        if (!results.multiHandLandmarks) return;

        var numHands = results.multiHandLandmarks.length;

        // Reset hands that disappeared
        if (numHands === 0) {
            stickLeft.classList.add('hidden');
            stickRight.classList.add('hidden');
            handsVisible = [false, false];
            hitDetector.resetHand(0);
            hitDetector.resetHand(1);
            return;
        }

        // Classify hands as left/right based on handedness or position
        var handAssignments = classifyHands(results);

        for (var i = 0; i < handAssignments.length; i++) {
            var assignment = handAssignments[i];
            var handIdx = assignment.handIndex; // 0=left, 1=right
            var landmarks = assignment.landmarks;

            handsVisible[handIdx] = true;

            // Update hit detection
            var hit = hitDetector.update(handIdx, landmarks, drumKit);

            // Update drumstick cursor position
            var tip = hitDetector.getTipPosition(handIdx);
            if (tip) {
                var stickEl = handIdx === 0 ? stickLeft : stickRight;
                stickEl.classList.remove('hidden');
                stickEl.style.left = tip.x + 'px';
                stickEl.style.top = tip.y + 'px';

                // Show striking state
                if (hitDetector.isStriking(handIdx)) {
                    stickEl.classList.add('hitting');
                } else {
                    stickEl.classList.remove('hitting');
                }
            }

            // Process hit
            if (hit) {
                processHit(hit);
            }
        }

        // Hide sticks for hands that aren't visible
        if (!handsVisible[0]) {
            stickLeft.classList.add('hidden');
            hitDetector.resetHand(0);
        }
        if (!handsVisible[1]) {
            stickRight.classList.add('hidden');
            hitDetector.resetHand(1);
        }
    }

    /**
     * Classify detected hands as left (0) or right (1)
     * MediaPipe labels from the camera's perspective, so we mirror.
     */
    function classifyHands(results) {
        var assignments = [];
        var lm = results.multiHandLandmarks;
        var labels = results.multiHandedness;

        for (var i = 0; i < lm.length; i++) {
            var handIndex = 0; // default left

            if (labels && labels[i] && labels[i].label) {
                // MediaPipe reports from camera POV, mirror it
                handIndex = labels[i].label === 'Left' ? 1 : 0;
            } else if (lm.length === 2) {
                // Fallback: leftmost hand (in mirrored view) = left
                var x0 = (1 - lm[0][8].x);
                var x1 = (1 - lm[1][8].x);
                handIndex = (i === 0 && x0 < x1) || (i === 1 && x1 >= x0) ? 0 : 1;
            }

            assignments.push({
                handIndex: handIndex,
                landmarks: lm[i]
            });
        }

        return assignments;
    }

    // ---- Hit Processing ----

    function processHit(hit) {
        var startTime = performance.now();

        // Play sound
        audioEngine.play(hit.zone.id, hit.velocity);

        // Visual ripple
        drumKit.triggerHit(hit.zone, hit.velocity);

        // Register with pattern engine if active
        if (drumPatternsEngine && drumPatternsEngine.active) {
            drumPatternsEngine.registerHit(hit.zone.id);
        }

        // Update HUD
        lastHitName = drumLabels[hit.zone.id] || hit.zone.id;
        lastHitEl.textContent = drumEmojis[hit.zone.id] || '🥁';
        lastHitEl.classList.remove('pulse');
        // Force reflow
        void lastHitEl.offsetWidth;
        lastHitEl.classList.add('pulse');
        lastHitTime = Date.now();

        // Velocity bar
        var bar = hit.handIndex === 0 ? velocityBarLeft : velocityBarRight;
        bar.style.height = Math.round(hit.velocity * 100) + 'px';
        setTimeout(function () {
            bar.style.height = '0';
        }, 200);

        // Latency display
        var latency = performance.now() - startTime;
        latencyEl.textContent = 'Lat: ' + latency.toFixed(1) + 'ms';
    }

    // ---- Game Loop ----

    function gameLoop() {
        if (!isRunning) return;

        // FPS
        frameCount++;
        var now = Date.now();
        if (now - lastFpsTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
            fpsEl.textContent = 'FPS: ' + fps;
        }

        // Metronome
        if (metronomeActive) {
            var interval = 60000 / metronomeBPM;
            if (now - lastMetronomeTick >= interval) {
                metronomeBeat = (metronomeBeat + 1) % 4;
                audioEngine.click(null, metronomeBeat === 1);
                lastMetronomeTick = now;
            }
        }

        // Clear last hit display after 2s
        if (lastHitTime > 0 && now - lastHitTime > 2000) {
            lastHitEl.textContent = '🥁';
            lastHitTime = 0;
        }

        // Render drum kit
        drumKit.render();

        // Draw pattern highlights
        if (drumPatternsEngine && drumPatternsEngine.active) {
            drumPatternsEngine.drawHighlights(drumKit.ctx, drumKit.zones);
        }

        // Draw zone highlight under drumstick tips
        drawStickHighlights();

        requestAnimationFrame(gameLoop);
    }

    function drawStickHighlights() {
        var ctx = drumKit.ctx;

        for (var h = 0; h < 2; h++) {
            if (!handsVisible[h]) continue;
            var tip = hitDetector.getTipPosition(h);
            if (!tip) continue;

            var zone = drumKit.getZoneAt(tip.x, tip.y);
            if (zone) {
                // Subtle glow on the zone being hovered
                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
                ctx.fillStyle = h === 0 ? '#f77062' : '#3498db';
                ctx.shadowColor = h === 0 ? '#f77062' : '#3498db';
                ctx.shadowBlur = 20;
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // ---- Controls ----

    function setupControls() {
        btnToggleCamera.addEventListener('click', function () {
            cameraVisible = !cameraVisible;
            cameraOverlay.style.display = cameraVisible ? 'block' : 'none';
            btnToggleCamera.classList.toggle('active', cameraVisible);
        });

        btnToggleKit.addEventListener('click', function () {
            drumKit.toggleStyle();
            btnToggleKit.classList.toggle('active');
        });

        btnMetronome.addEventListener('click', function () {
            metronomeActive = !metronomeActive;
            btnMetronome.classList.toggle('active', metronomeActive);
            if (metronomeActive) {
                metronomeBeat = 0;
                lastMetronomeTick = Date.now();
            }
        });

        // Settings panel
        btnSettings.addEventListener('click', function () {
            sensitivityPanel.classList.toggle('hidden');
            btnSettings.classList.toggle('active');
        });

        btnClosePanel.addEventListener('click', function () {
            sensitivityPanel.classList.add('hidden');
            btnSettings.classList.remove('active');
        });

        // Sensitivity sliders
        var sensThreshold = document.getElementById('sens-threshold');
        var sensCooldown = document.getElementById('sens-cooldown');
        var sensVelmax = document.getElementById('sens-velmax');
        var sensFloor = document.getElementById('sens-floor');
        var sensSmooth = document.getElementById('sens-smooth');

        sensThreshold.addEventListener('input', function () {
            hitDetector.STRIKE_VELOCITY_THRESHOLD = parseFloat(this.value);
            document.getElementById('val-threshold').textContent = this.value;
        });
        sensCooldown.addEventListener('input', function () {
            hitDetector.COOLDOWN_MS = parseInt(this.value);
            document.getElementById('val-cooldown').textContent = this.value;
        });
        sensVelmax.addEventListener('input', function () {
            hitDetector.VELOCITY_MAP_MAX = parseFloat(this.value);
            document.getElementById('val-velmax').textContent = this.value;
        });
        sensFloor.addEventListener('input', function () {
            hitDetector.VELOCITY_FLOOR = parseFloat(this.value);
            document.getElementById('val-floor').textContent = this.value;
        });
        sensSmooth.addEventListener('input', function () {
            handTracker._smoothAlpha = parseFloat(this.value);
            document.getElementById('val-smooth').textContent = this.value;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'm':
                    metronomeActive = !metronomeActive;
                    btnMetronome.classList.toggle('active', metronomeActive);
                    break;
                case 'v':
                    cameraVisible = !cameraVisible;
                    cameraOverlay.style.display = cameraVisible ? 'block' : 'none';
                    break;
                case 's':
                    drumKit.toggleStyle();
                    break;
                case 'ArrowUp':
                    metronomeBPM = Math.min(240, metronomeBPM + 5);
                    break;
                case 'ArrowDown':
                    metronomeBPM = Math.max(40, metronomeBPM - 5);
                    break;
            }
        });

        // Setup pattern controls
        setupPatternControls();
    }

    // ---- Mouse/Touch Fallback ----
    // Click on drums to test without camera

    function setupMouseFallback() {
        var mouseDown = false;

        drumCanvas.addEventListener('mousedown', function (e) {
            mouseDown = true;
            triggerMouseHit(e.clientX, e.clientY);
        });

        drumCanvas.addEventListener('mousemove', function (e) {
            // Show hover effect even without hands
            if (!handsVisible[0] && !handsVisible[1]) {
                stickLeft.classList.remove('hidden');
                stickLeft.style.left = e.clientX + 'px';
                stickLeft.style.top = e.clientY + 'px';

                var zone = drumKit.getZoneAt(e.clientX, e.clientY);
                drumCanvas.style.cursor = zone ? 'pointer' : 'default';
            }
        });

        drumCanvas.addEventListener('mouseup', function () {
            mouseDown = false;
        });

        drumCanvas.addEventListener('mouseleave', function () {
            if (!handsVisible[0]) {
                stickLeft.classList.add('hidden');
            }
        });

        // Touch support
        drumCanvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            for (var i = 0; i < e.touches.length; i++) {
                triggerMouseHit(e.touches[i].clientX, e.touches[i].clientY);
            }
        }, { passive: false });
    }

    function triggerMouseHit(x, y) {
        var zone = drumKit.getZoneAt(x, y);
        if (zone) {
            var hit = {
                zone: zone,
                velocity: 0.7 + Math.random() * 0.2,
                handIndex: 0,
                x: x,
                y: y
            };
            processHit(hit);
        }
    }

    // ---- Pattern System Callbacks ----

    function onPatternStep(data) {
        if (data.loop) {
            // Loop restarted — update loop counter
            progressScore.textContent = '🔄 x' + data.loopCount;
            return;
        }
        if (data.countdown) {
            patternCountdown.classList.remove('hidden');
            countdownNumber.textContent = data.beat;
            // Re-trigger animation
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = '';
        } else {
            patternCountdown.classList.add('hidden');
            // Update progress bar
            var pct = ((data.step + 1) / data.total) * 100;
            progressBarFill.style.width = pct + '%';
        }
    }

    function onPatternComplete(results) {
        patternProgress.classList.add('hidden');
        patternCountdown.classList.add('hidden');
        patternScore.classList.add('hidden');

        // Loop patterns don't show results — they were manually stopped
        if (drumPatternsEngine && drumPatternsEngine.currentPattern && drumPatternsEngine.currentPattern.loop) {
            btnPatterns.classList.remove('active');
            return;
        }

        // Show results modal
        document.getElementById('results-pattern-name').textContent =
            drumPatternsEngine.currentPattern ? drumPatternsEngine.currentPattern.name : '';
        document.getElementById('res-accuracy').textContent = results.accuracy + '%';
        document.getElementById('res-score').textContent = results.score;
        document.getElementById('res-streak').textContent = results.bestStreak;
        document.getElementById('res-perfect').textContent = results.perfect;
        document.getElementById('res-good').textContent = results.good;
        document.getElementById('res-missed').textContent = results.missed;
        patternResults.classList.remove('hidden');
    }

    var scoreHideTimeout = null;
    function onPatternScore(data) {
        // Show score popup
        scoreResult.className = data.result;
        var labels = { perfect: '✨ PERFECTO', good: '👍 BIEN', late: '⏰ TARDE' };
        scoreResult.textContent = labels[data.result] || data.result;
        scoreStreak.textContent = data.streak > 1 ? '🔥 x' + data.streak : '';
        patternScore.classList.remove('hidden');

        // Update progress score
        progressScore.textContent = data.score;

        if (scoreHideTimeout) clearTimeout(scoreHideTimeout);
        scoreHideTimeout = setTimeout(function () {
            patternScore.classList.add('hidden');
        }, 500);
    }

    // ---- Patterns Panel ----

    function buildPatternsPanel() {
        var levels = DrumPatterns.getLevels();

        // Build level tabs
        patternsLevels.innerHTML = '';
        levels.forEach(function (level, idx) {
            var tab = document.createElement('button');
            tab.className = 'level-tab' + (idx === 0 ? ' active' : '');
            tab.textContent = level.emoji + ' ' + level.name;
            tab.dataset.level = level.id;
            tab.addEventListener('click', function () {
                patternsLevels.querySelectorAll('.level-tab').forEach(function (t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                showPatternsByLevel(level.id);
            });
            patternsLevels.appendChild(tab);
        });

        // Show first level
        showPatternsByLevel(levels[0].id);
    }

    function showPatternsByLevel(levelId) {
        var patterns = DrumPatterns.getPatternsByLevel(levelId);
        patternsList.innerHTML = '';

        patterns.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'pattern-card';
            card.innerHTML =
                '<span class="pattern-emoji">' + item.pattern.emoji + '</span>' +
                '<div class="pattern-info">' +
                '<div class="pattern-name">' + item.pattern.name + '</div>' +
                '<div class="pattern-desc">' + item.pattern.description + '</div>' +
                '</div>' +
                '<span class="pattern-bpm">' + item.pattern.bpm + ' BPM</span>';

            card.addEventListener('click', function () {
                startPattern(item.key);
            });
            patternsList.appendChild(card);
        });
    }

    function startPattern(key) {
        currentPatternKey = key;
        var pattern = DrumPatterns.PATTERNS[key];
        if (!pattern) return;

        // Close panels
        patternsPanel.classList.add('hidden');
        patternResults.classList.add('hidden');
        btnPatterns.classList.add('active');

        // Show progress bar
        progressName.textContent = pattern.emoji + ' ' + pattern.name;
        progressScore.textContent = pattern.loop ? '🔄 Ciclo' : '0';
        progressBarFill.style.width = '0%';
        patternProgress.classList.remove('hidden');

        // Start pattern
        drumPatternsEngine.start(key);
    }

    // ---- Pattern Controls Setup ----
    function setupPatternControls() {
        btnPatterns.addEventListener('click', function () {
            patternsPanel.classList.toggle('hidden');
            sensitivityPanel.classList.add('hidden');
            btnSettings.classList.remove('active');
            btnPatterns.classList.toggle('active');
            if (!patternsPanel.classList.contains('hidden')) {
                buildPatternsPanel();
            }
        });

        btnClosePatterns.addEventListener('click', function () {
            patternsPanel.classList.add('hidden');
            btnPatterns.classList.remove('active');
        });

        btnStopPattern.addEventListener('click', function () {
            if (drumPatternsEngine) drumPatternsEngine.stop();
            patternProgress.classList.add('hidden');
            patternCountdown.classList.add('hidden');
            patternScore.classList.add('hidden');
            btnPatterns.classList.remove('active');
        });

        btnRetryPattern.addEventListener('click', function () {
            patternResults.classList.add('hidden');
            if (currentPatternKey) startPattern(currentPatternKey);
        });

        btnBackPatterns.addEventListener('click', function () {
            patternResults.classList.add('hidden');
            patternsPanel.classList.remove('hidden');
            btnPatterns.classList.add('active');
            buildPatternsPanel();
        });
    }

})();
