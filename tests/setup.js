// Test setup file
import { vi } from 'vitest';

// Mock Canvas API for testing
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  createImageData: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  canvas: {
    width: 800,
    height: 600
  }
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock WebSocket for network tests
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock Audio API
global.Audio = vi.fn(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  volume: 1,
  currentTime: 0,
  duration: 0,
  paused: true,
  ended: false
}));

// Mock performance.now for timing tests
global.performance = {
  now: vi.fn(() => Date.now())
};