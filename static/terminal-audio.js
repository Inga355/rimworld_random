// Original procedural sounds. The same graph supports live playback and offline previews.
export function createSoundGraph(context) {
    const master = context.createGain();
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 10;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    master.connect(compressor).connect(context.destination);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const activeEffects = new Set();

    function envelope(gain, when, duration, level, attack = 0.004, hold = 0) {
        gain.setValueAtTime(0, when);
        gain.linearRampToValueAtTime(level, when + attack);
        if (hold > attack) gain.setValueAtTime(level, when + hold);
        gain.exponentialRampToValueAtTime(0.0001, when + duration - 0.01);
        gain.linearRampToValueAtTime(0, when + duration);
    }

    function track(source, nodes, when, duration) {
        activeEffects.add(source);
        source.onended = () => {
            activeEffects.delete(source);
            source.disconnect();
            nodes.forEach(node => node.disconnect());
        };
        source.start(when);
        source.stop(when + duration);
    }

    function tone({ when, frequency, endFrequency = frequency, duration, level, type = 'sine', attack = 0.004, hold = 0 }) {
        const source = context.createOscillator();
        source.type = type;
        source.frequency.setValueAtTime(frequency, when);
        source.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
        const gain = context.createGain();
        envelope(gain.gain, when, duration, level, attack, hold);
        source.connect(gain).connect(master);
        track(source, [gain], when, duration);
    }

    function noise({ when, duration, level, frequency, type = 'bandpass', attack = 0.003, hold = 0 }) {
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = 0.8;
        const gain = context.createGain();
        envelope(gain.gain, when, duration, level, attack, hold);
        source.connect(filter).connect(gain).connect(master);
        track(source, [filter, gain], when, duration);
    }

    // A transformer hum with gentle load variation and filtered ventilation noise.
    const ambience = context.createGain();
    ambience.gain.value = 0.8;
    ambience.connect(master);
    for (const [frequency, level] of [[50, 0.065], [100.2, 0.027], [149.8, 0.013]]) {
        const oscillator = context.createOscillator();
        oscillator.frequency.value = frequency;
        const gain = context.createGain();
        gain.gain.value = level;
        oscillator.connect(gain).connect(ambience);
        oscillator.start();
        if (frequency === 50) {
            const modulation = context.createOscillator();
            modulation.frequency.value = 0.17;
            const depth = context.createGain();
            depth.gain.value = 0.004;
            modulation.connect(depth).connect(gain.gain);
            modulation.start();
        }
    }
    const ventilation = context.createBufferSource();
    ventilation.buffer = noiseBuffer;
    ventilation.loop = true;
    const airFilter = context.createBiquadFilter();
    airFilter.type = 'lowpass';
    airFilter.frequency.value = 650;
    const airGain = context.createGain();
    airGain.gain.value = 0.018;
    ventilation.connect(airFilter).connect(airGain).connect(ambience);
    ventilation.start();

    function play(kind, when = context.currentTime) {
        if (kind === 'boot') {
            // Relay contacts, transformer spin-up, pressure release, then ready.
            noise({ when, duration: 0.08, level: 0.20, frequency: 1800 });
            noise({ when: when + 0.16, duration: 0.06, level: 0.14, frequency: 2400 });
            tone({ when: when + 0.12, frequency: 85, endFrequency: 230, duration: 1.85, level: 0.09, type: 'triangle', attack: 0.30, hold: 0.75 });
            tone({ when: when + 0.25, frequency: 380, endFrequency: 1250, duration: 1.60, level: 0.028, attack: 0.35, hold: 0.65 });
            noise({ when: when + 0.35, duration: 1.55, level: 0.07, frequency: 900, attack: 0.40, hold: 0.65 });
            noise({ when: when + 1.65, duration: 0.40, level: 0.035, frequency: 2600, attack: 0.04 });
            tone({ when: when + 2.05, frequency: 660, duration: 0.12, level: 0.035 });
            tone({ when: when + 2.22, frequency: 880, duration: 0.15, level: 0.03 });
        }
        if (kind === 'click' || kind === 'lever') {
            noise({ when, duration: 0.055, level: 0.22, frequency: 1700 + Math.random() * 650 });
            tone({ when, frequency: 230, endFrequency: 95, duration: 0.10, level: 0.12 });
            noise({ when: when + 0.045, duration: 0.035, level: 0.10, frequency: 3100 });
        }
        if (kind === 'lever') {
            noise({ when: when + 0.04, duration: 0.24, level: 0.15, frequency: 750, attack: 0.02 });
            tone({ when: when + 0.16, frequency: 115, endFrequency: 42, duration: 0.26, level: 0.25, type: 'triangle' });
            noise({ when: when + 0.16, duration: 0.08, level: 0.21, frequency: 2300 });
        }
        if (kind === 'hiss') {
            noise({ when, duration: 0.9, level: 0.075, frequency: 1900, type: 'highpass', attack: 0.07, hold: 0.23 });
            tone({ when, frequency: 330, endFrequency: 155, duration: 0.12, level: 0.025 });
        }
        if (kind === 'lamp') {
            for (const [offset, duration] of [[0, 0.14], [0.23, 0.30], [0.62, 0.35]]) {
                tone({ when: when + offset, frequency: 100, endFrequency: 96, duration, level: 0.045, type: 'sawtooth' });
                noise({ when: when + offset, duration, level: 0.045, frequency: 2600 });
            }
            tone({ when, frequency: 1900, endFrequency: 1100, duration: 0.06, level: 0.02 });
        }
        if (kind === 'crt') {
            noise({ when, duration: 0.15, level: 0.10, frequency: 2800, type: 'highpass' });
            noise({ when: when + 0.10, duration: 0.46, level: 0.07, frequency: 950, attack: 0.025 });
            tone({ when, frequency: 6400, endFrequency: 3800, duration: 0.11, level: 0.006 });
            tone({ when: when + 0.08, frequency: 120, endFrequency: 65, duration: 0.25, level: 0.045 });
        }
    }

    return {
        master,
        play,
        stopEffects() {
            for (const source of activeEffects) source.stop();
            activeEffects.clear();
        },
    };
}

export class TerminalAudio {
    constructor() {
        this.context = null;
        this.graph = null;
        this.volume = 0.3;
        this.enabled = false;
        this.suspendTimer = null;
    }

    async enable(fadeIn = false) {
        window.clearTimeout(this.suspendTimer);
        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) throw new Error('Web Audio is unavailable');
            this.context = new AudioContext();
            this.graph = createSoundGraph(this.context);
        }
        this.enabled = true;
        await this.context.resume();
        if (this.context.state !== 'running') throw new Error('Audio is suspended');
        if (this.enabled) {
            this.setVolume(this.volume);
            if (fadeIn) {
                const gain = this.graph.master.gain;
                gain.cancelScheduledValues(this.context.currentTime);
                gain.setValueAtTime(0, this.context.currentTime);
                gain.setTargetAtTime(this.volume, this.context.currentTime, 0.60);
            }
        }
    }

    setVolume(value) {
        this.volume = Math.min(1, Math.max(0, value));
        if (!this.graph) return;
        const gain = this.graph.master.gain;
        gain.cancelScheduledValues(this.context.currentTime);
        gain.setTargetAtTime(this.enabled ? this.volume : 0, this.context.currentTime, 0.04);
    }

    play(kind) {
        if (this.enabled && this.context?.state === 'running') this.graph.play(kind);
    }

    pause() {
        window.clearTimeout(this.suspendTimer);
        if (!this.context) return;
        this.graph.stopEffects();
        this.graph.master.gain.cancelScheduledValues(this.context.currentTime);
        this.graph.master.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
        this.suspendTimer = window.setTimeout(() => {
            this.context.suspend().catch(() => {});
        }, 140);
    }

    disable() {
        this.enabled = false;
        this.pause();
    }
}
