import React, { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

const DESKTOP_AMP_Y = 0.19;
const MAX_VERTICAL_UP = Math.PI * 0.15;
const MAX_VERTICAL_DOWN = Math.PI * 0.29;
const MOBILE_AMP_Y = 0.5;
const MOBILE_MAX_VERTICAL_UP = Math.PI * 0.8;
const MOBILE_MAX_VERTICAL_DOWN = Math.PI * 0.5;

function Model({ url, rotateXRef, rotateYRef, label, hoverRef, scale }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();
  const clonedScene = useMemo(() => originalScene.scene.clone(true), [originalScene]);

  const targetOpacityRef = useRef(0.35);
  const currentOpacityRef = useRef(0.35);
  const textOpacityRef = useRef(1);

  useEffect(() => {
    if (hoverRef.current) {
      targetOpacityRef.current = 0.8;
      textOpacityRef.current = 1;
    } else {
      targetOpacityRef.current = 0.35;
      textOpacityRef.current = 1;
    }
  }, [hoverRef.current]);

  useFrame((_, delta) => {
    const step = 0.1;
    currentOpacityRef.current += (targetOpacityRef.current - currentOpacityRef.current) * step;
    textOpacityRef.current += (textOpacityRef.current === 0 ? 0 : 1 - textOpacityRef.current) * step;

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
      <primitive object={clonedScene} scale={scale} position={[0, 0, 0]} />
      {!hoverRef.current && (
        <>
          <Text
            position={[0, 0.1, 0.25]}
            fontSize={0.26}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#ff0000"
            fillOpacity={textOpacityRef.current}
          >
            {label}
          </Text>
          <Text
            position={[0, 0.1, 0.24]}
            fontSize={0.26}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.9 * textOpacityRef.current}
          >
            {label}
          </Text>
        </>
      )}
      {hoverRef.current && (
        <>
          <Text
            position={[0, 0.1, 0.25]}
            fontSize={0.26}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#ff0000"
            fillOpacity={textOpacityRef.current}
          >
            {label}
          </Text>
          <Text
            position={[0, -0.15, 0.25]}
            fontSize={0.18}
            color="#00ff88"
            anchorX="center"
            anchorY="middle"
            fillOpacity={textOpacityRef.current}
          >
            перейти
          </Text>
          <Text
            position={[0, 0.1, 0.24]}
            fontSize={0.26}
            color="#ff0000"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.9 * textOpacityRef.current}
          >
            {label}
          </Text>
        </>
      )}
    </group>
  );
}

export default function Card3D({
  glbPath,
  label,
  baseRotationY = 0,
  className = '',
  isGyroActive = false,
  onClick,
  miniScale = 0.8,
  hidden = false,
}) {
  const [hover, setHover] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const cardRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 2;

  const rotateX = useRef(-0.12 * Math.PI);
  const rotateY = useRef(baseRotationY);
  const hoverRef = useRef(false);

  const loadModel = useCallback(() => {
    const loader = new GLTFLoader();
    loader.load(glbPath,
      () => {
        setModelLoaded(true);
        setLoadError(false);
      },
      undefined,
      (error) => {
        console.warn(`Error loading model ${glbPath}:`, error);
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          setTimeout(loadModel, 1500 * retryCount.current);
        } else {
          setLoadError(true);
        }
      }
    );
  }, [glbPath]);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  // Гироскоп
  useEffect(() => {
    if (!isGyroActive) return;
    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = Math.max(-1, Math.min(1, gamma / 90));
      const normBeta = Math.max(-1, Math.min(1, (beta - 45) / 90));
      rotateY.current = baseRotationY + normGamma * Math.PI * MOBILE_AMP_Y;
      const verticalLimit = normBeta >= 0 ? MOBILE_MAX_VERTICAL_UP : MOBILE_MAX_VERTICAL_DOWN;
      rotateX.current = normBeta * verticalLimit;
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

  // Слежение мышью (наклон всегда)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (e.clientX - centerX) / (window.innerWidth / 2);
      const normY = (e.clientY - centerY) / (window.innerHeight / 2);
      const limitedX = Math.max(-1, Math.min(1, normX));
      const limitedY = Math.max(-1, Math.min(1, normY));
      const verticalLimit = limitedY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;
      rotateY.current = baseRotationY + limitedX * Math.PI * DESKTOP_AMP_Y;
      rotateX.current = limitedY * verticalLimit;

      const isOverCard = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top && e.clientY <= rect.bottom;
      setHover(isOverCard);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [baseRotationY]);

  const resetRotation = () => {
    rotateX.current = -0.12 * Math.PI;
    rotateY.current = baseRotationY;
    setHover(false);
  };

  const baseSize = 160;

  return (
    <div
      ref={cardRef}
      className={`${className}`}
      style={{
        width: baseSize,
        height: baseSize,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        opacity: hidden ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      onMouseLeave={resetRotation}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick && !hidden) {
          const rect = cardRef.current.getBoundingClientRect();
          onClick(rect);
        }
      }}
    >
      {/* ВСЕГДА ПОКАЗЫВАЕМ ТЕКСТОВУЮ ЗАГЛУШКУ С НЕБОЛЬШИМ ФОНОМ */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-800/50 text-white text-lg font-semibold"
        style={{
          opacity: modelLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          zIndex: 2,
        }}
      >
        {label}
      </div>

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-800/50 text-red-400 text-xs p-2 text-center z-3">
          3D ошибка
        </div>
      )}

      {modelLoaded && (
        <Canvas
          camera={{ position: [0, 0.5, 3], fov: 45 }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Suspense fallback={null}>
            <Model
              url={glbPath}
              rotateXRef={rotateX}
              rotateYRef={rotateY}
              label={label}
              hoverRef={hoverRef}
              scale={miniScale}
            />
          </Suspense>
          <Environment preset="city" />
        </Canvas>
      )}
    </div>
  );
}