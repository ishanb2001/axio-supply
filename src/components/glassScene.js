import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import motionBg from "../assets/bg-cards-2.png";
import componentsBg from "../assets/bg-4.png";
import systemsBg from "../assets/bg-5.png";

const CARD_BG_IMAGES = {
  motion: motionBg,
  components: componentsBg,
  systems: systemsBg,
};

const CARD_FALLBACK = {
  motion: "#ff6a3d",
  components: "#2a1a6e",
  systems: "#ff7a1a",
};

const CAMERA_Z = 5;
const SCROLL_PAUSE_MS = 700;

let pageScrolling = false;
let scrollIdleTimer = 0;
const scrollWatchers = new Set();

function ensureScrollWatch() {
  if (ensureScrollWatch.ready) return;
  ensureScrollWatch.ready = true;
  window.addEventListener(
    "scroll",
    () => {
      pageScrolling = true;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        pageScrolling = false;
        scrollWatchers.forEach((notify) => notify());
      }, SCROLL_PAUSE_MS);
    },
    { passive: true }
  );
}

function extrudeShape(shape, depth = 0.42) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.14,
    curveSegments: 6,
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
    const a0 = base - (step * rootWidth) / 2;
    const a1 = base - (step * tipWidth) / 2;
    const a2 = base + (step * tipWidth) / 2;
    const a3 = base + (step * rootWidth) / 2;

    const pts = [
      [Math.cos(a0) * rootR, Math.sin(a0) * rootR],
      [Math.cos(a1) * outerR, Math.sin(a1) * outerR],
      [Math.cos(a2) * outerR, Math.sin(a2) * outerR],
      [Math.cos(a3) * rootR, Math.sin(a3) * rootR],
    ];

    pts.forEach(([x, y], index) => {
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
    thickness: 0.28,
    ior: 1.15,
    dispersion: 0,
    envMapIntensity: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.08,
    specularIntensity: 0.4,
    specularColor: 0xffffff,
    attenuationColor: 0xffffff,
    attenuationDistance: 12,
    toneMapped: false,
    ...overrides,
  });
}

function disposeObject(object) {
  object.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

function drawBackdrop(kind, width, height, dpr, photo) {
  const fallback = CARD_FALLBACK[kind] || CARD_FALLBACK.motion;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * dpr));
  canvas.height = Math.max(2, Math.round(height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, width, height);

  if (photo && photo.complete && photo.naturalWidth > 0) {
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const drawW = photo.naturalWidth * scale;
    const drawH = photo.naturalHeight * scale;
    const dx = (width - drawW) / 2;
    const dy = (height - drawH) / 2;
    ctx.drawImage(photo, dx, dy, drawW, drawH);
  }

  return canvas;
}

function createComponentsCluster() {
  const group = new THREE.Group();
  const size = 0.92;
  const gap = 0.28;
  const offset = size / 2 + gap / 2;
  const geometry = createRoundedRectGeometry(size, size, 0.28, 0.36);
  const positions = [
    [-offset, offset, 0],
    [offset, offset, 0],
    [-offset, -offset, 0],
    [offset, -offset, 0],
  ];

  positions.forEach(([x, y, z], index) => {
    const mesh = new THREE.Mesh(
      geometry.clone(),
      glassMaterial({ thickness: 0.32 })
    );
    mesh.position.set(x, y, z);
    mesh.userData = { baseX: x, baseY: y, baseZ: z, phase: index * 0.7 };
    group.add(mesh);
  });

  // Match the reference: 2x2 tiles rotated into a diamond
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

const glassBootQueue = [];
let glassBootActive = false;

export function scheduleGlassBoot(run) {
  glassBootQueue.push(run);
  const pump = () => {
    if (glassBootActive) return;
    const next = glassBootQueue.shift();
    if (!next) return;
    glassBootActive = true;
    const release = () => {
      glassBootActive = false;
      if (glassBootQueue.length) pump();
    };
    const start = () => {
      next();
      window.setTimeout(release, 32);
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(start, { timeout: 700 });
    } else {
      window.setTimeout(start, 48);
    }
  };
  pump();
}

export function mountGlassScene(canvas, kind) {

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const clearColor = new THREE.Color(CARD_FALLBACK[kind] || CARD_FALLBACK.motion);
    renderer.setClearColor(clearColor, 1);

    const scene = new THREE.Scene();
    scene.background = clearColor.clone();
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
    let cancelled = false;
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ toneMapped: false })
    );
    scene.add(backdrop);

    const icon = buildIcon(kind);
    icon.position.z = 1.35;
    scene.add(icon);

    const card = canvas.closest(".home-expand__card") || canvas.parentElement;
    const pointer = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    let hovered = false;
    let frame = 0;
    let visible = false;
    let renderedOnce = false;

    const applyPose = () => {
      const px = pointerSmooth.x;
      const py = pointerSmooth.y;

      if (kind === "components") {
        const cluster = icon.children[0];
        cluster.rotation.x = -0.14 + py * 0.2;
        cluster.rotation.y = 0.22 + px * 0.22;
        cluster.rotation.z = Math.PI / 4 + px * 0.05;
        cluster.children.forEach((mesh) => {
          mesh.position.set(mesh.userData.baseX, mesh.userData.baseY, mesh.userData.baseZ);
        });
        return;
      }

      if (kind === "systems") {
        const gear = icon.children[0];
        gear.rotation.x = -0.16 + py * 0.2;
        gear.rotation.y = 0.28 + px * 0.22;
        gear.rotation.z = 0.08 + px * 0.06;
        return;
      }

      const star = icon.children[0];
      star.rotation.x = -0.12 + py * 0.2;
      star.rotation.y = 0.22 + px * 0.24;
      star.rotation.z = 0.05 + px * 0.05;
    };

    const paint = () => {
      if (cancelled) return;
      applyPose();
      try {
        renderer.render(scene, camera);
      } catch (error) {
        canvas.dataset.error = error?.message || String(error);
        return;
      }
      renderedOnce = true;
      canvas.classList.add("is-ready");
    };

    const render = () => {
      frame = 0;
      if (cancelled || document.hidden || !visible || pageScrolling) return;

      const targetX = hovered ? pointer.x : 0;
      const targetY = hovered ? pointer.y : 0;
      pointerSmooth.x += (targetX - pointerSmooth.x) * (hovered ? 0.16 : 0.1);
      paint();

      const caughtUp =
        Math.abs(targetX - pointerSmooth.x) < 0.004 &&
        Math.abs(targetY - pointerSmooth.y) < 0.004;
      if (caughtUp) {
        pointerSmooth.x = targetX;
        pointerSmooth.y = targetY;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const kick = () => {
      if (cancelled || reduced || document.hidden || frame) return;
      if (renderedOnce && (!visible || pageScrolling)) return;
      frame = requestAnimationFrame(render);
    };

    const onPointerEnter = () => {
      hovered = true;
      kick();
    };
    const onPointerLeave = () => {
      hovered = false;
      kick();
    };
    const onPointerMove = (event) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      hovered = true;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerSmooth.x += (pointer.x - pointerSmooth.x) * 0.16;
      pointerSmooth.y += (pointer.y - pointerSmooth.y) * 0.16;
      kick();
    };

    card?.addEventListener("pointerenter", onPointerEnter);
    card?.addEventListener("pointerleave", onPointerLeave);
    card?.addEventListener("pointermove", onPointerMove);

    const paintBackdrop = (width, height) => {
      const dpr = renderer.getPixelRatio();
      const source = drawBackdrop(kind, width, height, dpr, photo);
      backdropMap?.dispose();
      backdropMap = new THREE.CanvasTexture(source);
      backdropMap.colorSpace = THREE.SRGBColorSpace;
      backdropMap.anisotropy = 4;
      backdrop.material.map = backdropMap;
      backdrop.material.needsUpdate = true;
    };

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth || 200);
      const height = Math.max(1, canvas.clientHeight || 200);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const visibleHeight =
        2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const visibleWidth = visibleHeight * camera.aspect;
      backdrop.scale.set(visibleWidth * 1.04, visibleHeight * 1.04, 1);

      const fitRatio =
        kind === "motion" ? 0.44 : kind === "components" ? 0.36 : 0.35;
      const iconScale = (Math.min(visibleWidth, visibleHeight) * fitRatio) / 2.55;
      icon.scale.setScalar(iconScale);
      icon.position.set(0, visibleHeight * 0.02, 1.35);

      paintBackdrop(width, height);
    };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      photo = image;
      resize();
      paint();
    };
    image.onerror = () => {
      if (cancelled) return;
      resize();
      paint();
    };
    image.src = CARD_BG_IMAGES[kind] || CARD_BG_IMAGES.motion;

    resize();
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (cancelled) return;
        resize();
        paint();
      });
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);

    ensureScrollWatch();
    const onScrollIdle = () => kick();
    scrollWatchers.add(onScrollIdle);

    const watch = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      kick();
    });
    watch.observe(canvas);

    const onVisibility = () => kick();
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      paint();
    } else {
      paint();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      scrollWatchers.delete(onScrollIdle);
      watch.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      card?.removeEventListener("pointerenter", onPointerEnter);
      card?.removeEventListener("pointerleave", onPointerLeave);
      card?.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      disposeObject(icon);
      backdrop.geometry.dispose();
      backdrop.material.dispose();
      backdropMap?.dispose();
      scene.environment?.dispose?.();
      renderer.dispose();
    };
}
