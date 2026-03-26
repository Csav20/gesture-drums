/* ============================================
   Audio Engine — Web Audio API Drum Synthesizer
   Generates realistic drum sounds without samples.
   ============================================ */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master compressor for punch
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 6;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.15;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Play a drum sound
     * @param {string} drum - Drum name (kick, snare, hihat_closed, hihat_open, tom_high, tom_mid, tom_low, crash, ride, ride_bell, rim)
     * @param {number} velocity - 0.0 to 1.0
     */
    play(drum, velocity) {
        if (!this.initialized) this.init();
        this.resume();
        var vel = Math.max(0.1, Math.min(1.0, velocity));
        var t = this.ctx.currentTime;

        switch (drum) {
            case 'kick':       this._kick(t, vel); break;
            case 'snare':      this._snare(t, vel); break;
            case 'hihat_closed': this._hihatClosed(t, vel); break;
            case 'hihat_open': this._hihatOpen(t, vel); break;
            case 'tom_high':   this._tom(t, vel, 300); break;
            case 'tom_mid':    this._tom(t, vel, 220); break;
            case 'tom_low':    this._tom(t, vel, 150); break;
            case 'crash':      this._crash(t, vel); break;
            case 'ride':       this._ride(t, vel); break;
            case 'ride_bell':  this._rideBell(t, vel); break;
            case 'rim':        this._rim(t, vel); break;
        }
    }

    _output() {
        return this.compressor;
    }

    // ---- KICK DRUM ----
    _kick(t, vel) {
        var ctx = this.ctx;
        var out = this._output();

        // Body oscillator
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160 * vel, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(vel * 0.9, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(oscGain);
        oscGain.connect(out);
        osc.start(t);
        osc.stop(t + 0.4);

        // Click transient
        var click = ctx.createOscillator();
        click.type = 'triangle';
        click.frequency.setValueAtTime(800, t);
        click.frequency.exponentialRampToValueAtTime(100, t + 0.02);

        var clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(vel * 0.6, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        click.connect(clickGain);
        clickGain.connect(out);
        click.start(t);
        click.stop(t + 0.05);
    }

    // ---- SNARE ----
    _snare(t, vel) {
        var ctx = this.ctx;
        var out = this._output();

        // Body
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(vel * 0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(oscGain);
        oscGain.connect(out);
        osc.start(t);
        osc.stop(t + 0.2);

        // Snare wires (noise)
        this._noise(t, vel * 0.65, 0.18, 3000, 10000, out);
    }

    // ---- HI-HAT CLOSED ----
    _hihatClosed(t, vel) {
        this._noise(t, vel * 0.4, 0.06, 6000, 14000, this._output());
        this._metallic(t, vel * 0.2, 0.04, 8000, this._output());
    }

    // ---- HI-HAT OPEN ----
    _hihatOpen(t, vel) {
        this._noise(t, vel * 0.45, 0.35, 5000, 13000, this._output());
        this._metallic(t, vel * 0.25, 0.25, 7500, this._output());
    }

    // ---- TOMS ----
    _tom(t, vel, baseFreq) {
        var ctx = this.ctx;
        var out = this._output();

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * (0.9 + vel * 0.2), t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + 0.2);

        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(vel * 0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(oscGain);
        oscGain.connect(out);
        osc.start(t);
        osc.stop(t + 0.4);

        // Attack transient
        this._noise(t, vel * 0.2, 0.03, 1000, 4000, out);
    }

    // ---- CRASH CYMBAL ----
    _crash(t, vel) {
        var out = this._output();
        this._noise(t, vel * 0.5, 0.9, 4000, 14000, out);
        this._metallic(t, vel * 0.35, 0.7, 6000, out);
        this._metallic(t, vel * 0.2, 0.6, 9000, out);
    }

    // ---- RIDE CYMBAL ----
    _ride(t, vel) {
        var out = this._output();
        this._noise(t, vel * 0.3, 0.4, 5000, 12000, out);
        this._metallic(t, vel * 0.25, 0.35, 7000, out);
    }

    // ---- RIDE BELL ----
    _rideBell(t, vel) {
        var ctx = this.ctx;
        var out = this._output();

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 3500;

        var osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 5200;

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.5);
        osc2.stop(t + 0.5);

        this._metallic(t, vel * 0.15, 0.3, 8000, out);
    }

    // ---- RIM SHOT ----
    _rim(t, vel) {
        var ctx = this.ctx;
        var out = this._output();

        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.01);

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    // ---- Utility: Filtered Noise ----
    _noise(t, vol, duration, lowFreq, highFreq, dest) {
        var ctx = this.ctx;
        var bufferSize = Math.ceil(ctx.sampleRate * duration);
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        var noise = ctx.createBufferSource();
        noise.buffer = buffer;

        var bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = (lowFreq + highFreq) / 2;
        bandpass.Q.value = 0.8;

        var highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = lowFreq;

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + duration + 0.01);
    }

    // ---- Utility: Metallic Shimmer ----
    _metallic(t, vol, duration, freq, dest) {
        var ctx = this.ctx;

        var ratios = [1, 1.47, 1.89, 2.35, 2.87];
        for (var i = 0; i < ratios.length; i++) {
            var osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq * ratios[i] * (0.97 + Math.random() * 0.06);

            var gain = ctx.createGain();
            var v = vol / ratios.length * (1 - i * 0.15);
            gain.gain.setValueAtTime(Math.max(v, 0.001), t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + duration + 0.01);
        }
    }

    // ---- Metronome Click ----
    click(t, accent) {
        if (!this.initialized) return;
        var ctx = this.ctx;
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = accent ? 1200 : 900;

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(accent ? 0.3 : 0.15, t || ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, (t || ctx.currentTime) + 0.04);

        osc.connect(gain);
        gain.connect(this._output());
        osc.start(t || ctx.currentTime);
        osc.stop((t || ctx.currentTime) + 0.05);
    }
}

window.AudioEngine = AudioEngine;
