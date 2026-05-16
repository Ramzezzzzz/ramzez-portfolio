import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Настройки наклона ──
const MOBILE_AMP_Y = 0.9;   // горизонталь на телефоне (гироскоп)
const MOBILE_AMP_X = 0.9;   // вертикаль на телефоне (гироскоп)
const DESKTOP_AMP_Y = 0.19; // горизонталь на компьютере
const MAX_VERTICAL_UP = Math.PI * 0.15;   // угол при наклоне вверх
const MAX_VERTICAL_DOWN = Math.PI * 0.29; // угол при наклоне вниз

function Model({ url, rotateXRef, rotateYRef, label, hoverRef }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();
  const clonedScene = useMemo(() => originalScene.scene.clone(true), [originalScene]);

  const targetOpacityRef = useRef(0.35);
  const currentOpacityRef = useRef(0.35);

  useEffect(() => {
    targetOpacityRef.current = hoverRef.current ? 0.8 : 0.35;
  }, [hoverRef.current]);

  useFrame((_, delta) => {
    const step = 0.1;
    currentOpacityRef.current += (targetOpacityRef.current - currentOpacityRef.current) * step;

    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = currentOpacityRef.current;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        });
      }
    });

    if (group.current) {
      group.current.rotation.x += (rotateXRef.current - group.current.rotation.x) * delta * 8;
      group.current.rotation.y += (rotateYRef.current - group.current.rotation.y) * delta * 8;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={clonedScene} scale={0.8} position={[0, 0, 0]} />
      {/* Свечение позади */}
      <Text
        position={[0, 0.1, 0.24]}
        fontSize={0.26}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        font={undefined}
      >
        {label}
      </Text>
      {/* Основной текст с красной обводкой при hover */}
      <Text
        position={[0, 0.1, 0.25]}
        fontSize={0.26}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
        outlineWidth={hoverRef.current ? 0.02 : 0}
        outlineColor="#ff0000"
      >
        {label}
      </Text>
    </group>
  );
}

export default function Card3D({ glbPath, label, baseRotationY = 0, className = '', isGyroActive = false }) {
  const [hover, setHover] = useState(false);
  const cardRef = useRef(null);
  const rotateXRef = useRef(-0.12 * Math.PI);
  const rotateYRef = useRef(baseRotationY);
  const hoverRef = useRef(false);

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // Гироскоп (мобильные) – усиленная амплитуда без лишнего ограничения
  useEffect(() => {
    if (!isGyroActive) return;
    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      // Ограничиваем нормированные значения, но даём больше свободы за счёт высоких множителей
      const normGamma = Math.max(-1, Math.min(1, gamma / 90));
      const normBeta = Math.max(-1, Math.min(1, (beta - 45) / 90));

      rotateYRef.current = baseRotationY + normGamma * Math.PI * MOBILE_AMP_Y;
      const verticalLimit = normBeta >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;
      rotateXRef.current = normBeta * verticalLimit;
    };
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permission => {
        if (permission === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isGyroActive, baseRotationY]);

  // Глобальное слежение за мышью + индивидуальная подсветка
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);
      const verticalLimit = normY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;

      rotateYRef.current = baseRotationY + Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
      rotateXRef.current = Math.max(-1, Math.min(1, normY)) * verticalLimit;

      const isHovering = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top && e.clientY <= rect.bottom;
      setHover(isHovering);
    };

    const handleGlobalMouseLeave = () => {
      setHover(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, [baseRotationY]);

  // Тач (если гироскоп не активен)
  const handleTouchMove = (e) => {
    if (isGyroActive) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (touch.clientX - centerX) / (rect.width / 2);
      const normY = (touch.clientY - centerY) / (rect.height / 2);
      const verticalLimit = normY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;

      rotateYRef.current = baseRotationY + Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
      rotateXRef.current = Math.max(-1, Math.min(1, normY)) * verticalLimit;

      const isTouching = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                         touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      setHover(isTouching);
    }
  };

  const resetRotation = () => {
    rotateXRef.current = -0.12 * Math.PI;
    rotateYRef.current = baseRotationY;
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
      onTouchMove={handleTouchMove}
      onTouchEnd={resetRotation}
    >
      <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model url={glbPath} rotateXRef={rotateXRef} rotateYRef={rotateYRef} label={label} hoverRef={hoverRef} />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}