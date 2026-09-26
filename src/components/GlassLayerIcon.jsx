import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const CARD_BG_IMAGES = {
  motion: "/images/card-bg-motion.jpg?v=silk",
  components: "/images/card-bg-components.jpg?v=wave",
  systems: "/images/card-bg-systems.jpg?v=silk",
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
      glassMaterial({ thickness: 1.35, dispersion: 6 })
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

export default function GlassLayerIcon({ kind = "motion", className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phaseSeed =
      kind === "components" ? 0.8 : kind === "systems" ? 1.6 : 0;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "default",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

    const onPointerEnter = () => {
      hovered = true;
    };
    const onPointerLeave = () => {
      hovered = false;
    };
    const onPointerMove = (event) => {
      if (!hovered || !card) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    card?.addEventListener("pointerenter", onPointerEnter);
    card?.addEventListener("pointerleave", onPointerLeave);
    card?.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    let frame = 0;

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
    };
    image.onerror = () => {
      if (cancelled) return;
      resize();
    };
    image.src = CARD_BG_IMAGES[kind] || CARD_BG_IMAGES.motion;

    resize();
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (!cancelled) resize();
      });
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);

    let visible = false;
    let renderedOnce = false;
    let lastRender = 0;
    const kick = () => {
      if (cancelled || reduced || document.hidden || frame) return;
      if (renderedOnce && (!visible || pageScrolling)) return;
      frame = requestAnimationFrame(render);
    };
    const render = (now) => {
      if (cancelled || document.hidden) {
        frame = 0;
        return;
      }
      if (renderedOnce && (!visible || pageScrolling)) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(render);
      const settling =
        hovered ||
        Math.abs(pointerSmooth.x) > 0.012 ||
        Math.abs(pointerSmooth.y) > 0.012;
      if (renderedOnce && !settling && now - lastRender < 48) return;
      lastRender = now;

      const time = clock.getElapsedTime() + phaseSeed;

      // Ease pointer influence toward hover target (or back to rest)
      const targetX = hovered ? pointer.x : 0;
      const targetY = hovered ? pointer.y : 0;
      const ease = hovered ? 0.14 : 0.07;
      pointerSmooth.x += (targetX - pointerSmooth.x) * ease;
      pointerSmooth.y += (targetY - pointerSmooth.y) * ease;
      const px = pointerSmooth.x;
      const py = pointerSmooth.y;

      // Soft idle float while resting / under the hover offset
      const floatX = Math.sin(time * 0.55) * 0.06;
      const floatY = Math.cos(time * 0.42) * 0.05;
      const floatZ = Math.sin(time * 0.33) * 0.04;

      if (reduced) {
        if (kind === "components") {
          const cluster = icon.children[0];
          cluster.rotation.set(-0.14, 0.22, Math.PI / 4);
          cluster.children.forEach((mesh) => {
            mesh.position.set(
              mesh.userData.baseX,
              mesh.userData.baseY,
              mesh.userData.baseZ
            );
          });
        } else if (kind === "systems") {
          icon.children[0].rotation.set(-0.16, 0.28, 0.08);
        } else {
          icon.children[0].rotation.set(-0.12, 0.22, 0.05);
        }
      } else if (kind === "components") {
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
        gear.rotation.z = 0.08 + time * 0.35 + px * 0.08;
      } else {
        const star = icon.children[0];
        star.rotation.x = -0.12 + floatY + py * 0.18;
        star.rotation.y = 0.22 + floatX + px * 0.22;
        star.rotation.z = 0.05 + floatZ + px * 0.06;
      }

      renderer.render(scene, camera);
      renderedOnce = true;
      canvas.classList.add("is-ready");
    };

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
      renderer.render(scene, camera);
      renderedOnce = true;
      canvas.classList.add("is-ready");
    } else {
      kick();
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
  }, [kind]);

  return (
    <canvas
      ref={canvasRef}
      className={`glass-layer-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
