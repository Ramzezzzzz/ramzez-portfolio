import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url, rotateXRef, rotateYRef, label }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();

  const clonedScene = useMemo(() => {
    return originalScene.scene.clone(true);
  }, [originalScene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        });
      }
    });
  }, [clonedScene]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.x += (rotateXRef.current - group.current.rotation.x) * delta * 8;
      group.current.rotation.y += (rotateYRef.current - group.current.rotation.y) * delta * 8;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={clonedScene} scale={0.8} position={[0, 0, 0]} />
      {/* 3D-текст */}
      <Text
        position={[0, -0.9, 0.3]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}

export default function Card3D({ glbPath, label, className = '' }) {
  const [hover, setHover] = useState(false);
  const cardRef = useRef(null);
  const rotateXRef = useRef(0);
  const rotateYRef = useRef(0);
  const rafId = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    mousePos.current.x = e.clientX;
    mousePos.current.y = e.clientY;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const normX = (mousePos.current.x - centerX) / (rect.width / 2);
          const normY = (mousePos.current.y - centerY) / (rect.height / 2);
          rotateYRef.current = Math.max(-1, Math.min(1, normX)) * Math.PI * 0.18;
          rotateXRef.current = Math.max(-1, Math.min(1, normY)) * Math.PI * 0.12;
        }
        rafId.current = null;
      });
    }
  };

  const handleMouseLeave = () => {
    rotateXRef.current = 0;
    rotateYRef.current = 0;
    setHover(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`w-24 h-24 sm:w-32 sm:h-32 transition-transform duration-300 ${className}`}
      style={{
        transform: hover ? 'scale(1.15)' : 'scale(1)',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        margin: '8px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model url={glbPath} rotateXRef={rotateXRef} rotateYRef={rotateYRef} label={label} />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}