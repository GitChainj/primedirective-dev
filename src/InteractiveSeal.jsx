import { useState, useEffect, useRef } from "react";

/*
  THE SEAL — Interactive Parallax Component
  primedirective.dev
  
  Uses 12 designer layers (png-01.png through png-12.png)
  Layer 01 = AI Sparkle (innermost, most stable)
  Layer 12 = Outer ring (outermost, moves most)
  
  REVERSED PARALLAX: The sparkle is the anchor.
  Everything around it moves. The Truths are immovable.
  
  Mobile: responds to device tilt via DeviceOrientation API
  Desktop: responds to mouse position
*/

const LAYERS = [
  { file: "png-02.png", depth: -2.5 },
  { file: "png-03.png", depth: -2.0 },
  { file: "png-04.png", depth: -1.5 },
  { file: "png-05.png", depth: -1.0 },
  { file: "png-06.png", depth: -0.5 },
  { file: "png-01.png", depth:  0.0 },
  { file: "png-07.png", depth:  0.5 },
  { file: "png-08.png", depth:  1.0 },
  { file: "png-09.png", depth:  1.5 },
  { file: "png-10.png", depth:  2.0 },
  { file: "png-11.png", depth:  2.5 },
  { file: "png-12.png", depth:  3.0 },
];

const sealCSS = `
.seal-parallax-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.seal-parallax-viewport {
  width: 380px;
  height: 380px;
  position: relative;
}

.seal-parallax-layer {
  position: absolute;
  top: -20px;
  left: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  will-change: transform;
  pointer-events: none;
}

.seal-parallax-layer img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

@media (max-width: 768px) {
  .seal-parallax-viewport {
    width: 300px;
    height: 300px;
  }
}
`;

export default function InteractiveSeal() {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const driftActiveRef = useRef(true);
  const mouseLeaveTimerRef = useRef(null);

  useEffect(() => {
    const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const smoothUpdate = (ts) => {
      if (driftActiveRef.current) {
        targetRef.current = {
          x: 3.0 * Math.sin(ts * 0.0008),
          y: 2.5 * Math.sin(ts * 0.0006 + 1.2),
        };
      }
      setTiltX((prev) => prev + (targetRef.current.x - prev) * 0.06);
      setTiltY((prev) => prev + (targetRef.current.y - prev) * 0.06);
      rafRef.current = requestAnimationFrame(smoothUpdate);
    };
    rafRef.current = requestAnimationFrame(smoothUpdate);

    const handleOrientation = (e) => {
      if (e.gamma === null && e.beta === null) return;
      driftActiveRef.current = false;
      const x = Math.max(-15, Math.min(15, e.gamma || 0));
      const y = Math.max(-15, Math.min(15, (e.beta || 0) - 45));
      targetRef.current = { x, y };
    };

    const handleMouse = (e) => {
      if (!containerRef.current) return;
      if (mouseLeaveTimerRef.current) clearTimeout(mouseLeaveTimerRef.current);
      driftActiveRef.current = false;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDist = Math.max(rect.width, rect.height);
      const x = ((e.clientX - centerX) / maxDist) * 10;
      const y = ((e.clientY - centerY) / maxDist) * 10;
      targetRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      mouseLeaveTimerRef.current = setTimeout(() => {
        driftActiveRef.current = true;
      }, 2000);
    };

    if (mobile) {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const requestPerm = () => {
          DeviceOrientationEvent.requestPermission()
            .then((response) => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                driftActiveRef.current = false;
              }
            })
            .catch(console.warn);
          window.removeEventListener('touchstart', requestPerm);
        };
        window.addEventListener('touchstart', requestPerm, { once: true });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } else {
      window.addEventListener('mousemove', handleMouse);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mouseLeaveTimerRef.current) clearTimeout(mouseLeaveTimerRef.current);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="seal-parallax-container" ref={containerRef}>
      <style>{sealCSS}</style>
      <div className="seal-parallax-viewport">
        {LAYERS.map((layer, i) => (
          <div
            className="seal-parallax-layer"
            key={layer.file}
            style={{
              zIndex: i + 1,
              transform: `translate(${tiltX * layer.depth}px, ${tiltY * layer.depth}px)`,
            }}
          >
            <img
              src={`/downloads/${layer.file}`}
              alt=""
              loading={i > 9 ? "eager" : "lazy"}
              draggable="false"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
