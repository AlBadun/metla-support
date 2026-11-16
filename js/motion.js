// Пульсар в шапке — числа Монитора (DESIGN_SYSTEM.md, 11.3): по времени, а не по кадрам: на экране 120 Гц он не бежит вдвое быстрее.
// На двух кольцах дуги вращаются встречно; знак в центре — файл, здесь он не рисуется. «Меньше движения» в телефоне — один неподвижный кадр.
const SIZE = 120;
const OUTER = SIZE / 2 - 5;
const INNER = OUTER * 102.5 / 120;
const AQUA = '0, 240, 200';
const VIOLET = '153, 102, 204';

export const PULSAR_SLOW_MS = 8000;
export const PULSAR_FAST_MS = 6000;

export const PULSAR_ARCS = [
    {radius: OUTER, color: AQUA, alpha: 0.7, width: 2.5, sweep: 90, starts: [30, 210], turn: 'slow'},
    {radius: OUTER, color: VIOLET, alpha: 0.55, width: 2.5, sweep: 60, starts: [120, 300], turn: 'fast'},
    {radius: INNER, color: AQUA, alpha: 0.45, width: 2, sweep: 90, starts: [30, 210], turn: 'fast'},
    {radius: INNER, color: VIOLET, alpha: 0.4, width: 1.8, sweep: 60, starts: [120, 300], turn: 'slow'},
];

// Поворот в градусах к этому времени: медленные — по часовой, быстрые — против.
export function pulsarAngles(ms) {
    return {slow: (ms / PULSAR_SLOW_MS * 360) % 360, fast: -(ms / PULSAR_FAST_MS * 360) % 360};
}

function drawPulsar(ctx, ms) {
    const angles = pulsarAngles(ms);
    const center = SIZE / 2;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.lineCap = 'round';
    for (const arc of PULSAR_ARCS) {
        ctx.strokeStyle = `rgba(${arc.color}, ${arc.alpha})`;
        ctx.lineWidth = arc.width;
        for (const start of arc.starts) {
            const from = start + angles[arc.turn];
            ctx.beginPath();
            ctx.arc(center, center, arc.radius, from * Math.PI / 180, (from + arc.sweep) * Math.PI / 180);
            ctx.stroke();
        }
    }
}

export function initPulsar() {
    const canvas = document.getElementById('pulsarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        drawPulsar(ctx, 0);
        return;
    }
    // Экран спрятан (открыта справка) — кадр не рисуем: бесконечная анимация платится батареей.
    function frame(now) {
        if (canvas.offsetParent !== null) drawPulsar(ctx, now);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
