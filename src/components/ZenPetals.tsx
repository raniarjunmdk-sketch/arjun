import React, { useEffect, useRef } from 'react';
import { ThemeConfig } from '../types/game';

interface ZenPetalsProps {
  theme: ThemeConfig;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  angularSpeed: number;
  opacity: number;
  oscillation: number;
  oscSpeed: number;
}

export const ZenPetals: React.FC<ZenPetalsProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count: restrained, elegant, calm
    const count = window.innerWidth < 640 ? 18 : 28;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 5 + Math.random() * 9,
        speedY: 0.3 + Math.random() * 0.7,
        speedX: (Math.random() - 0.5) * 0.4,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 0.15 + Math.random() * 0.35,
        oscillation: Math.random() * Math.PI * 2,
        oscSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.oscillation += p.oscSpeed;
        p.y += p.speedY * 60 * dt;
        p.x += (p.speedX + Math.sin(p.oscillation) * 0.5) * 60 * dt;
        p.angle += p.angularSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;

        // Render shape based on petalType
        if (theme.petalType === 'cherry') {
          ctx.fillStyle = '#e07a8b';
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.6, p.size * 0.8, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.8, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
          ctx.fill();
        } else if (theme.petalType === 'bamboo') {
          ctx.fillStyle = theme.id === 'washi-sumi' ? '#2c3531' : '#34d399';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.4, p.size * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (theme.petalType === 'lotus') {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Stardust / cosmic motes
          ctx.fillStyle = '#67e8f9';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
      aria-hidden="true"
    />
  );
};
