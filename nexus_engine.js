// ========================================================
// 1. NÚCLEO ECS DE ULTRA RENDIMIENTO (Datos Orientados)
// ========================================================
class NexusCoordinator {
    constructor() {
        this.entities = [];
        this.transforms = new Map();
        this.physics = new Map();
        this.renders = new Map();
        this.nextId = 0;
    }

    createEntity() {
        let id = this.nextId++;
        this.entities.push(id);
        return id;
    }

    addComponent(entity, type, data) {
        if (type === 'transform') this.transforms.set(entity, data);
        if (type === 'physics') this.physics.set(entity, data);
        if (type === 'render') this.renders.set(entity, data);
    }
}

const engine = new NexusCoordinator();

// ========================================================
// 2. MÓDULO DE AUDIO SINTETIZADO (Carga y reproducción)
// ========================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCollisionSound(pitch = 150) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    
    osc.type = 'triangle'; // Sonido retro/industrial
    osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// ========================================================
// 3. CONFIGURACIÓN DEL VIEWPORT Y CONFIGURACIÓN GLOBAL
// ========================================================
const canvas = document.getElementById('renderCanvas');
const ctx = canvas.getContext('2d');

let worldGravity = 0.2;
let worldBounce = 0.7;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Geometría de un cubo 3D (Vértices de polígonos reales)
const cubeVertices = [
    {x: -1, y: -1, z: -1}, {x: 1, y: -1, z: -1}, {x: 1, y: 1, z: -1}, {x: -1, y: 1, z: -1},
    {x: -1, y: -1, z: 1},  {x: 1, y: -1, z: 1},  {x: 1, y: 1, z: 1},  {x: -1, y: 1, z: 1}
];
const cubeEdges = [
    [0,1], [1,2], [2,3], [3,0], // Cara trasera
    [4,5], [5,6], [6,7], [7,4], // Cara delantera
    [0,4], [1,5], [2,6], [3,7]  // Conexiones
];

// ========================================================
// 4. SISTEMAS DEL MOTOR (Físicas y Renderizado 3D)
// ========================================================
function physicsSystem() {
    for (let entity of engine.entities) {
        let trans = engine.transforms.get(entity);
        let phys = engine.physics.get(entity);

        if (trans && phys) {
            // Aplicar gravedad
            phys.vy += worldGravity;

            // Actualizar posiciones
            trans.x += phys.vx;
            trans.y += phys.vy;
            trans.z += phys.vz;

            // Rotación automática continua del objeto 3D
            trans.rx += 0.02;
            trans.ry += 0.03;

            // Colisión con el suelo virtual del espacio 3D (Y = 5)
            if (trans.y > 5) {
                trans.y = 5;
                phys.vy *= -worldBounce;
                
                // Si el impacto tiene fuerza, suena el módulo de audio
                if (Math.abs(phys.vy) > 0.5) {
                    playCollisionSound(120 + Math.random() * 60);
                }
            }
            
            // Límites en X para rebote lateral
            if (trans.x < -10 || trans.x > 10) phys.vx *= -1;
        }
    }
}

// Proyección matemática 3D a 2D (Persistencia cónica)
function project(vertex, trans) {
    // 1. Rotación en X
    let y1 = vertex.y * Math.cos(trans.rx) - vertex.z * Math.sin(trans.rx);
    let z1 = vertex.y * Math.sin(trans.rx) + vertex.z * Math.cos(trans.rx);
    
    // 2. Rotación en Y
    let x2 = vertex.x * Math.cos(trans.ry) + z1 * Math.sin(trans.ry);
    let z2 = -vertex.x * Math.sin(trans.ry) + z1 * Math.cos(trans.ry);

    // 3. Traslación del espacio del objeto al espacio del mundo
    let xWorld = x2 + trans.x;
    let yWorld = y1 + trans.y;
    let zWorld = z2 + trans.z;

    // 4. Proyección de perspectiva matemática hacia la cámara
    let fov = 400; 
    let scale = fov / (fov + zWorld);
    let xScreen = (xWorld * scale) + (canvas.width / 2);
    let yScreen = (yWorld * scale) + (canvas.height / 2);

    return { x: xScreen, y: yScreen };
}

function renderSystem() {
    // Limpiar pantalla con un degradado gris oscuro profesional
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar la rejilla del suelo (Grid 3D estilo Unreal)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    // Línea de suelo referencial
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2 + 100);
    ctx.lineTo(canvas.width, canvas.height / 2 + 100);
    ctx.stroke();

    // Dibujar cada polígono/entidad registrada
    for (let entity of engine.entities) {
        let trans = engine.transforms.get(entity);
        let render = engine.renders.get(entity);

        if (trans && render) {
            let projectedVertices = cubeVertices.map(v => project(v, trans));

            ctx.strokeStyle = render.color;
            ctx.lineWidth = 2;

            // Dibujar las aristas del cubo indexadas
            for (let edge of cubeEdges) {
                let p1 = projectedVertices[edge[0]];
                let p2 = projectedVertices[edge[1]];
                
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
}

// ========================================================
// 5. BUCLE DE TIEMPO REAL (60 FPS Controlados)
// ========================================================
function gameLoop() {
    physicsSystem();
    renderSystem();
    document.getElementById('entity-count').innerText = engine.entities.length;
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ========================================================
// 6. INTERFAZ DEL EDITOR (Captura de eventos de los botones)
// ========================================================
document.getElementById('spawn-cube').addEventListener('click', () => {
    let id = engine.createEntity();
    
    // Asignar datos iniciales (Caja de spawn aleatoria en el espacio 3D)
    engine.addComponent(id, 'transform', {
        x: (Math.random() * 10) - 5,
        y: -5,
        z: (Math.random() * 200) - 50,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI
    });

    engine.addComponent(id, 'physics', {
        vx: (Math.random() * 4) - 2,
        vy: 0,
        vz: 0
    });

    const colors = ['#00ffcc', '#ff0055', '#ffff00', '#00ff55', '#0077ff'];
    engine.addComponent(id, 'render', {
        color: colors[Math.floor(Math.random() * colors.length)]
    });
});

document.getElementById('play-sound').addEventListener('click', () => {
    playCollisionSound(300);
});

document.getElementById('gravity-slider').addEventListener('input', (e) => {
    let val = e.target.value;
    document.getElementById('gravity-label').innerText = `Gravedad del Mundo: -${val} m/s²`;
    worldGravity = val * 0.02; // Escala física interna
});

document.getElementById('bounce-slider').addEventListener('input', (e) => {
    let val = e.target.value;
    document.getElementById('bounce-label').innerText = `Restitución (Rebote): ${val / 100}`;
    worldBounce = val / 100;
});
