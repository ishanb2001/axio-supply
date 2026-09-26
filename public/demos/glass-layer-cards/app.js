import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const BACKGROUNDS = {
  motion: "/images/card-bg-motion.jpg?v=silk",
  components: "/images/card-bg-components.jpg?v=wave",
  systems: "/images/card-bg-systems.jpg?v=silk",
};

const FALLBACK = {
  motion: "#ff6a3d",
  components: "#2a1a6e",
  systems: "#ff7a1a",
};

const CAMERA_Z = 5;

function extrudeShape(shape, depth = 0.42) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.14,
    curveSegments: 14,
  });
  geometry.center();
  return geometry;
}

function createStarGeometry() {
  const shape = new THREE.Shape();
  const points = 5;
  const outerRadius = 1.3;
  const innerRadius = 0.55;
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return extrudeShape(shape, 0.48);
}

function createGearGeometry() {
  const shape = new THREE.Shape();
  const teeth = 10;
  const outerR = 1.28;
  const rootR = 0.92;
  const tipWidth = 0.28;
  const rootWidth = 0.55;
  for (let i = 0; i < teeth; i += 1) {
    const base = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const step = (Math.PI * 2) / teeth;
    const angles = [
      base - (step * rootWidth) / 2,
      base - (step * tipWidth) / 2,
      base + (step * tipWidth) / 2,
      base + (step * rootWidth) / 2,
    ];
    const radii = [rootR, outerR, outerR, rootR];
    angles.forEach((angle, index) => {
      const x = Math.cos(angle) * radii[index];
      const y = Math.sin(angle) * radii[index];
      if (i === 0 && index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.34, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return extrudeShape(shape, 0.4);
}

function createRoundedRectGeometry(w, h, r = 0.18, depth = 0.28) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return extrudeShape(shape, depth);
}

function glassMaterial(overrides = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 1,
    thickness: 1.8,
    ior: 1.5,
    dispersion: 8,
    envMapIntensity: 2.1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    specularColor: 0xffffff,
    attenuationColor: 0xffffff,
    attenuationDistance: 2.5,
    toneMapped: false,
    ...overrides,
  });
}

function createComponentsCluster() {
  const group = new THREE.Group();
  const size = 0.92;
  const gap = 0.28;
  const offset = size / 2 + gap / 2;
  const geometry = createRoundedRectGeometry(size, size, 0.28, 0.36);
  [
    [-offset, offset, 0],
    [offset, offset, 0],
    [-offset, -offset, 0],
    [offset, -offset, 0],
  ].forEach(([x, y, z], index) => {
    const mesh = new THREE.Mesh(geometry.clone(), glassMaterial({ thickness: 1.35, dispersion: 6 }));
    mesh.position.set(x, y, z);
    mesh.userData = { baseX: x, baseY: y, baseZ: z, phase: index * 0.7 };
    group.add(mesh);
  });
  group.rotation.z = Math.PI / 4;
  return group;
}

function buildIcon(kind) {
  const group = new THREE.Group();
  if (kind === "components") {
    group.add(createComponentsCluster());
    return group;
  }
  if (kind === "systems") {
    const gear = new THREE.Mesh(createGearGeometry(), glassMaterial());
    gear.rotation.set(-0.16, 0.28, 0.08);
    group.add(gear);
    return group;
  }
  const star = new THREE.Mesh(createStarGeometry(), glassMaterial());
  star.rotation.set(-0.12, 0.22, 0.05);
  group.add(star);
  return group;
}

function drawBackdrop(kind, width, height, dpr, photo) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * dpr));
  canvas.height = Math.max(2, Math.round(height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = FALLBACK[kind];
  ctx.fillRect(0, 0, width, height);
  if (photo && photo.complete && photo.naturalWidth > 0) {
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const drawW = photo.naturalWidth * scale;
    const drawH = photo.naturalHeight * scale;
    ctx.drawImage(photo, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  }
  return canvas;
}

function mountCard(canvas) {
  const kind = canvas.dataset.kind;
  try {
  mountCardInner(canvas, kind);
  } catch (error) {
    canvas.dataset.error = error && error.message ? error.message : String(error);
    console.error(error);
  }
}

function mountCardInner(canvas, kind) {
  const card = canvas.closest(".card");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phaseSeed = kind === "components" ? 0.8 : kind === "systems" ? 1.6 : 0;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(new THREE.Color(FALLBACK[kind]), 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FALLBACK[kind]);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(2.4, 3.2, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb8d4ff, 0.65);
  rim.position.set(-3, -1.5, 2);
  scene.add(rim);

  let backdropMap = null;
  let photo = null;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ toneMapped: false })
  );
  scene.add(backdrop);

  const icon = buildIcon(kind);
  icon.position.z = 1.35;
  scene.add(icon);

  const pointer = { x: 0, y: 0 };
  const pointerSmooth = { x: 0, y: 0 };
  let hovered = false;

  card.addEventListener("pointerenter", () => {
    hovered = true;
  });
  card.addEventListener("pointerleave", () => {
    hovered = false;
  });
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  });

  const paintBackdrop = (width, height) => {
    const dpr = renderer.getPixelRatio();
    const source = drawBackdrop(kind, width, height, dpr, photo);
    backdropMap?.dispose();
    backdropMap = new THREE.CanvasTexture(source);
    backdropMap.colorSpace = THREE.SRGBColorSpace;
    backdrop.material.map = backdropMap;
    backdrop.material.needsUpdate = true;
  };

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth || 200);
    const height = Math.max(1, canvas.clientHeight || 200);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const visibleHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visibleWidth = visibleHeight * camera.aspect;
    backdrop.scale.set(visibleWidth * 1.04, visibleHeight * 1.04, 1);
    const fitRatio = kind === "motion" ? 0.44 : kind === "components" ? 0.36 : 0.35;
    icon.scale.setScalar((Math.min(visibleWidth, visibleHeight) * fitRatio) / 2.55);
    icon.position.set(0, visibleHeight * 0.02, 1.35);
    paintBackdrop(width, height);
  };

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    photo = image;
    resize();
  };
  image.src = BACKGROUNDS[kind];
  resize();
  new ResizeObserver(resize).observe(canvas);

  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime() + phaseSeed;
    const ease = hovered ? 0.14 : 0.07;
    pointerSmooth.x += ((hovered ? pointer.x : 0) - pointerSmooth.x) * ease;
    pointerSmooth.y += ((hovered ? pointer.y : 0) - pointerSmooth.y) * ease;
    const px = pointerSmooth.x;
    const py = pointerSmooth.y;
    const floatX = reduced ? 0 : Math.sin(time * 0.55) * 0.06;
    const floatY = reduced ? 0 : Math.cos(time * 0.42) * 0.05;
    const floatZ = reduced ? 0 : Math.sin(time * 0.33) * 0.04;

    if (kind === "components") {
      const cluster = icon.children[0];
      cluster.rotation.x = -0.14 + floatY + py * 0.16;
      cluster.rotation.y = 0.22 + floatX + px * 0.18;
      cluster.rotation.z = Math.PI / 4 + floatZ + px * 0.06;
      cluster.children.forEach((mesh) => {
        const { baseX, baseY, baseZ, phase } = mesh.userData;
        const pulse = 1 + Math.sin(time * 0.9 + phase) * 0.025;
        mesh.position.set(baseX * pulse, baseY * pulse, baseZ);
      });
    } else if (kind === "systems") {
      const gear = icon.children[0];
      gear.rotation.x = -0.16 + floatY + py * 0.16;
      gear.rotation.y = 0.28 + floatX + px * 0.18;
      gear.rotation.z = 0.08 + (reduced ? 0 : time * 0.35) + px * 0.08;
    } else {
      const star = icon.children[0];
      star.rotation.x = -0.12 + floatY + py * 0.18;
      star.rotation.y = 0.22 + floatX + px * 0.22;
      star.rotation.z = 0.05 + floatZ + px * 0.06;
    }

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(render);
  };

  try {
    render();
  } catch (error) {
    canvas.dataset.error = error && error.message ? error.message : String(error);
  }
}

document.querySelectorAll(".card__glass").forEach(mountCard);
