'use client';

/**
 * ControllerModel3D — interactive 3D view of the DualSense shell.
 *
 * Model: `dualsense.glb` from the DualSense Tester project (MIT / daidr).
 * It is compressed with `EXT_meshopt_compression`, so the meshopt decoder MUST
 * be registered — otherwise the loader fails with a vague error.
 *
 * `three` is imported lazily inside the effect: the library never reaches the
 * server bundle and is only downloaded when this view is actually opened.
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { useTranslation } from '@/i18n';

export interface ControllerModel3DProps {
  /** Public URL of the glb file. */
  modelUrl?: string;
  /** Slow idle rotation (paused while dragging or when orientation is active). */
  autoSpin?: boolean;
  /** Orientation quaternion { x, y, z, w } from physical gyroscope / WebHID */
  orientation?: { x: number; y: number; z: number; w: number } | null;
  className?: string;
}

const BG_COLOR = 0x0b0f16;
/** Final bounding-box size of the model in world units. */
const TARGET_SIZE = 2.2;
const SPIN_SPEED = 0.0025;

export default function ControllerModel3D({
  modelUrl = '/models/dualsense.glb',
  autoSpin = true,
  orientation = null,
  className,
}: ControllerModel3DProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orientationRef = useRef(orientation);
  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  const [progress, setProgress] = useState<number | null>(0);
  const [ready, setReady] = useState(false);
  /** i18n key of the failure, not the message — keeps it in sync with the locale. */
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    const boot = async () => {
      const [THREE, gltfModule, meshoptModule] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      ]);
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(BG_COLOR);

      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0.35, 3.4);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
      addLight(scene, THREE, 0xffffff, 2.4, [2.5, 3.5, 3]);
      addLight(scene, THREE, 0xc8dcff, 1.1, [-3, 1, 2]);
      addLight(scene, THREE, 0xffffff, 1.4, [0, -1.5, -3]);

      const spinGroup = new THREE.Group();
      const dragGroup = new THREE.Group();
      spinGroup.add(dragGroup);
      scene.add(spinGroup);

      const resize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      /* ---- drag to rotate ---- */
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let rotX = 0;
      let rotY = 0;

      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        rotY += (event.clientX - lastX) * 0.008;
        rotX = clamp(rotX + (event.clientY - lastY) * 0.006, -0.9, 0.9);
        lastX = event.clientX;
        lastY = event.clientY;
      };
      const onPointerUp = () => {
        dragging = false;
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);

      /* ---- load the model with meshopt decoder ready ---- */
      if (meshoptModule.MeshoptDecoder && meshoptModule.MeshoptDecoder.ready) {
        try {
          await meshoptModule.MeshoptDecoder.ready;
        } catch (err) {
          console.warn('MeshoptDecoder.ready failed:', err);
        }
      }

      const loader = new gltfModule.GLTFLoader().setMeshoptDecoder(
        meshoptModule.MeshoptDecoder,
      );

      const handleGltfSuccess = (gltf: any) => {
        if (disposed) return;
        const root = gltf.scene;
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center on the origin, then normalise the scale.
        root.position.sub(center);
        const max = Math.max(size.x, size.y, size.z);
        if (max > 0) root.scale.setScalar(TARGET_SIZE / max);

        dragGroup.add(root);
        setProgress(null);
        setReady(true);
        resize();
      };

      const handleGltfProgress = (event: ProgressEvent) => {
        if (disposed) return;
        if (event.lengthComputable && event.total > 0) {
          setProgress(event.loaded / event.total);
        } else {
          setProgress(null);
        }
      };

      loader.load(
        modelUrl,
        handleGltfSuccess,
        handleGltfProgress,
        () => {
          if (disposed) return;
          // Fallback retry with /gamepad/models/dualsense.glb if initial path failed
          if (modelUrl !== '/gamepad/models/dualsense.glb') {
            loader.load(
              '/gamepad/models/dualsense.glb',
              handleGltfSuccess,
              handleGltfProgress,
              () => {
                if (!disposed) setErrorKey('gamepad.model3d.loadError');
              },
            );
          } else {
            setErrorKey('gamepad.model3d.loadError');
          }
        },
      );

      /* ---- render loop ---- */
      let raf = 0;
      const targetQuat = new THREE.Quaternion();
      const frame = () => {
        const curOri = orientationRef.current;
        if (curOri && (curOri.x !== 0 || curOri.y !== 0 || curOri.z !== 0 || curOri.w !== 1)) {
          targetQuat.set(curOri.x, curOri.y, curOri.z, curOri.w);
          dragGroup.quaternion.slerp(targetQuat, 0.28);
        } else {
          if (autoSpin && !dragging) spinGroup.rotation.y += SPIN_SPEED;
          dragGroup.rotation.set(rotX, rotY, 0);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      frame();

      teardown = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        disposeScene(scene);
        renderer.dispose();
        try {
          renderer.forceContextLoss();
        } catch {
          /* context already gone */
        }
      };
    };

    boot().catch(() => {
      if (!disposed) setErrorKey('gamepad.model3d.unsupported');
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [modelUrl, autoSpin]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }}
      />

      {!ready && !errorKey && (
        <div className="absolute inset-0 grid place-items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-2.5">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            <p className="text-[11px] font-medium text-slate-400">
              {t('gamepad.model3d.loading')}
              {progress !== null && ` — ${Math.round(progress * 100)}%`}
            </p>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{
                  width: progress === null ? '35%' : `${Math.max(4, progress * 100)}%`,
                  transition: 'width 120ms linear',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {errorKey && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">{t(errorKey)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type ThreeModule = typeof import('three');

function addLight(
  scene: import('three').Scene,
  THREE: ThreeModule,
  color: number,
  intensity: number,
  position: [number, number, number],
) {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(...position);
  scene.add(light);
}

function disposeScene(scene: import('three').Scene) {
  scene.traverse((object) => {
    const mesh = object as import('three').Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material as import('three').Material | import('three').Material[] | undefined;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material?.dispose?.();
  });
  scene.clear();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
