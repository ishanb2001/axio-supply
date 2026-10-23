import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import "./HeroOrb.css";

const ORANGE = "#D97757";

/** Radians per second. One full turn takes about 42 seconds. */
const SPIN = 0.15;
const FLOAT = 0.35;
const TILT = 0.22;

function SoftShape() {
  const ref = useRef(null);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;

    const step = Math.min(delta, 0.05);
    const { pointer, clock } = state;

    mesh.rotation.y += step * SPIN;
    mesh.position.y = Math.sin(clock.elapsedTime * FLOAT) * 0.08;

    const ease = 1 - Math.exp(-2.2 * step);
    const tiltX = 0.4 + pointer.y * -TILT;
    const tiltZ = 0.08 + pointer.x * TILT * 0.65;
    mesh.rotation.x += (tiltX - mesh.rotation.x) * ease;
    mesh.rotation.z += (tiltZ - mesh.rotation.z) * ease;
  });

  return (
    <RoundedBox
      ref={ref}
      args={[1.45, 1.45, 1.45]}
      radius={0.42}
      smoothness={5}
      bevelSegments={3}
      rotation={[0.4, 0.55, 0.08]}
    >
      <meshStandardMaterial color={ORANGE} roughness={0.46} metalness={0.06} />
    </RoundedBox>
  );
}

function useHeroFrameloop() {
  const [frameloop, setFrameloop] = useState("always");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      const hidden = document.visibilityState !== "visible";
      if (hidden) {
        setFrameloop("never");
        return;
      }
      setFrameloop(motion.matches ? "demand" : "always");
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return frameloop;
}

export default function HeroOrb() {
  const frameloop = useHeroFrameloop();

  return (
    <div className="hero-orb" aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.4], fov: 32 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2.4, 3.1, 4]} intensity={1.4} />
        <directionalLight position={[-2.8, -1.2, 1.6]} intensity={0.28} color="#fff1ea" />
        <SoftShape />
      </Canvas>
    </div>
  );
}
