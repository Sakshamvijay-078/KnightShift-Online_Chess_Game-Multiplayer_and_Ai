let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playMoveSound = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        // Ignore audio errors (e.g., autoplay blocked)
    }
};

export const playCaptureSound = () => {
    try {
        const ctx = getCtx();
        // Base low thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);

        // High frequency "snap/crack"
        const oscHigh = ctx.createOscillator();
        const gainHigh = ctx.createGain();
        oscHigh.connect(gainHigh);
        gainHigh.connect(ctx.destination);
        oscHigh.type = 'square';
        oscHigh.frequency.setValueAtTime(800, ctx.currentTime);
        oscHigh.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.05);
        gainHigh.gain.setValueAtTime(0.1, ctx.currentTime);
        gainHigh.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscHigh.start(ctx.currentTime);
        oscHigh.stop(ctx.currentTime + 0.05);
    } catch(e) {}
};

export const playGameOverSound = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
};
