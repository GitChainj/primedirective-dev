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
  { file: "png-12.png", depth: 4.0 },
  { file: "png-11.png", depth: 3.5 },
  { file: "png-10.png", depth: 3.0 },
  { file: "png-09.png", depth: 2.6 },
  { file: "png-08.png", depth: 2.2 },
  { file: "png-07.png", depth: 1.8 },
  { file: "png-06.png", depth: 1.4 },
  { file: "png-05.png", depth: 1.0 },
  { file: "png-04.png", depth: 0.7 },
  { file: "png-03.png", depth: 0.4 },
  { file: "png-02.png", depth: 0.15 },
  { file: "png-01.png", depth: 0.0 },
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

.seal-parallax-hint {
  color: rgba(255,255,255,0.3);
  font-size: 0.7rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  margin-top: 1rem;
  letter-spacing: 0.1em;
  text-align: center;
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
  const [isMobile, setIsMobile] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(mobile);

    const smoothUpdate = () => {
      setTiltX((prev) => prev + (targetRef.current.x - prev) * 0.06);
      setTiltY((prev) => prev + (targetRef.current.y - prev) * 0.06);
      rafRef.current = requestAnimationFrame(smoothUpdate);
    };
    rafRef.current = requestAnimationFrame(smoothUpdate);

    const handleOrientation = (e) => {
      if (e.gamma === null && e.beta === null) return;
      const x = Math.max(-15, Math.min(15, e.gamma || 0));
      const y = Math.max(-15, Math.min(15, (e.beta || 0) - 45));
      targetRef.current = { x, y };
      if (!permissionGranted) setPermissionGranted(true);
    };

    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDist = Math.max(rect.width, rect.height);
      const x = ((e.clientX - centerX) / maxDist) * 10;
      const y = ((e.clientY - centerY) / maxDist) * 10;
      targetRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    if (mobile) {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const requestPerm = () => {
          DeviceOrientationEvent.requestPermission()
            .then((response) => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                setPermissionGranted(true);
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
      <div className="seal-parallax-hint">
        {isMobile
          ? (permissionGranted ? "Tilt your device" : "Tap, then tilt your device")
          : "Move your mouse"
        }
      </div>
    </div>
  );
}
