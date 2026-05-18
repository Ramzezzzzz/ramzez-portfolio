import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Environment, Text } from '@react-three/drei';
import { X } from 'lucide-react';
import * as THREE from 'three';

const DESKTOP_AMP_Y = 0.19;
const MAX_VERTICAL_UP = Math.PI * 0.15;
const MAX_VERTICAL_DOWN = Math.PI * 0.29;
const MOBILE_AMP_Y = 0.5;
const MOBILE_MAX_VERTICAL_UP = Math.PI * 0.8;
const MOBILE_MAX_VERTICAL_DOWN = Math.PI * 0.5;

function Model({ url, rotateXRef, rotateYRef, label, hoverRef, active, mobileActive, activeRef, scale }) {
  const originalScene = useLoader(GLTFLoader, url);
  const group = useRef();
  const clonedScene = useMemo(() => originalScene.scene.clone(true), [originalScene]);

  const targetOpacityRef = useRef(0.35);
  const currentOpacityRef = useRef(0.35);
  const textOpacityRef = useRef(1);

  useEffect(() => {
    if (active) {
      targetOpacityRef.current = 0.3;
      textOpacityRef.current = 0;
    } else if (hoverRef.current || mobileActive) {
      targetOpacityRef.current = 0.8;
      textOpacityRef.current = 1;
    } else {
      targetOpacityRef.current = 0.35;
      textOpacityRef.current = 1;
    }
  }, [hoverRef.current, active, mobileActive]);

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

    if (group.current && !activeRef.current) {
      group.current.rotation.x += (rotateXRef.current - group.current.rotation.x) * delta * 8;
      group.current.rotation.y += (rotateYRef.current - group.current.rotation.y) * delta * 8;
    } else if (group.current && activeRef.current) {
      group.current.rotation.x += (0 - group.current.rotation.x) * delta * 8;
      group.current.rotation.y += (0 - group.current.rotation.y) * delta * 8;
    }
  });

  const showText = !active;

  return (
    <group ref={group} dispose={null}>
      <primitive object={clonedScene} scale={scale} position={[0, 0, 0]} />
      {showText && (
        <>
          <Text
            position={[0, 0.1, 0.25]}
            fontSize={0.26}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={hoverRef.current || mobileActive ? 0.02 : 0}
            outlineColor="#ff0000"
            fillOpacity={textOpacityRef.current}
          >
            {label}
          </Text>
          {(hoverRef.current || mobileActive) && (
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
          )}
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
  activeGlbPath,
  label,
  baseRotationY = 0,
  className = '',
  isGyroActive = false,
  active = false,
  mobileActive = false,
  onClick,
  onClose,
  activeWidth = '80vw',
  activeHeight = '80vh',
  mobileActiveWidth = '90vw',
  mobileActiveHeight = '90vh',
  miniScale = 0.8,
  activeModelScale,
  children,
}) {
  const [hover, setHover] = useState(false);
  const [hoverOnText, setHoverOnText] = useState(false);
  const cardRef = useRef(null);
  const textAreaRef = useRef(null);

  const miniRotateX = useRef(-0.12 * Math.PI);
  const miniRotateY = useRef(baseRotationY);
  const portalRotateX = useRef(0);
  const portalRotateY = useRef(0);

  const hoverRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { hoverRef.current = hover || hoverOnText; }, [hover, hoverOnText]);

  // Гироскоп и слежение за мышью (оставляем как было, без изменений)
  useEffect(() => {
    if (!isGyroActive || active) return;
    const handleOrientation = (event) => {
      if (activeRef.current) return;
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = Math.max(-1, Math.min(1, gamma / 90));
      const normBeta = Math.max(-1, Math.min(1, (beta - 45) / 90));
      miniRotateY.current = baseRotationY + normGamma * Math.PI * MOBILE_AMP_Y;
      const verticalLimit = normBeta >= 0 ? MOBILE_MAX_VERTICAL_UP : MOBILE_MAX_VERTICAL_DOWN;
      miniRotateX.current = normBeta * verticalLimit;
    };
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permission => {
        if (permission === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isGyroActive, baseRotationY, active]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!cardRef.current || activeRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      const isOverCard = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (textAreaRef.current) {
        const textRect = textAreaRef.current.getBoundingClientRect();
        const isOverText = e.clientX >= textRect.left && e.clientX <= textRect.right &&
                           e.clientY >= textRect.top && e.clientY <= textRect.bottom;
        setHoverOnText(isOverText);
      }

      if (isOverCard) {
        if (hoverOnText) {
          miniRotateY.current += (0 - miniRotateY.current) * 0.4;
          miniRotateX.current += (0 - miniRotateX.current) * 0.4;
        } else {
          const verticalLimit = normY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;
          miniRotateY.current = baseRotationY + Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
          miniRotateX.current = Math.max(-1, Math.min(1, normY)) * verticalLimit;
        }
      } else {
        const verticalLimit = normY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;
        miniRotateY.current = baseRotationY + Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
        miniRotateX.current = Math.max(-1, Math.min(1, normY)) * verticalLimit;
      }
      setHover(isOverCard);
    };
    const handleGlobalMouseLeave = () => {
      setHover(false);
      setHoverOnText(false);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, [baseRotationY, active, hoverOnText]);

  const handleTouchMove = (e) => {
    if (isGyroActive || activeRef.current) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (textAreaRef.current) {
        const textRect = textAreaRef.current.getBoundingClientRect();
        const isOverText = touch.clientX >= textRect.left && touch.clientX <= textRect.right &&
                           touch.clientY >= textRect.top && touch.clientY <= textRect.bottom;
        setHoverOnText(isOverText);
      }
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (touch.clientX - centerX) / (rect.width / 2);
      const normY = (touch.clientY - centerY) / (rect.height / 2);
      if (hoverOnText) {
        miniRotateY.current += (0 - miniRotateY.current) * 0.4;
        miniRotateX.current += (0 - miniRotateX.current) * 0.4;
      } else {
        const verticalLimit = normY >= 0 ? MAX_VERTICAL_UP : MAX_VERTICAL_DOWN;
        miniRotateY.current = baseRotationY + Math.max(-1, Math.min(1, normX)) * Math.PI * DESKTOP_AMP_Y;
        miniRotateX.current = Math.max(-1, Math.min(1, normY)) * verticalLimit;
      }
      setHover(true);
    }
  };

  const resetRotation = () => {
    miniRotateX.current = -0.12 * Math.PI;
    miniRotateY.current = baseRotationY;
    setHover(false);
    setHoverOnText(false);
  };

  const isMobileDevice = window.innerWidth < 768;
  const baseSize = mobileActive ? 200 : 160;

  const parseSize = (val, viewportSize, base) => {
    if (typeof val === 'string') {
      if (val.endsWith('vw')) return (parseFloat(val) / 100) * window.innerWidth;
      if (val.endsWith('vh')) return (parseFloat(val) / 100) * window.innerHeight;
      if (val.endsWith('px')) return parseFloat(val);
      if (val.endsWith('%')) return (parseFloat(val) / 100) * viewportSize;
    }
    return parseFloat(val) || base;
  };

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const expandedWidth = active ? parseSize(isMobileDevice ? mobileActiveWidth : activeWidth, viewportW, baseSize) : baseSize;
  const expandedHeight = active ? parseSize(isMobileDevice ? mobileActiveHeight : activeHeight, viewportH, baseSize) : baseSize;

  let computedActiveScale = activeModelScale;
  if (computedActiveScale === undefined && active) {
    computedActiveScale = Math.min(expandedWidth, expandedHeight) / baseSize;
  }

  const miniature = (
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
        transition: 'opacity 0.4s',
        opacity: active ? 0 : 1,
        pointerEvents: active ? 'none' : 'auto',
      }}
      onMouseEnter={() => !active && !mobileActive && setHover(true)}
      onMouseLeave={resetRotation}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetRotation}
      onClick={onClick}
    >
      <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model
            url={glbPath}
            rotateXRef={miniRotateX}
            rotateYRef={miniRotateY}
            label={label}
            hoverRef={hoverRef}
            active={false}
            mobileActive={mobileActive}
            activeRef={activeRef}
            scale={miniScale}
          />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
      <div ref={textAreaRef} style={{ position: 'absolute', top: '30%', left: '20%', width: '60%', height: '40%', zIndex: 5 }} />
    </div>
  );

  const activeModelUrl = activeGlbPath || glbPath;
  const portal = active && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: expandedWidth,
        height: expandedHeight,
        transform: 'translate(-50%, -50%)',
        zIndex: 40,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
    >
      <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model
            url={activeModelUrl}
            rotateXRef={portalRotateX}
            rotateYRef={portalRotateY}
            label={label}
            hoverRef={hoverRef}
            active={true}
            mobileActive={false}
            activeRef={activeRef}
            scale={computedActiveScale !== undefined ? computedActiveScale : 1}
          />
        </Suspense>
        <Environment preset="city" />
      </Canvas>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
      >
        <div className="pointer-events-auto" style={{ fontSize: '16px', lineHeight: 1.5 }}>
          {children}
        </div>
      </motion.div>
      <button
        onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
        style={{ pointerEvents: 'auto' }}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );

  return (
    <>
      {miniature}
      <AnimatePresence>{portal}</AnimatePresence>
    </>
  );
}