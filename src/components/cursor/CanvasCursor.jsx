'use client';
import useCanvasCursor from './useCanvasCursor';

const CanvasCursor = () => {
  useCanvasCursor();
  return (
    <canvas
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
      id="canvas-cursor"
    />
  );
};

export default CanvasCursor;
