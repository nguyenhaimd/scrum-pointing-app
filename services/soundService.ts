
// A simple Web Audio API synthesizer to avoid external dependencies and loading times.

let audioCtx: AudioContext | null = null;
let isMuted = false;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) => {
    if (isMuted) return;
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
};

export const setMuted = (muted: boolean) => {
    isMuted = muted;
};

export const playSound = {
    vote: () => {
        playTone(600, 'sine', 0.1, 0, 0.05);
    },
    
    reveal: () => {
        playTone(523.25, 'triangle', 0.3, 0, 0.1); // C5
        playTone(659.25, 'triangle', 0.3, 0.1, 0.1); // E5
        playTone(783.99, 'triangle', 0.6, 0.2, 0.1); // G5
        // Haptic feedback
        if (!isMuted && navigator.vibrate) navigator.vibrate(200);
    },

    timerTick: () => {
        playTone(800, 'square', 0.03, 0, 0.02);
    },

    timerEnd: () => {
        playTone(440, 'sawtooth', 0.5, 0, 0.2);
        playTone(350, 'sawtooth', 0.5, 0.3, 0.2);
    },

    reaction: () => {
        if (isMuted) return;
        // Bubbly sound
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    },

    join: () => {
        playTone(400, 'sine', 0.2, 0, 0.1);
        playTone(600, 'sine', 0.2, 0.1, 0.1);
    }
};
