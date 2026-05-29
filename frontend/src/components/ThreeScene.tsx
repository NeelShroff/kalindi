"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Environment, ContactShadows, PresentationControls, Sparkles } from "@react-three/drei";

function GiftBox({ isMobile }: { isMobile: boolean }) {
  const scale = isMobile ? 0.6 : 1.0;
  return (
    <Float floatIntensity={2} rotationIntensity={1} speed={2}>
      <group scale={[scale, scale, scale]} position={[0, isMobile ? -0.5 : 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 1, 4]} />
          <meshStandardMaterial color="#1e0a2e" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.51, 0]}>
          <boxGeometry args={[0.2, 0.02, 4.02]} />
          <meshStandardMaterial color="#e91e8c" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.51, 0]}>
          <boxGeometry args={[3.02, 0.02, 0.2]} />
          <meshStandardMaterial color="#e91e8c" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <planeGeometry args={[1, 0.5]} />
          <meshStandardMaterial color="#3d1a5c" roughness={0.1} metalness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function Nut({ position, scale, color }: { position: [number, number, number], scale: number, color: string }) {
  return (
    <Float floatIntensity={4} rotationIntensity={4} speed={1.5} position={position}>
      <mesh castShadow receiveShadow scale={scale}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </Float>
  );
}

export default function ThreeScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas shadows camera={{ position: [0, 2, isMobile ? 11 : 8], fov: 45 }}>
        <color attach="background" args={['#0d0a14']} />
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow color="#e91e8c" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#3d1a5c" />
        <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" />
        <Environment preset="city" />
        {/* @ts-ignore */}
        <PresentationControls
          global
          {...({
            config: { mass: 2, tension: 500 },
            snap: { mass: 4, tension: 1500 },
          } as any)}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <GiftBox isMobile={isMobile} />
          <Nut position={isMobile ? [-1.6, 0.6, -1] : [-3, 1, -2]} scale={isMobile ? 0.16 : 0.3} color="#D4AF37" />
          <Nut position={isMobile ? [1.6, 1.2, 0.5] : [3, 2, 1]} scale={isMobile ? 0.13 : 0.25} color="#8F9779" />
          <Nut position={isMobile ? [-1.1, -0.6, 1.5] : [-2, -1, 3]} scale={isMobile ? 0.22 : 0.4} color="#D2B48C" />
          <Nut position={isMobile ? [1.1, -0.9, -0.5] : [2, -1.5, -1]} scale={isMobile ? 0.18 : 0.35} color="#D2B48C" />
          <Sparkles count={isMobile ? 100 : 200} scale={12} size={1.5} speed={0.4} opacity={0.4} color="#e91e8c" />
          <Sparkles count={isMobile ? 50 : 100} scale={12} size={1} speed={0.2} opacity={0.2} color="#D4AF37" />
        </PresentationControls>
        <ContactShadows position={[0, isMobile ? -1.2 : -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  );
}

