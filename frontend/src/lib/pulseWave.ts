/**
 * Sets up a pulse wave animation on a canvas element.
 * @param {HTMLElement} container - The container element to append the canvas to
 * @param {Object} options - Configuration options
 * @param {number} options.size - Size of the canvas (default: container width/height)
 * @param {string} options.dotColor - Color of the dots (default: "255, 255, 255")
 * @param {number} options.intensity - Animation intensity (default: 1)
 * @returns {Function} - Cleanup function to cancel animation
 */
interface PulseWaveOptions {
  size?: number;
  dotColor?: string;
  intensity?: number;
}

export function setupPulseWave(container: HTMLElement, options: PulseWaveOptions = {}) {
  if (!container) return () => {};
  
  const size = options.size || Math.min(container.offsetWidth, container.offsetHeight);
  const dotColor = options.dotColor || "255, 255, 255";  
  const intensity = options.intensity !== undefined ? options.intensity : 1;

  // Create and set up canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.className = "pulse-wave-canvas";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  let time = 0;
  let lastTime = 0;
  let animationId;
  
  // Create dots in concentric rings
  const dotRings = [
    { radius: size * 0.08, count: 6 },
    { radius: size * 0.16, count: 12 },
    { radius: size * 0.24, count: 18 },
    { radius: size * 0.32, count: 24 },
    { radius: size * 0.40, count: 30 }
  ];

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    time += deltaTime * 0.001;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${dotColor}, 0.9)`;
    ctx.fill();
    
    // Draw dots in concentric circles with wave effect
    dotRings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        
        // Calculate position with pulsing radius
        const radiusPulse = Math.sin(time * 2 - ringIndex * 0.4) * 3 * intensity;
        const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse);
        const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse);
        
        // Calculate opacity with wave effect
        const opacityWave = 0.4 + Math.sin(time * 2 - ringIndex * 0.4 + i * 0.2) * 0.6;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${opacityWave})`;
        ctx.fill();
      }
    });
    
    animationId = requestAnimationFrame(animate);
  }
  
  animationId = requestAnimationFrame(animate);
  
  // Return cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
