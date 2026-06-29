// sound.js - Web Audio API Synthesizer with Volume and Ambient Drone Hum

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.5; // Default master volume
    this.masterGain = null;
    
    // Ambient sound variables
    this.ambienceEnabled = false;
    this.ambienceGain = null;
    this.ambienceOscs = [];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      // Ambience Gain Node
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // Soft background drone
      this.ambienceGain.connect(this.masterGain);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.init();
    if (!this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.init();
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    return this.muted;
  }

  setAmbienceEnabled(enabled) {
    this.ambienceEnabled = enabled;
    if (enabled) {
      this.startAmbience();
    } else {
      this.stopAmbience();
    }
  }

  startAmbience() {
    this.init();
    this.stopAmbience(); // Ensure none are running
    
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, this.ctx.currentTime); // Low mystical drone
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(120, this.ctx.currentTime); // Perfect fifth harmony
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.ctx.currentTime);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambienceGain);
      
      osc1.start();
      osc2.start();
      
      this.ambienceOscs = [osc1, osc2];
    } catch(e) {
      console.warn("Could not start ambient synthesizer", e);
    }
  }

  stopAmbience() {
    this.ambienceOscs.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.ambienceOscs = [];
  }

  playClick() {
    if (this.muted) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHeartBreak() {
    if (this.muted) return;
    this.init();

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  playPowerUp() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.setValueAtTime(659.25, t + 0.1); // E5
    osc1.frequency.setValueAtTime(783.99, t + 0.2); // G5
    osc1.frequency.setValueAtTime(1046.50, t + 0.3); // C6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, t);
    osc2.frequency.linearRampToValueAtTime(2093.00, t + 0.4);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  playWrongGuess(isHigher) {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    if (isHigher) {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(450, t + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(180, t + 0.3);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(t + 0.3);
  }

  playWinFanfare() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + (idx * 0.08));
      
      gain.gain.setValueAtTime(0.12, t + (idx * 0.08));
      gain.gain.linearRampToValueAtTime(0.01, t + (idx * 0.08) + 0.4);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(t + (idx * 0.08));
      osc.stop(t + (idx * 0.08) + 0.4);
    });

    // Final win chord
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.65);
      gain.gain.setValueAtTime(0.08, t + 0.65);
      gain.gain.linearRampToValueAtTime(0.001, t + 1.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + 0.65);
      osc.stop(t + 1.8);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [220.00, 207.65, 196.00, 146.83];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + (idx * 0.25));
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t + (idx * 0.25));

      gain.gain.setValueAtTime(0.08, t + (idx * 0.25));
      gain.gain.linearRampToValueAtTime(0.01, t + (idx * 0.25) + 0.35);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(t + (idx * 0.25));
      osc.stop(t + (idx * 0.25) + 0.35);
    });
  }

  playBuzzer() {
    if (this.muted) return;
    this.init();
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);
    
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.25);
  }

  playTick() {
    if (this.muted) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playWelcomeSweep() {
    if (this.muted) return;
    this.init();
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
    
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.3);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.8);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.8);
  }
}

const sound = new SoundManager();
export default sound;
