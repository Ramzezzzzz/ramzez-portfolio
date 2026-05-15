import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url, rotateXRef, rotateYRef, label, hover }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();
  const clonedScene = useMemo(() => originalScene.scene.clone(true), [originalScene]);

  // Обновляем прозрачность материалов при изменении hover
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

      {/* Свечение позади основного текста */}
      <Text
        position={[0, 0.1, 0.24]}
        fontSize={0.26}
        color="#ff6666"      // красноватое свечение
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.4}
        font={undefined}
      >
        {label}
      </Text>

      {/* Основной текст */}
      <Text
        position={[0, 0.1, 0.25]}
        fontSize={0.26}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
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
  const touchPos = useRef({ x: 0, y: 0 });

  const updateRotation = (clientX, clientY) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (clientX - centerX) / (rect.width / 2);
    const normY = (clientY - centerY) / (rect.height / 2);
    rotateYRef.current = Math.max(-1, Math.min(1, normX)) * Math.PI * 0.18;
    rotateXRef.current = Math.max(-1, Math.min(1, normY)) * Math.PI * 0.12;
  };

  // Мышь (на всём окне)
  const handleMouseMove = (e) => {
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        updateRotation(e.clientX, e.clientY);
        rafId.current = null;
      });
    }
  };

  // Касания – только на самой карточке, не мешают кнопкам
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          updateRotation(touch.clientX, touch.clientY);
          rafId.current = null;
        });
      }
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateRotation(touch.clientX, touch.clientY);
    }
  };

  const resetRotation = () => {
    rotateXRef.current = 0;
    rotateYRef.current = 0;
    setHover(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', resetRotation);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', resetRotation);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Мобильные слушатели вешаем на сам div карточки
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: resetRotation,
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
      {...touchHandlers}
    >
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
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