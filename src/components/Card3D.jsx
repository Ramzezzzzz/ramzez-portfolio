import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

const MOBILE_AMP_X = 0.5;
const MOBILE_AMP_Y = 0.5;
const DESKTOP_AMP_X = 0.06;
const DESKTOP_AMP_Y = 0.09;

function Model({ url, rotateXRef, rotateYRef, label, hover }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();
  const clonedScene = useMemo(() => originalScene.scene.clone(true), [originalScene]);

  useEffect(() => {
    const targetOpacity = hover ? 0.75 : 0.35;
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = targetOpacity;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        });
      }
    });
  }, [hover, clonedScene]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.x += (rotateXRef.current - group.current.rotation.x) * delta * 8;
      group.current.rotation.y += (rotateYRef.current - group.current.rotation.y) * delta * 8;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={clonedScene} scale={0.8} position={[0, 0, 0]} />
      <Text position={[0, 0.1, 0.24]} fontSize={0.26} color="#ff6666" anchorX="center" anchorY="middle" fillOpacity={0.4} font={undefined}>
        {label}
      </Text>
      <Text position={[0, 0.1, 0.25]} fontSize={0.26} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
        {label}
      </Text>
    </group>
  );
}

export default function Card3D({ glbPath, label, className = '', isGyroActive = false }) {
  const [hover, setHover] = useState(false);
  const cardRef = useRef(null);
  const rotateXRef = useRef(0.05 * Math.PI);
  const rotateYRef = useRef(0);

  // Гироскоп (мобильные)
  useEffect(() => {
    if (!isGyroActive) return;
    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = gamma / 90;
      rotateYRef.current = Math.max(-1, Math.min(1, normGamma)) * Math.PI * MOBILE_AMP_Y;
      const normBeta = (beta - 45) / 90;
      rotateXRef.current = 0.05 * Math.PI + normBeta * Math.PI * MOBILE_AMP_X;
    };
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permission => {
        if (permission === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isGyroActive]);

  // Мышь / тач только на своём div
  const updateRotation = (clientX, clientY) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (clientX - centerX) / (rect.width / 2);
    const normY = (clientY - centerY) / (rect.height / 2);
    rotateYRef.current = Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
    rotateXRef.current = 0.05 * Math.PI + normY * Math.PI * DESKTOP_AMP_X;
  };

  const handleMouseMove = (e) => updateRotation(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    if (isGyroActive) return;
    e.preventDefault();
    if (e.touches.length > 0) updateRotation(e.touches[0].clientX, e.touches[0].clientY);
  };
  const resetRotation = () => {
    rotateXRef.current = 0.05 * Math.PI;
    rotateYRef.current = 0;
    setHover(false);
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-300 ${className}`}
      style={{
        width: '160px',
        height: '160px',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        transform: hover ? 'scale(1.15)' : 'scale(1)',
        cursor: 'pointer',
        overflow: 'visible',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={resetRotation}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetRotation}
    >
      <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model url={glbPath} rotateXRef={rotateXRef} rotateYRef={rotateYRef} label={label} hover={hover} />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}