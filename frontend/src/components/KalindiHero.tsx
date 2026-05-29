"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

type FloatingProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

function Almond({ position, rotation, scale }: FloatingProps) {
  const { scene } = useGLTF("/almond.glb");
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state: any) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={2}>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        {/* We use clone() so we can have multiple almonds without material sharing issues */}
        <primitive object={scene.clone()} />
      </group>
    </Float>
  );
}

function Lotus({
  position,
  rotation = [0, 0, 0],
  scale,
  logoRef,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: number;
  logoRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { scene } = useGLTF("/lotus_slow.glb");
  const groupRef = useRef<THREE.Group>(null!);

  // Start 4 units below the target position
  const baseY = useRef(position[1] - 4);
  const floatAmp = useRef(0);

  useEffect(() => {
    gsap.to(baseY, {
      current: position[1],
      duration: 1.5,
      ease: "power3.out",
      delay: 0.3 // Added delay to allow shader compilation
    });
    // Fade in the floating oscillation to prevent entry jitter
    gsap.to(floatAmp, {
      current: 1,
      duration: 1.5,
      ease: "power2.inOut",
      delay: 0.8
    });
  }, [position]);

  useFrame((state: any) => {
    if (!groupRef.current) return;
    // Gentle floating motion multiplied by floatAmp
    const time = state.clock.elapsedTime;
    const offset = Math.sin(time * 1.5) * floatAmp.current;
    
    groupRef.current.position.y = baseY.current + offset * 0.1;
    
    // Very subtle up/down rocking (swaying) rotation
    groupRef.current.rotation.x = Math.cos(time * 1.0) * 0.015 * floatAmp.current;
    groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.02 * floatAmp.current;

    // Synchronize logo floating in DOM
    if (logoRef.current) {
      // Negated because CSS translate Y is positive downwards, whereas 3D Y is positive upwards
      logoRef.current.style.setProperty("--logo-float-y", `${-offset * 12}px`);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// Pistachio: an oval shell (oblate spheroid) with a flat crease/split on top
// Uses a sphere scaled to be wider than tall, plus a capsule for the opening
function Pistachio({ position, rotation, scale }: FloatingProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x += 0.002;
    groupRef.current.rotation.z += 0.002;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={3}>
      <group ref={groupRef} position={position} rotation={rotation}>
        {/* Shell — wide oblate oval, like the real pistachio shell */}
        <mesh scale={[scale * 0.85, scale * 0.65, scale * 0.7]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#C8A96A"
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        {/* The split/opening crease across the top */}
        <mesh
          scale={[scale * 0.9, scale * 0.06, scale * 0.12]}
          position={[0, 0.55 * scale, 0]}
          rotation={[0, 0, 0]}
        >
          <capsuleGeometry args={[1, 0.1, 4, 8]} />
          <meshStandardMaterial color="#8B6914" roughness={0.8} metalness={0} />
        </mesh>
        {/* Green kernel visible inside the split */}
        <mesh scale={[scale * 0.4, scale * 0.15, scale * 0.25]} position={[0, 0.55 * scale, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#6B8E23" roughness={0.6} metalness={0} />
        </mesh>
      </group>
    </Float>
  );
}

function Cashew({ position, rotation, scale }: FloatingProps) {
  const { scene } = useGLTF("/cashew.glb");
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state: any) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y -= 0.004;
    groupRef.current.position.y =
      position[1] + Math.cos(state.clock.elapsedTime * 0.8 + position[2]) * 0.2;
  });

  return (
    <Float speed={2.5} rotationIntensity={1} floatIntensity={2.5}>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        <primitive object={scene.clone()} />
      </group>
    </Float>
  );
}

function Walnut({ position, rotation, scale }: FloatingProps) {
  const { scene } = useGLTF("/walnut.glb");
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state: any) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.003;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={2}>
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        <primitive object={scene.clone()} />
      </group>
    </Float>
  );
}



function Scene({
  logoRef,
  onLoaded,
  isMobile,
  controlDom,
}: {
  logoRef: React.RefObject<HTMLDivElement | null>;
  onLoaded: () => void;
  isMobile: boolean;
  controlDom: HTMLDivElement | null;
}) {
  useEffect(() => {
    // When this component mounts, Suspense has resolved and all GLTFs are loaded
    onLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Fog to fade out items at a distance */}
      <fog attach="fog" args={["#fdf2f8", 8, 30]} />

      <ambientLight intensity={1.5} />
      {/* Bright clear lighting for light theme */}
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, 3, 4]} intensity={1.5} color="#e91e8c" />
      <pointLight position={[0, -3, -5]} intensity={1} color="#f472b6" />

      {/* Almonds scattered on the LEFT */}
      <Almond position={[isMobile ? -1.8 : -3.5, 1, 0.5]} rotation={[0.2, 0.5, 0]} scale={isMobile ? 0.009 : 0.015} />
      <Almond position={[isMobile ? -2.2 : -4.2, -1.5, 1]} rotation={[0.3, 0.2, 0]} scale={isMobile ? 0.007 : 0.012} />
      <Almond position={[isMobile ? -1.5 : -2.8, 2.5, -1.5]} rotation={[0.5, 0.1, 0.4]} scale={isMobile ? 0.008 : 0.014} />
      <Almond position={[isMobile ? -2.3 : -4.5, -0.2, 0.5]} rotation={[0.6, 0.1, 0.2]} scale={isMobile ? 0.006 : 0.01} />
      <Almond position={[isMobile ? -1.6 : -3.0, -2.5, 1.0]} rotation={[0.4, 0.2, 0.7]} scale={isMobile ? 0.009 : 0.015} />

      {/* Almonds scattered on the RIGHT */}
      <Almond position={[isMobile ? 1.6 : 3.2, -1.2, 1]} rotation={[0.3, 0.2, 0]} scale={isMobile ? 0.007 : 0.012} />
      <Almond position={[isMobile ? 2.2 : 4.5, 3.0, 0.5]} rotation={[0.1, 0.6, 0.2]} scale={isMobile ? 0.006 : 0.01} />
      <Almond position={[isMobile ? 1.8 : 4.0, -0.5, -2.0]} rotation={[0.7, 0.3, 0.1]} scale={isMobile ? 0.008 : 0.014} />
      <Almond position={[isMobile ? 1.7 : 3.8, 1.5, 0.3]} rotation={[0.1, 0.7, 0.5]} scale={isMobile ? 0.006 : 0.011} />
      <Almond position={[isMobile ? 1.6 : 3.5, -2.5, -0.5]} rotation={[0.2, 0.5, 0]} scale={isMobile ? 0.007 : 0.013} />

      {/* Cashews scattered on the LEFT */}
      <Cashew position={[isMobile ? -2.1 : -4.5, -3, 2]} rotation={[0.3, 0.1, 0.5]} scale={isMobile ? 0.21 : 0.35} />
      <Cashew position={[isMobile ? -1.6 : -3.2, 0.5, -2.5]} rotation={[0.5, 0.8, 0.1]} scale={isMobile ? 0.18 : 0.3} />
      <Cashew position={[isMobile ? -1.3 : -2.5, -1.5, -1.0]} rotation={[0.6, 0.2, 0.4]} scale={isMobile ? 0.16 : 0.28} />
      <Cashew position={[isMobile ? -1.9 : -3.8, 2.0, 0.5]} rotation={[0.4, 0.3, 0.8]} scale={isMobile ? 0.2 : 0.34} />

      {/* Cashews scattered on the RIGHT */}
      <Cashew position={[isMobile ? 2.0 : 4.2, 3, -2]} rotation={[0.1, 0.4, 0.2]} scale={isMobile ? 0.18 : 0.3} />
      <Cashew position={[isMobile ? 1.7 : 3.5, 1.5, 1.5]} rotation={[0.2, 0.5, 0.8]} scale={isMobile ? 0.21 : 0.35} />
      <Cashew position={[isMobile ? 1.5 : 3.0, -2.5, 2.0]} rotation={[0.1, 0.7, 0.3]} scale={isMobile ? 0.15 : 0.25} />
      <Cashew position={[isMobile ? 2.2 : 4.5, -1.0, -0.4]} rotation={[0.8, 0.1, 0.3]} scale={isMobile ? 0.19 : 0.32} />

      {/* Walnuts scattered on the LEFT */}
      <Walnut position={[isMobile ? -1.8 : -3.8, 0, -1]} rotation={[0.4, 0.2, 0.1]} scale={isMobile ? 5.0 : 9.0} />
      <Walnut position={[isMobile ? -1.3 : -2.6, -2, 0.8]} rotation={[0.1, 0.5, 0.3]} scale={isMobile ? 5.0 : 9.0} />
      <Walnut position={[isMobile ? -1.9 : -4.0, 2.2, -0.5]} rotation={[0.3, 0.1, 0.6]} scale={isMobile ? 4.5 : 8.0} />

      {/* Walnuts scattered on the RIGHT */}
      <Walnut position={[isMobile ? 1.7 : 3.6, -0.8, -0.5]} rotation={[0.2, 0.3, 0.4]} scale={isMobile ? 5.0 : 9.0} />
      <Walnut position={[isMobile ? 1.4 : 2.8, 2, -1.5]} rotation={[0.5, 0.1, 0.2]} scale={isMobile ? 5.0 : 9.0} />
      <Walnut position={[isMobile ? 2.0 : 4.2, -2.2, 0.5]} rotation={[0.1, 0.6, 0.3]} scale={isMobile ? 4.5 : 8.0} />

      {/* Interactive Lotus below the logo in the center */}
      <Lotus position={[0, isMobile ? -0.5 : -1, 0]} rotation={[0, 0, 0]} scale={isMobile ? 0.018 : 0.032} logoRef={logoRef} />

      <Environment preset="city" />

      {controlDom && (
        <OrbitControls
          domElement={controlDom}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.2}
          enablePan={false}
          maxPolarAngle={Math.PI / 3 + 0.10}
          minPolarAngle={Math.PI / 3 - 0.10}
        />
      )}
    </>
  );
}

export default function KalindiHero() {
  const logoRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [controlDom, setControlDom] = useState<HTMLDivElement | null>(null);
  const handleLoaded = useMemo(() => () => setIsLoaded(true), []);

  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Suppress harmless Three.js WebGL and Clock warnings to keep the console clean
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (typeof args[0] === "string" && (args[0].includes("THREE.Clock") || args[0].includes("THREE.WebGLProgram"))) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      window.removeEventListener("resize", handleResize);
      console.warn = originalWarn;
    };
  }, []);

  return (
    <section className="relative h-[120vh] md:h-[140vh] w-full overflow-hidden bg-transparent">
      {/* 3D Canvas wrapper to ensure absolute positioning and correct R3F size */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {mounted && (
          <Canvas
            camera={{ position: [0, 4, isMobile ? 8.5 : 6.928], fov: isMobile ? 50 : 45 }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <Scene logoRef={logoRef} onLoaded={handleLoaded} isMobile={isMobile} controlDom={controlDom} />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Invisible Touch Target for Rotating the Lotus */}
      <div
        ref={setControlDom}
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-[400px] md:h-[400px] rounded-full z-20 pointer-events-auto cursor-grab active:cursor-grabbing touch-none bg-transparent"
      />

      {/* Soft light vignettes */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/60 pointer-events-none z-10" />

      {/* Hero Text Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Main title Logo - Positioned top-center */}
        <motion.div
          initial={{ opacity: 0, y: -150, x: "-50%" }}
          animate={isLoaded ? { opacity: 1, y: 0, x: "-50%" } : { opacity: 0, y: -150, x: "-50%" }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="absolute top-28 left-1/2 w-full max-w-[420px] md:max-w-[580px] flex justify-center"
        >
          {/* Inner wrapper to synchronize float motion directly from the R3F loop */}
          <div
            ref={logoRef}
            style={{ transform: "translate3d(0, var(--logo-float-y, 0px), 0)" }}
            className="w-full flex justify-center"
          >
            <Image
              src="/kalindi.png"
              alt="Kalindi"
              width={700}
              height={200}
              className="w-full h-auto max-h-[190px] md:max-h-[260px] object-contain drop-shadow-[0_0_20px_rgba(255,255,255,1)]"
              priority
            />
          </div>
        </motion.div>

        {/* CTA Buttons - Positioned below the Lotus bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-6 items-center justify-center z-30 pointer-events-auto"
        >
          <a
            href="/collection"
            className="group relative px-8 py-4 rounded-full font-medium text-lg text-white overflow-hidden shadow-[0_0_40px_rgba(233,30,140,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#e91e8c] to-[#d4af37] transition-transform duration-500 group-hover:scale-105" />
            <div className="relative flex items-center gap-2">
              Explore Collection <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          <a
            href="#gifts"
            className="px-8 py-4 rounded-full font-medium text-lg text-kalindi-purple border border-kalindi-purple/30 hover:bg-kalindi-purple/5 backdrop-blur-sm transition-all duration-300"
          >
            Gift Collections
          </a>
        </motion.div>

        {/* Bottom stats - Positioned at the very bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-12"
        >
          {[
            { v: "15+", l: "Years" },
            { v: "50K+", l: "Customers" },
            { v: "100%", l: "Natural" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e91e8c] to-[#f472b6]">
                {s.v}
              </p>
              <p className="text-xs text-[#0f1a34]/60 mt-0.5 tracking-wider uppercase font-semibold">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

useGLTF.preload("/almond.glb");
useGLTF.preload("/cashew.glb");
useGLTF.preload("/walnut.glb");
useGLTF.preload("/lotus_slow.glb");
