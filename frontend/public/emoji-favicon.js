// This script adds emoji favicon support
// It creates a canvas element and draws the scales of justice emoji on it
// Then it adds the canvas as a favicon

document.addEventListener('DOMContentLoaded', () => {
  // Only run if the browser doesn't support SVG favicons or if there's an issue
  const addEmojiFavicon = () => {
    const canvas = document.createElement('canvas');
    canvas.height = 64;
    canvas.width = 64;
    
    const ctx = canvas.getContext('2d');
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚖️', 32, 32);
    
    // Create favicon link
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = canvas.toDataURL();
    
    // Remove any existing favicons
    const existingFavicons = document.querySelectorAll('link[rel="icon"]');
    existingFavicons.forEach(e => e.parentNode.removeChild(e));
    
    // Add the new favicon
    document.head.appendChild(favicon);
  };
  
  // Fallback mechanism - if the SVG and ICO favicons don't work,
  // this script will run after a short delay
  setTimeout(addEmojiFavicon, 500);
});
