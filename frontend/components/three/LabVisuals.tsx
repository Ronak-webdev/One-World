"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Box, Sphere, Torus, Dodecahedron, Icosahedron } from "@react-three/drei";

function RotatingMesh({ children }: { children: React.ReactNode }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.2;
      ref.current.rotation.y += delta * 0.3;
    }
  });
  return <mesh ref={ref}>{children}</mesh>;
}

export function VideoVisual() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Box args={[1.5, 1.5, 1.5]}>
            <MeshWobbleMaterial color="#FF9500" factor={0.4} speed={2} wireframe />
          </Box>
        </Float>
      </Canvas>
    </div>
  );
}

export function Model3DVisual() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <RotatingMesh>
          <sphereGeometry args={[1.4, 32, 32]} />
          <meshBasicMaterial color="#5B5BD6" wireframe />
        </RotatingMesh>
      </Canvas>
    </div>
  );
}

export function AvatarVisual() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <Float speed={3} rotationIntensity={2} floatIntensity={2}>
          <Torus args={[1, 0.3, 16, 32]}>
            <MeshDistortMaterial color="#FF3B30" speed={3} distort={0.4} wireframe />
          </Torus>
        </Float>
      </Canvas>
    </div>
  );
}

export function StyleVisual() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[-10, -10, -10]} color="#34C759" />
        <RotatingMesh>
          <dodecahedronGeometry args={[1.3]} />
          <meshStandardMaterial color="#34C759" wireframe />
        </RotatingMesh>
      </Canvas>
    </div>
  );
}

export function DocumentVisual() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Icosahedron args={[1.3, 1]}>
            <meshStandardMaterial color="#8E8E93" wireframe />
          </Icosahedron>
        </Float>
      </Canvas>
    </div>
  );
}
