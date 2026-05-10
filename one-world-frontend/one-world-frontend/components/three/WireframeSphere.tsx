"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Sphere() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.2;
      ref.current.rotation.y += delta * 0.28;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.25, 24, 24]} />
      <meshBasicMaterial color="#5B5BD6" wireframe />
    </mesh>
  );
}

export function WireframeSphere() {
  return (
    <div className="h-[300px] w-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Sphere />
      </Canvas>
    </div>
  );
}

