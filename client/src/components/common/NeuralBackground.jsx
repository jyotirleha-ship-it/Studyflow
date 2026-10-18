import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './neuralBackground.css';

const NeuralBackground = () => {
  const canvasRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Accessibility check: reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Determine mode based on route
    const path = location.pathname.toLowerCase();
    let mode = 'default';
    if (path === '/' || path.includes('dashboard')) mode = 'dashboard';
    else if (path.includes('analytics') || path.includes('dna')) mode = 'analytics';
    else if (path.includes('calendar')) mode = 'calendar';
    else if (path.includes('mentor')) mode = 'mentor';
    else if (path.includes('settings')) mode = 'settings';

    // Particle settings per mode
    const particleCount = prefersReducedMotion ? 20 : mode === 'dashboard' ? 65 : mode === 'analytics' ? 55 : mode === 'mentor' ? 70 : mode === 'settings' ? 25 : 45;
    const maxConnectionDist = mode === 'mentor' ? 140 : 110;
    const speedMultiplier = prefersReducedMotion ? 0.2 : mode === 'dashboard' ? 1.2 : mode === 'settings' ? 0.4 : 0.8;

    const mouse = {
      x: width / 2,
      y: height / 2,
      radius: 120,
      trail: []
    };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5 * speedMultiplier;
        this.vy = (Math.random() - 0.5) * 1.5 * speedMultiplier;
        this.radius = Math.random() * 2.5 + 1.2;
        this.color = mode === 'dashboard' ? '#6366f1' : mode === 'analytics' ? '#06b6d4' : mode === 'mentor' ? '#a855f7' : '#64748b';
      }

      update() {
        // Orbit effect for calendar
        if (mode === 'calendar') {
          const dx = this.x - width / 2;
          const dy = this.y - height / 2;
          const angle = Math.atan2(dy, dx) + 0.005;
          const dist = Math.sqrt(dx * dx + dy * dy);
          this.x = width / 2 + Math.cos(angle) * dist;
          this.y = height / 2 + Math.sin(angle) * dist;
        } else {
          this.x += this.vx;
          this.y += this.vy;
        }

        // Boundary wrap
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Influence from mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 3;
          this.y -= (dy / dist) * force * 3;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles = Array.from({ length: particleCount }, () => new Particle());

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!prefersReducedMotion) {
        mouse.trail.push({ x: e.clientX, y: e.clientY, life: 1.0 });
        if (mouse.trail.length > 25) mouse.trail.shift();
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw mouse glowing trail
      for (let i = 0; i < mouse.trail.length; i++) {
        const point = mouse.trail[i];
        point.life -= 0.04;
        if (point.life <= 0) {
          mouse.trail.splice(i, 1);
          i--;
          continue;
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 * point.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${point.life * 0.4})`;
        ctx.fill();
      }

      // Update & Draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Connect nearby particles (constellation lines)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            const opacity = (1 - dist / maxConnectionDist) * (mode === 'mentor' ? 0.35 : 0.2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

  return <canvas ref={canvasRef} className="neural-canvas" />;
};

export default NeuralBackground;
