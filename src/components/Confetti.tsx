import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  speedY: number;
  speedX: number;
  shape: 'circle' | 'square' | 'triangle';
}

interface ConfettiProps {
  duration?: number; // duration in ms
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ duration = 4000, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const colors = [
    '#f97316', // orange-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#eab308', // yellow-500
    '#ec4899', // pink-500
    '#a855f7', // purple-500
    '#ffffff', // white
  ];

  const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

  useEffect(() => {
    // Generate initial particles
    const initialParticles: Particle[] = Array.from({ length: 120 }).map((_, idx) => ({
      id: idx,
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 100, // staggered start above viewport
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6, // 6px to 14px
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      speedY: Math.random() * 3.5 + 2.5, // speed down
      speedX: (Math.random() - 0.5) * 2, // drift sideways
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    setParticles(initialParticles);

    let animationFrameId: number;
    const startTime = Date.now();

    const update = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        if (onComplete) onComplete();
        return;
      }

      setParticles(prev =>
        prev.map(p => {
          let nextY = p.y + p.speedY;
          let nextX = p.x + p.speedX;
          
          if (nextY > window.innerHeight) {
            nextY = -20;
            nextX = Math.random() * window.innerWidth;
          }

          return {
            ...p,
            y: nextY,
            x: nextX,
            rotation: p.rotation + p.rotationSpeed,
          };
        })
      );

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {particles.map(p => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          backgroundColor: p.shape !== 'triangle' ? p.color : undefined,
          transform: `rotate(${p.rotation}deg)`,
          opacity: 0.85,
        };

        if (p.shape === 'circle') {
          style.borderRadius = '50%';
        } else if (p.shape === 'triangle') {
          style.width = 0;
          style.height = 0;
          style.backgroundColor = 'transparent';
          style.borderLeft = `${p.size / 2}px solid transparent`;
          style.borderRight = `${p.size / 2}px solid transparent`;
          style.borderBottom = `${p.size}px solid ${p.color}`;
        }

        return <div key={p.id} style={style} />;
      })}
    </div>
  );
};
