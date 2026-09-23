import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { ArModel } from '../../types';
import { cutoutFromUrl } from '../../services/backgroundRemoval';

interface TryOnViewerProps {
  models: ArModel[];
  productName: string;
  initialModelId?: string;
  fallbackImage?: string;
  availableSizes?: string[];
  initialHeight?: number;
  initialWeight?: number;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export type BodyShape = 'hourglass' | 'pear' | 'apple' | 'inverted_triangle' | 'rectangle';

interface BodyShapeOption {
  id: BodyShape;
  name: string;
  icon: string;
  description: string;
  shoulderMult: number;
  torsoMult: number;
  scaleMod: number;
}

const BODY_SHAPES: BodyShapeOption[] = [
  {
    id: 'hourglass',
    name: 'Reloj de Arena',
    icon: '⏳',
    description: 'Hombros y caderas equilibrados, cintura definida',
    shoulderMult: 1.55,
    torsoMult: 2.15,
    scaleMod: 1.0,
  },
  {
    id: 'pear',
    name: 'Pera / Triángulo',
    icon: '🍐',
    description: 'Hombros más angostos y caderas más pronunciadas',
    shoulderMult: 1.48,
    torsoMult: 2.25,
    scaleMod: 1.04,
  },
  {
    id: 'apple',
    name: 'Manzana / Redondo',
    icon: '🍎',
    description: 'Torso amplio con caída más suelta y confortable',
    shoulderMult: 1.62,
    torsoMult: 2.1,
    scaleMod: 1.06,
  },
  {
    id: 'inverted_triangle',
    name: 'Triángulo Invertido',
    icon: '📐',
    description: 'Hombros y espalda más amplios que las caderas',
    shoulderMult: 1.68,
    torsoMult: 2.15,
    scaleMod: 1.02,
  },
  {
    id: 'rectangle',
    name: 'Rectangular / Recto',
    icon: '📏',
    description: 'Silueta recta y atlética de líneas continuas',
    shoulderMult: 1.52,
    torsoMult: 2.15,
    scaleMod: 0.98,
  },
];

const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

type ViewerStatus = 'loading' | 'ready' | 'no-body';

interface SilhouetteProfile {
  offsets: number[];
  widths: number[];
}

function computeSilhouette(
  shoulderW: number,
  hipW: number,
  bodyShape: BodyShape,
): SilhouetteProfile {
  const shapeMap: Record<BodyShape, { bust: number; waist: number; hip: number }> = {
    hourglass: { bust: 0.96, waist: 0.56, hip: 1.0 },
    pear: { bust: 0.86, waist: 0.62, hip: 1.1 },
    apple: { bust: 1.04, waist: 0.84, hip: 1.0 },
    inverted_triangle: { bust: 1.08, waist: 0.7, hip: 0.86 },
    rectangle: { bust: 0.94, waist: 0.78, hip: 0.98 },
  };
  const s = shapeMap[bodyShape] || shapeMap.hourglass;
  const maxW = Math.max(shoulderW, hipW);
  const bustW = (shoulderW * 0.5 + hipW * 0.5) * s.bust;
  const waistW = Math.max(40, maxW * s.waist);
  const hipFinal = Math.max(hipW * s.hip, shoulderW * 0.8);

  return {
    offsets: [0, 0.16, 0.34, 0.52, 0.72, 0.86, 1],
    widths: [
      shoulderW * 0.62,
      shoulderW,
      bustW,
      waistW,
      hipFinal,
      hipFinal * 1.03,
      hipFinal * 0.98,
    ],
  };
}

function silhouetteWidthAt(profile: SilhouetteProfile, t: number): number {
  const { offsets, widths } = profile;
  if (t <= offsets[0]) return widths[0];
  if (t >= offsets[offsets.length - 1]) return widths[widths.length - 1];
  for (let i = 1; i < offsets.length; i++) {
    if (t <= offsets[i]) {
      const t0 = offsets[i - 1];
      const t1 = offsets[i];
      const w0 = widths[i - 1];
      const w1 = widths[i];
      const f = (t - t0) / (t1 - t0);
      const smooth = f * f * (3 - 2 * f);
      return w0 + (w1 - w0) * smooth;
    }
  }
  return widths[widths.length - 1];
}

// Algoritmo antropométrico según altura, peso y tipo de cuerpo
function getRecommendedSizeFromMetrics(
  heightCm: number,
  weightKg: number,
  bodyShape: BodyShape,
  availableSizes: string[] = ['XS', 'S', 'M', 'L', 'XL'],
) {
  const hM = heightCm / 100;
  const bmi = weightKg / (hM * hM);

  const shape = BODY_SHAPES.find((s) => s.id === bodyShape) || BODY_SHAPES[0];

  // Estimación antropométrica adaptada por silueta
  let waistEst = Math.round(0.43 * heightCm + (bmi - 21.5) * 2.3);
  let bustEst = Math.round(0.53 * heightCm + (bmi - 21.5) * 2.0);
  let hipsEst = Math.round(0.58 * heightCm + (bmi - 21.5) * 2.5);

  if (bodyShape === 'hourglass') {
    waistEst -= 3;
    hipsEst += 2;
  } else if (bodyShape === 'pear') {
    bustEst -= 3;
    hipsEst += 5;
  } else if (bodyShape === 'apple') {
    waistEst += 4;
  } else if (bodyShape === 'inverted_triangle') {
    bustEst += 4;
    hipsEst -= 3;
  }

  const isNumeric = availableSizes.some((s) => /^\d+$/.test(s));

  let recommended = 'M';
  let scaleFactor = 1.0 * shape.scaleMod;

  if (isNumeric) {
    if (waistEst <= 64) {
      recommended = '34';
      scaleFactor = 0.88 * shape.scaleMod;
    } else if (waistEst <= 70) {
      recommended = '36';
      scaleFactor = 0.94 * shape.scaleMod;
    } else if (waistEst <= 76) {
      recommended = '38';
      scaleFactor = 1.0 * shape.scaleMod;
    } else if (waistEst <= 82) {
      recommended = '40';
      scaleFactor = 1.06 * shape.scaleMod;
    } else if (waistEst <= 88) {
      recommended = '42';
      scaleFactor = 1.14 * shape.scaleMod;
    } else {
      recommended = '44';
      scaleFactor = 1.22 * shape.scaleMod;
    }

    const matched = availableSizes.includes(recommended)
      ? recommended
      : availableSizes[0] || recommended;

    return {
      size: matched,
      bmi: Number(bmi.toFixed(1)),
      scaleFactor,
      bustEst,
      waistEst,
      hipsEst,
    };
  } else {
    if (bustEst <= 83 || waistEst <= 65) {
      recommended = 'XS';
      scaleFactor = 0.88 * shape.scaleMod;
    } else if (bustEst <= 89 || waistEst <= 71) {
      recommended = 'S';
      scaleFactor = 0.94 * shape.scaleMod;
    } else if (bustEst <= 95 || waistEst <= 77) {
      recommended = 'M';
      scaleFactor = 1.0 * shape.scaleMod;
    } else if (bustEst <= 102 || waistEst <= 84) {
      recommended = 'L';
      scaleFactor = 1.08 * shape.scaleMod;
    } else if (bustEst <= 110 || waistEst <= 92) {
      recommended = 'XL';
      scaleFactor = 1.16 * shape.scaleMod;
    } else {
      recommended = 'XXL';
      scaleFactor = 1.24 * shape.scaleMod;
    }

    const matched = availableSizes.includes(recommended)
      ? recommended
      : availableSizes.find((s) => s.toUpperCase() === recommended) || availableSizes[0] || recommended;

    return {
      size: matched,
      bmi: Number(bmi.toFixed(1)),
      scaleFactor,
      bustEst,
      waistEst,
      hipsEst,
    };
  }
}

export function TryOnViewer({
  models,
  productName,
  initialModelId,
  fallbackImage,
  availableSizes = ['XS', 'S', 'M', 'L', 'XL'],
  initialHeight = 165,
  initialWeight = 58,
  onClose,
  onCapture,
}: TryOnViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const statusRef = useRef<ViewerStatus>('loading');
  const modelRef = useRef<ArModel | null>(models[0] || null);
  const scaleRef = useRef(1);
  const hiddenRef = useRef(false);
  const drawRef = useRef<() => void>(() => {});
  const fitToSilhouetteRef = useRef(true);
  const showContourRef = useRef(true);

  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || models[0]?.id || '');
  const [overlayScale, setOverlayScale] = useState(1);
  const [adjusting, setAdjusting] = useState(false);
  const [containerAspect, setContainerAspect] = useState(4 / 3);

  // Estados de recomendación de talla y tipo de cuerpo
  const [userHeight, setUserHeight] = useState<number>(initialHeight || 165);
  const [userWeight, setUserWeight] = useState<number>(initialWeight || 58);
  const [bodyShape, setBodyShape] = useState<BodyShape>('hourglass');
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showFaceGuide, setShowFaceGuide] = useState(true);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [fitToSilhouette, setFitToSilhouette] = useState(true);
  const [showContour, setShowContour] = useState(true);

  const handleFitToSilhouette = (val: boolean) => {
    setFitToSilhouette(val);
    fitToSilhouetteRef.current = val;
  };

  const handleShowContour = (val: boolean) => {
    setShowContour(val);
    showContourRef.current = val;
  };

  const sizeResult = getRecommendedSizeFromMetrics(userHeight, userWeight, bodyShape, availableSizes);
  const currentShape = BODY_SHAPES.find((s) => s.id === bodyShape) || BODY_SHAPES[0];

  const [autoOverlay, setAutoOverlay] = useState<string | null>(null);
  const [isGeneratorReady, setIsGeneratorReady] = useState(false);
  const [progressPercent, setProgressPercent] = useState(10);
  const [stageMessage, setStageMessage] = useState('Iniciando generador de Realidad Aumentada...');

  // Animar progreso suavemente hacia un objetivo
  const targetPercentRef = useRef(10);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressPercent((current) => {
        if (current < targetPercentRef.current) {
          const next = current + Math.max(1, Math.floor((targetPercentRef.current - current) / 4));
          return Math.min(next, 100);
        }
        return current;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const updateProgress = (target: number, message: string) => {
    targetPercentRef.current = Math.min(100, Math.max(targetPercentRef.current, target));
    setStageMessage(message);
  };

  const updateStatus = (next: ViewerStatus) => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    setStatus(next);
  };

  const draw = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.restore();

    const points = landmarker.detectForVideo(video, performance.now()).landmarks?.[0];
    if (!points || points.length < 33) {
      updateStatus('no-body');
      setIsFaceCentered(false);
      return;
    }

    // Puntos faciales (MediaPipe Pose 0: Nariz, 7: Oreja Izq, 8: Oreja Der)
    const nose = points[0];
    const noseX = vw - nose.x * vw;
    const noseY = nose.y * vh;

    // Comprobar si el rostro está centrado en la zona ideal
    const faceTargetX = vw * 0.5;
    const faceTargetY = vh * 0.26;
    const faceRadiusX = vw * 0.16;
    const faceRadiusY = vh * 0.14;

    const dx = (noseX - faceTargetX) / faceRadiusX;
    const dy = (noseY - faceTargetY) / faceRadiusY;
    const centered = dx * dx + dy * dy <= 1.0;
    setIsFaceCentered(centered);

    // Dibujar guía visual de centrado de rostro
    if (showFaceGuide) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(faceTargetX, faceTargetY, faceRadiusX, faceRadiusY, 0, 0, Math.PI * 2);
      ctx.lineWidth = centered ? 3 : 2;
      ctx.strokeStyle = centered ? '#10B981' : 'rgba(6, 182, 212, 0.6)';
      ctx.setLineDash(centered ? [] : [6, 6]);
      ctx.shadowColor = centered ? '#10B981' : '#06B6D4';
      ctx.shadowBlur = centered ? 12 : 6;
      ctx.stroke();

      // Cruz de centrado tenue
      ctx.strokeStyle = centered ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(faceTargetX - 15, faceTargetY);
      ctx.lineTo(faceTargetX + 15, faceTargetY);
      ctx.moveTo(faceTargetX, faceTargetY - 15);
      ctx.lineTo(faceTargetX, faceTargetY + 15);
      ctx.stroke();

      ctx.restore();
    }

    const ls = points[11];
    const rs = points[12];
    const lh = points[23];
    const rh = points[24];
    const visible = (ls.visibility || 0) > 0.4 && (rs.visibility || 0) > 0.4;
    if (!visible) {
      updateStatus('no-body');
      return;
    }

    // Coordenadas en espacio espejado
    const mlsx = vw - ls.x * vw;
    const mrsx = vw - rs.x * vw;
    const lsy = ls.y * vh;
    const rsy = rs.y * vh;

    const mlhx = vw - lh.x * vw;
    const mrhx = vw - rh.x * vw;
    const lhy = lh.y * vh;
    const rhy = rh.y * vh;

    const shoulderCx = (mlsx + mrsx) / 2;
    const shoulderCy = (lsy + rsy) / 2;
    const shoulderW = Math.hypot(mrsx - mlsx, rsy - lsy) || 1;

    const hipCx = (mlhx + mrhx) / 2;
    const hipCy = (lhy + rhy) / 2;
    const hipW = Math.hypot(mrhx - mlhx, rhy - lhy) || 1;
    const torsoH = Math.max(60, Math.hypot(hipCx - shoulderCx, hipCy - shoulderCy));

    // Base del cuello anclada anatómicamente
    const neckY = noseY * 0.3 + shoulderCy * 0.7;

    // Ángulo de inclinación del torso en radianes
    const angle = Math.atan2(rsy - lsy, mrsx - mlsx);

    // Perfil de la silueta corporal según los bordes detectados
    const silhouette = computeSilhouette(shoulderW, hipW, bodyShape);

    // Dibujar guía de estructura corporal si está en modo ajuste
    if (hiddenRef.current) {
      ctx.save();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 10;

      // Línea de hombros
      ctx.beginPath();
      ctx.moveTo(mlsx, lsy);
      ctx.lineTo(mrsx, rsy);
      ctx.stroke();

      // Columna / Torso
      ctx.beginPath();
      ctx.moveTo(shoulderCx, neckY);
      ctx.lineTo(hipCx, hipCy);
      ctx.stroke();

      // Línea de caderas
      ctx.beginPath();
      ctx.moveTo(mlhx, lhy);
      ctx.lineTo(mrhx, rhy);
      ctx.stroke();

      // Contorno corporal detectado por puntos (bordes del cuerpo)
      if (showContourRef.current) {
        ctx.save();
        ctx.translate(shoulderCx, neckY);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.10)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 8;

        const STEPS = 24;
        ctx.beginPath();
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS;
          const y = t * torsoH;
          const hw = silhouetteWidthAt(silhouette, t) / 2;
          if (i === 0) ctx.moveTo(-hw, y);
          else ctx.lineTo(-hw, y);
        }
        for (let i = STEPS; i >= 0; i--) {
          const t = i / STEPS;
          const y = t * torsoH;
          const hw = silhouetteWidthAt(silhouette, t) / 2;
          ctx.lineTo(hw, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Puntos de referencia del contorno (hombros, busto, cintura, cadera)
        const anchorT: number[] = [0.16, 0.34, 0.52, 0.72];
        for (const t of anchorT) {
          const y = t * torsoH;
          const hw = silhouetteWidthAt(silhouette, t) / 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-hw, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(hw, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Puntos articulares holográficos
      for (const [px, py] of [
        [mlsx, lsy],
        [mrsx, rsy],
        [mlhx, lhy],
        [mrhx, rhy],
        [shoulderCx, neckY],
        [noseX, noseY],
      ]) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      updateStatus('ready');
      return;
    }

    const overlay = overlayImgRef.current;
    if (!overlay || !overlay.complete) {
      updateStatus('ready');
      return;
    }

    const aspect = overlay.naturalHeight / (overlay.naturalWidth || 1);
    // Factor de escala combinado (ajuste manual + escala según talla y tipo de cuerpo)
    const effScale = scaleRef.current * (sizeResult.scaleFactor || 1.0);
    const offsetY = (modelRef.current?.overlayOffsetY || 0) * torsoH;

    let w: number;
    let h: number;

    if (aspect > 1.35) {
      // Vestidos largos / conjuntos
      h = torsoH * currentShape.torsoMult * effScale;
      w = h / aspect;
    } else {
      // Tops, blusas, chaquetas, blazers
      w = shoulderW * currentShape.shoulderMult * effScale;
      h = w * aspect;
    }

    // Dibujo anatómico rotado y alineado con el cuello y torso.
    // En modo silueta, la prenda se deforma en tiras para ajustarse
    // al contorno corporal detectado (hombros → busto → cintura → cadera).
    ctx.save();
    ctx.translate(shoulderCx, neckY + offsetY);
    ctx.rotate(angle);

    if (fitToSilhouetteRef.current) {
      const SLICES = 32;
      const srcSliceH = overlay.naturalHeight / SLICES;
      const topDy = -h * 0.12;
      for (let i = 0; i < SLICES; i++) {
        const t0 = i / SLICES;
        const t1 = (i + 1) / SLICES;
        const tc = (t0 + t1) / 2;
        const sliceW = Math.max(4, silhouetteWidthAt(silhouette, tc) * effScale);
        const sy = overlay.naturalHeight * t0;
        const dy = topDy + h * t0;
        const dh = h / SLICES;
        ctx.drawImage(overlay, 0, sy, overlay.naturalWidth, srcSliceH, -sliceW / 2, dy, sliceW, dh);
      }
    } else {
      ctx.drawImage(overlay, -w / 2, -h * 0.12, w, h);
    }
    ctx.restore();

    // Bordes del cuerpo detectados (guía de alineación sobre la prenda)
    if (showContourRef.current) {
      ctx.save();
      ctx.translate(shoulderCx, neckY + offsetY);
      ctx.rotate(angle);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);

      const EDGE_STEPS = 24;
      ctx.beginPath();
      for (let i = 0; i <= EDGE_STEPS; i++) {
        const t = i / EDGE_STEPS;
        const y = t * torsoH;
        const hw = silhouetteWidthAt(silhouette, t) / 2;
        if (i === 0) ctx.moveTo(-hw, y);
        else ctx.lineTo(-hw, y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= EDGE_STEPS; i++) {
        const t = i / EDGE_STEPS;
        const y = t * torsoH;
        const hw = silhouetteWidthAt(silhouette, t) / 2;
        if (i === 0) ctx.moveTo(hw, y);
        else ctx.lineTo(hw, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    updateStatus('ready');
  };

  drawRef.current = draw;

  const tick = () => {
    drawRef.current();
    rafRef.current = requestAnimationFrame(tick);
  };

  // Inicialización del Motor de IA y Cámara
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    const startSystem = async () => {
      try {
        setError(null);
        updateProgress(20, 'Descargando motor de visión MediaPipe...');

        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM);

        updateProgress(45, 'Calibrando modelo postural y facial...');
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        updateProgress(70, 'Conectando sensor de cámara...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        updateProgress(85, 'Generando superposición AR...');

        // Si se necesita recorte automático de prenda
        if (fallbackImage && !models.some((m) => m.overlayImage)) {
          updateProgress(90, 'Segmentando prenda con IA...');
          const cutoutUrl = await cutoutFromUrl(fallbackImage, (p) => {
            const mapped = 85 + Math.round(p.percent * 0.12);
            updateProgress(mapped, 'Ajustando silueta de la prenda...');
          });
          if (!cancelled) {
            setAutoOverlay(cutoutUrl);
          }
        }

        updateProgress(100, '¡Probador AR listo!');
        setTimeout(() => {
          if (!cancelled) {
            setIsGeneratorReady(true);
            updateStatus('ready');
            tick();
          }
        }, 300);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.name === 'NotAllowedError'
              ? 'Permiso de cámara denegado. Permite el acceso a la cámara para probarte la ropa.'
              : 'No se pudo iniciar el probador AR. Verifica tu conexión y permisos de cámara.',
          );
        }
      }
    };

    startSystem();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [fallbackImage, models]);

  // Selección de Modelo / Overlay
  useEffect(() => {
    const model = models.find((m) => m.id === selectedModelId) || models[0] || null;
    modelRef.current = model;

    const overlaySrc = model?.overlayImage || autoOverlay;
    setHasOverlay(!!overlaySrc);

    if (!model) return;

    scaleRef.current = model.overlayScale || 1;
    setOverlayScale(model.overlayScale || 1);

    if (overlaySrc) {
      const img = new Image();
      img.onload = () => {
        overlayImgRef.current = img;
      };
      img.src = overlaySrc;
    } else {
      overlayImgRef.current = null;
    }
  }, [models, selectedModelId, autoOverlay]);

  useEffect(() => {
    scaleRef.current = overlayScale;
  }, [overlayScale]);

  useEffect(() => {
    hiddenRef.current = adjusting;
  }, [adjusting]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      setContainerAspect(video.videoWidth / video.videoHeight);
    }
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    onCapture(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Probador AR">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm md:text-base leading-tight">{productName}</p>
            <p className="text-xs text-primary-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Probador AR en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle de Guía Facial */}
          {isGeneratorReady && (
            <button
              onClick={() => setShowFaceGuide((g) => !g)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showFaceGuide
                  ? isFaceCentered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-primary-500/20 text-primary-300 border border-primary-500/50'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
              title="Activar/desactivar guía para centrar rostro"
            >
              <span>{isFaceCentered ? '✓ Rostro centrado' : '🎯 Centrar rostro'}</span>
            </button>
          )}

          {/* Botón rápido de Ajuste Corporal y Talla */}
          {isGeneratorReady && (
            <button
              onClick={() => setShowAdvisor((s) => !s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showAdvisor
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 ring-2 ring-primary-300'
                  : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20'
              }`}
              title="Ajustar medidas y tipo de cuerpo"
            >
              <span>{currentShape.icon} Talla {sizeResult.size}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Cerrar probador AR"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Visor central */}
      <div className="flex-1 relative flex items-center justify-center px-4 pb-2 pt-2">
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gray-950 shadow-2xl border border-white/10"
          style={{ aspectRatio: containerAspect }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            onLoadedMetadata={handleLoadedMetadata}
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Indicador sutil de Centrado Facial en la parte superior */}
          {isGeneratorReady && showFaceGuide && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-md transition-all ${
                  isFaceCentered
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/50'
                    : 'bg-gray-950/75 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isFaceCentered ? '✓ Rostro centrado' : 'Alinea tu rostro en el óvalo'}
              </span>
            </div>
          )}

          {/* Badge flotante HUD en la esquina de la cámara */}
          {isGeneratorReady && !showAdvisor && (
            <div
              onClick={() => setShowAdvisor(true)}
              className="absolute top-3 right-3 z-10 cursor-pointer bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white rounded-xl p-2.5 shadow-xl transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {sizeResult.size}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-200 leading-tight flex items-center gap-1">
                    <span>{currentShape.icon}</span> {currentShape.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {userHeight}cm · {userWeight}kg (Ajustar)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Panel interactivo flotante: Recomendador de Talla & Tipo de Cuerpo */}
          {isGeneratorReady && showAdvisor && (
            <div className="absolute top-3 left-3 right-3 z-20 bg-gray-950/95 backdrop-blur-2xl border border-primary-500/40 rounded-2xl p-4 shadow-2xl text-white space-y-3.5 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary-500/30 text-primary-300 flex items-center justify-center text-xs">
                    👗
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary-300">
                    Calibración de Silueta y Talla
                  </h4>
                </div>
                <button
                  onClick={() => setShowAdvisor(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-md text-xs"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Selector de Tipo de Cuerpo */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                  <span>Tipo de cuerpo</span>
                  <span className="text-[11px] text-primary-400 font-semibold">{currentShape.name}</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BODY_SHAPES.map((shape) => {
                    const isSelected = bodyShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setBodyShape(shape.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-primary-600/30 border-primary-400 text-white shadow-md ring-1 ring-primary-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                        }`}
                        title={`${shape.name}: ${shape.description}`}
                      >
                        <span className="text-base">{shape.icon}</span>
                        <span className="text-[9px] font-medium leading-tight text-center truncate w-full">
                          {shape.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 italic">{currentShape.description}</p>
              </div>

              {/* Controles de Altura y Peso */}
              <div className="grid grid-cols-2 gap-3">
                {/* Altura */}
                <div className="space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">Altura</span>
                    <span className="font-bold text-primary-400 font-mono">{userHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="200"
                    step="1"
                    value={userHeight}
                    onChange={(e) => setUserHeight(Number(e.target.value))}
                    className="w-full accent-primary-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>140 cm</span>
                    <span>200 cm</span>
                  </div>
                </div>

                {/* Peso */}
                <div className="space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">Peso</span>
                    <span className="font-bold text-primary-400 font-mono">{userWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    step="1"
                    value={userWeight}
                    onChange={(e) => setUserWeight(Number(e.target.value))}
                    className="w-full accent-primary-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>40 kg</span>
                    <span>120 kg</span>
                  </div>
                </div>
              </div>

              {/* Resultado y Diagnóstico de Talla */}
              <div className="bg-gradient-to-r from-primary-950/70 to-rose-950/70 border border-primary-500/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-primary-300 font-medium">Talla ideal adaptada a tu silueta</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Pecho ~{sizeResult.bustEst}cm · Cintura ~{sizeResult.waistEst}cm · Cadera ~{sizeResult.hipsEst}cm
                  </p>
                </div>
                <div className="text-center bg-gradient-to-tr from-primary-600 to-rose-500 text-white font-extrabold text-xl px-4 py-1.5 rounded-xl shadow-lg shadow-primary-500/40">
                  {sizeResult.size}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdvisor(false)}
                  className="w-full py-2 bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  ✓ Aplicar y ver prenda adaptada en cámara
                </button>
              </div>
            </div>
          )}

          {/* Guía postural cuando el cuerpo no se detecta completo */}
          {isGeneratorReady && status === 'no-body' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white text-xs md:text-sm px-4 py-2 rounded-full border border-white/20 shadow-lg whitespace-nowrap flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Aléjate un poco para que se vea tu torso completo
            </div>
          )}

          {/* Generador de Realidad Aumentada - Pantalla de carga con porcentaje */}
          {!isGeneratorReady && !error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-6">
              <div className="w-full max-w-xs text-center space-y-5">
                {/* Icono con ondas holográficas */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
                  <div className="absolute inset-1 rounded-full border border-primary-500/40 animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-600 via-rose-500 to-amber-400 p-[2px] shadow-xl shadow-primary-500/30">
                    <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Título y porcentaje */}
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide uppercase">Generador AR</h3>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold bg-gradient-to-r from-primary-400 via-rose-400 to-amber-300 bg-clip-text text-transparent font-mono">
                      {progressPercent}
                    </span>
                    <span className="text-lg font-bold text-primary-400">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 min-h-[1.5rem] transition-all duration-300">
                    {stageMessage}
                  </p>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-white/10 rounded-full h-2.5 p-0.5 overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-rose-500 to-amber-400 transition-all duration-200 ease-out shadow-lg"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal de error */}
          {error && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/95 p-6 text-center">
              <div className="max-w-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">No se pudo iniciar el probador</h3>
                <p className="text-gray-300 text-xs leading-relaxed">{error}</p>
                <button onClick={onClose} className="btn btn-primary w-full py-2.5 text-sm">
                  Entendido / Volver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles inferiores */}
      <div className="px-4 py-4 space-y-3 bg-gray-950/80 border-t border-white/10 backdrop-blur-md">
        {models.length > 1 && (
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="text-gray-900">
                {m.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2 text-white text-xs flex-wrap">
          <button
            onClick={() => handleFitToSilhouette(!fitToSilhouette)}
            disabled={!hasOverlay || !isGeneratorReady}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
              fitToSilhouette
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
            }`}
            title="Deformar la prenda para ajustarla al contorno corporal detectado"
          >
            {fitToSilhouette ? '✓ Ajuste a silueta' : 'Ajuste a silueta'}
          </button>
          <button
            onClick={() => handleShowContour(!showContour)}
            disabled={!isGeneratorReady}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
              showContour
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
            }`}
            title="Mostrar los puntos del contorno corporal detectados por la cámara"
          >
            {showContour ? '✓ Bordes del cuerpo' : 'Bordes del cuerpo'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-white text-xs">
          <span className="font-medium text-gray-300">Escala fina</span>
          <input
            type="range"
            min="0.6"
            max="2"
            step="0.05"
            value={overlayScale}
            onChange={(e) => setOverlayScale(Number(e.target.value))}
            className="flex-1 accent-primary-500 cursor-pointer"
            disabled={!hasOverlay || !isGeneratorReady}
          />
          <span className="font-mono text-primary-300 font-semibold">{overlayScale.toFixed(2)}x</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCapture}
            disabled={!isGeneratorReady}
            className="btn btn-primary flex-1 py-3 text-sm font-semibold shadow-lg shadow-primary-600/30"
          >
            <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capturar foto
          </button>
          <button
            onClick={() => setAdjusting((a) => !a)}
            disabled={!isGeneratorReady}
            className="btn btn-secondary flex-1 py-3 text-sm font-medium"
          >
            {adjusting ? 'Mostrar prenda' : 'Esqueleto AR'}
          </button>
          <button onClick={onClose} className="btn btn-secondary px-5 text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
