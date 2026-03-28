import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// ============================================================
// State
// ============================================================
const state = {
  text: 'BOSS',
  fontName: 'helvetiker',
  shape: 'rectangle',
  width: 80,
  height: 60,
  thickness: 6,
  textDepth: 3,
  borderWidth: 4,
  bailDiameter: 10,
  bailThickness: 4,
  wireframe: false,
};

let scene, camera, renderer, controls;
let pendantGroup = null;
let chainMesh = null;
let loadedFonts = {};
let currentFont = null;

// ============================================================
// Init Scene
// ============================================================
function initScene() {
  const canvas = document.getElementById('viewport');
  const container = document.getElementById('viewport-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0d);

  // Camera
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
  camera.position.set(0, 0, 200);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 50;
  controls.maxDistance = 600;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(50, 80, 100);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-50, -20, -50);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xf0c040, 0.5);
  rimLight.position.set(0, -50, -80);
  scene.add(rimLight);

  // Grid helper (subtle)
  const grid = new THREE.GridHelper(400, 40, 0x222222, 0x181818);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -state.thickness;
  scene.add(grid);

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ============================================================
// Gold Material
// ============================================================
function createGoldMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xf0c040,
    metalness: 0.85,
    roughness: 0.15,
    wireframe: state.wireframe,
  });
}

function createTextMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.95,
    roughness: 0.08,
    wireframe: state.wireframe,
  });
}

// ============================================================
// Pendant Shape Generators
// ============================================================
function createPendantShape(w, h, shape, border) {
  const hw = w / 2;
  const hh = h / 2;
  const s = new THREE.Shape();

  switch (shape) {
    case 'rectangle':
      s.moveTo(-hw, -hh);
      s.lineTo(hw, -hh);
      s.lineTo(hw, hh);
      s.lineTo(-hw, hh);
      s.closePath();
      break;

    case 'rounded': {
      const r = Math.min(hw, hh) * 0.25;
      s.moveTo(-hw + r, -hh);
      s.lineTo(hw - r, -hh);
      s.quadraticCurveTo(hw, -hh, hw, -hh + r);
      s.lineTo(hw, hh - r);
      s.quadraticCurveTo(hw, hh, hw - r, hh);
      s.lineTo(-hw + r, hh);
      s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r);
      s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      break;
    }

    case 'circle': {
      const radius = Math.max(hw, hh);
      s.absarc(0, 0, radius, 0, Math.PI * 2, false);
      break;
    }

    case 'diamond':
      s.moveTo(0, -hh);
      s.lineTo(hw, 0);
      s.lineTo(0, hh);
      s.lineTo(-hw, 0);
      s.closePath();
      break;
  }

  return s;
}

// ============================================================
// Build Pendant
// ============================================================
function buildPendant() {
  if (!currentFont) return;

  // Remove old pendant
  if (pendantGroup) {
    scene.remove(pendantGroup);
    pendantGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  pendantGroup = new THREE.Group();

  const { width, height, thickness, textDepth, borderWidth, shape, text, bailDiameter, bailThickness } = state;

  // --- Base plate ---
  const plateShape = createPendantShape(width, height, shape, borderWidth);
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 0.8,
    bevelSegments: 3,
  });
  plateGeo.center();
  const plateMesh = new THREE.Mesh(plateGeo, createGoldMaterial());
  pendantGroup.add(plateMesh);

  // --- Border (raised rim) ---
  if (borderWidth > 0) {
    const outerShape = createPendantShape(width, height, shape, 0);
    const innerW = width - borderWidth * 2;
    const innerH = height - borderWidth * 2;
    if (innerW > 0 && innerH > 0) {
      const hole = createPendantShape(innerW, innerH, shape, 0);
      outerShape.holes.push(hole);
      const borderGeo = new THREE.ExtrudeGeometry(outerShape, {
        depth: thickness + 2,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.3,
        bevelSegments: 2,
      });
      borderGeo.center();
      const borderMesh = new THREE.Mesh(borderGeo, createGoldMaterial());
      pendantGroup.add(borderMesh);
    }
  }

  // --- Text ---
  if (text.length > 0) {
    const textGeo = new TextGeometry(text, {
      font: currentFont,
      size: Math.min((width - borderWidth * 2) / (text.length * 0.7), height * 0.35),
      depth: textDepth,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.3,
      bevelSegments: 3,
    });
    textGeo.computeBoundingBox();
    const bb = textGeo.boundingBox;
    const textW = bb.max.x - bb.min.x;
    const textH = bb.max.y - bb.min.y;
    textGeo.translate(-textW / 2, -textH / 2, thickness / 2);

    const textMesh = new THREE.Mesh(textGeo, createTextMaterial());
    pendantGroup.add(textMesh);
  }

  // --- Bail (chain loop) ---
  const bailR = bailDiameter / 2;
  const bailTubeR = bailThickness / 2;
  const bailGeo = new THREE.TorusGeometry(bailR, bailTubeR, 16, 32);
  const bailMesh = new THREE.Mesh(bailGeo, createGoldMaterial());
  bailMesh.position.set(0, height / 2 + bailR, 0);
  pendantGroup.add(bailMesh);

  scene.add(pendantGroup);
}

// ============================================================
// Font Loading
// ============================================================
const FONT_BASE = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/fonts/';
const FONT_MAP = {
  helvetiker: 'helvetiker_bold.typeface.json',
  optimer: 'optimer_bold.typeface.json',
  gentilis: 'gentilis_bold.typeface.json',
};

async function loadFont(name) {
  if (loadedFonts[name]) {
    currentFont = loadedFonts[name];
    buildPendant();
    return;
  }

  const loader = new FontLoader();
  const url = FONT_BASE + FONT_MAP[name];

  loader.load(url, (font) => {
    loadedFonts[name] = font;
    currentFont = font;
    buildPendant();
  });
}

// ============================================================
// STL Chain Loader
// ============================================================
function loadChainSTL(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (chainMesh) {
      scene.remove(chainMesh);
      chainMesh.geometry.dispose();
      chainMesh.material.dispose();
    }

    const loader = new STLLoader();
    const geometry = loader.parse(e.target.result);
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox;
    const size = new THREE.Vector3();
    bb.getSize(size);

    // Scale chain to a reasonable size relative to viewport
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 200;
    const scale = targetSize / maxDim;
    geometry.scale(scale, scale, scale);

    // Center it
    geometry.computeBoundingBox();
    geometry.center();

    chainMesh = new THREE.Mesh(geometry, createGoldMaterial());
    chainMesh.position.y = state.height / 2 + state.bailDiameter + 20;
    scene.add(chainMesh);
  };
  reader.readAsArrayBuffer(file);
}

// ============================================================
// STL Export
// ============================================================
function exportSTL() {
  if (!pendantGroup) return;

  const exporter = new STLExporter();
  const result = exporter.parse(pendantGroup, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pendant_${state.text || 'custom'}.stl`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// UI Bindings
// ============================================================
function bindUI() {
  // Text input
  const textInput = document.getElementById('pendant-text');
  textInput.addEventListener('input', (e) => {
    state.text = e.target.value.toUpperCase();
    buildPendant();
  });

  // Font select
  document.getElementById('font-select').addEventListener('change', (e) => {
    state.fontName = e.target.value;
    loadFont(state.fontName);
  });

  // Shape buttons
  document.querySelectorAll('.shape-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shape-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.shape = btn.dataset.shape;
      buildPendant();
    });
  });

  // Sliders
  const sliders = [
    { id: 'pendant-width', key: 'width', display: 'width-val' },
    { id: 'pendant-height', key: 'height', display: 'height-val' },
    { id: 'pendant-thickness', key: 'thickness', display: 'thickness-val' },
    { id: 'text-depth', key: 'textDepth', display: 'textdepth-val' },
    { id: 'border-width', key: 'borderWidth', display: 'border-val' },
    { id: 'bail-diameter', key: 'bailDiameter', display: 'bail-val' },
    { id: 'bail-thickness', key: 'bailThickness', display: 'bailthick-val' },
  ];

  sliders.forEach(({ id, key, display }) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      state[key] = parseFloat(el.value);
      document.getElementById(display).textContent = el.value;
      buildPendant();
    });
  });

  // Chain upload
  const chainBtn = document.getElementById('chain-upload-btn');
  const chainInput = document.getElementById('chain-file');
  const chainZone = document.getElementById('chain-upload-zone');

  chainBtn.addEventListener('click', () => chainInput.click());
  chainInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      loadChainSTL(e.target.files[0]);
      document.getElementById('chain-filename').textContent = e.target.files[0].name;
    }
  });

  // Drag and drop
  chainZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    chainZone.classList.add('dragover');
  });
  chainZone.addEventListener('dragleave', () => chainZone.classList.remove('dragover'));
  chainZone.addEventListener('drop', (e) => {
    e.preventDefault();
    chainZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.stl')) {
      loadChainSTL(file);
      document.getElementById('chain-filename').textContent = file.name;
    }
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', exportSTL);

  // Viewport controls
  document.getElementById('reset-camera').addEventListener('click', () => {
    camera.position.set(0, 0, 200);
    controls.target.set(0, 0, 0);
    controls.update();
  });

  document.getElementById('toggle-wireframe').addEventListener('click', () => {
    state.wireframe = !state.wireframe;
    buildPendant();
  });
}

// ============================================================
// Boot
// ============================================================
initScene();
bindUI();
loadFont(state.fontName);
