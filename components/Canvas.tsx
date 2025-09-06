import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

interface CanvasProps {
  disabled?: boolean;
  linesDrawn: number;
  lineLimit: number;
  onLineEnd: () => void;
}

export interface CanvasHandle {
  clear: () => void;
  getDrawing: () => string;
  isEmpty: () => boolean;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ disabled = false, linesDrawn, lineLimit, onLineEnd }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  
  const isDrawingDisabled = disabled || linesDrawn >= lineLimit;

  const getCoords = (e: MouseEvent | TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return null;
  };

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDrawingDisabled) return;
    const coords = getCoords(e);
    if (coords) {
      setIsDrawing(true);
      lastPosition.current = coords;
      setHasDrawn(true);
    }
  }, [isDrawingDisabled]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || isDrawingDisabled) return;
    const coords = getCoords(e);
    if (coords && lastPosition.current) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        lastPosition.current = coords;
      }
    }
    e.preventDefault();
  }, [isDrawing, isDrawingDisabled]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      onLineEnd();
    }
    setIsDrawing(false);
    lastPosition.current = null;
  }, [isDrawing, onLineEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    });
    observer.observe(canvas);

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    return () => {
      observer.disconnect();
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    },
    getDrawing() {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl.split(',')[1]; // Return only the base64 part
    },
    isEmpty() {
      return !hasDrawn;
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`bg-white w-full h-full touch-none ${isDrawingDisabled ? 'cursor-not-allowed bg-slate-200' : 'cursor-crosshair'}`}
    />
  );
});

export default Canvas;