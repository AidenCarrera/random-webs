export type PaletteName =
  "Neon" | "Solar" | "Forest" | "Ocean" | "Spectrum" | "Monochrome";

export type FractalMode = "mandelbrot" | "julia";

export type ComplexPoint = [real: number, imaginary: number];

export interface Coordinates {
  r: number;
  i: number;
}

export interface Landmark {
  name: string;
  description: string;
  cx: number;
  cy: number;
  zoom: number;
}

export interface GpuFractalRenderer {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  uniforms: {
    resolution: WebGLUniformLocation;
    centerX: WebGLUniformLocation;
    centerY: WebGLUniformLocation;
    pixelScaleX: WebGLUniformLocation;
    pixelScaleY: WebGLUniformLocation;
    maxIterations: WebGLUniformLocation;
    palette: WebGLUniformLocation;
    mode: WebGLUniformLocation;
    juliaX: WebGLUniformLocation;
    juliaY: WebGLUniformLocation;
  };
}
