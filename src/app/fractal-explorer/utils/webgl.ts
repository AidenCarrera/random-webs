import { MAX_SHADER_ITERATIONS } from "../constants";
import type { GpuFractalRenderer } from "../types";

const FRACTAL_VERTEX_SHADER = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRACTAL_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 u_resolution;
uniform vec2 u_centerX;
uniform vec2 u_centerY;
uniform vec2 u_pixelScaleX;
uniform vec2 u_pixelScaleY;
uniform int u_maxIterations;
uniform int u_palette;
uniform int u_mode;
uniform vec2 u_juliaX;
uniform vec2 u_juliaY;

out vec4 outColor;

const float DS_SPLITTER = 4097.0;

vec2 dsNormalize(float hi, float lo) {
  float s = hi + lo;
  float e = lo - (s - hi);
  return vec2(s, e);
}

vec2 dsAdd(vec2 a, vec2 b) {
  float s = a.x + b.x;
  float v = s - a.x;
  float e = (a.x - (s - v)) + (b.x - v) + a.y + b.y;
  return dsNormalize(s, e);
}

vec2 dsSub(vec2 a, vec2 b) {
  return dsAdd(a, vec2(-b.x, -b.y));
}

void dsSplit(float a, out float hi, out float lo) {
  float t = DS_SPLITTER * a;
  hi = t - (t - a);
  lo = a - hi;
}

vec2 dsMul(vec2 a, vec2 b) {
  float ahi;
  float alo;
  float bhi;
  float blo;
  dsSplit(a.x, ahi, alo);
  dsSplit(b.x, bhi, blo);

  float p = a.x * b.x;
  float e = ((ahi * bhi - p) + ahi * blo + alo * bhi) + alo * blo;
  e += a.x * b.y + a.y * b.x;
  return dsNormalize(p, e);
}

vec2 dsMulFloat(vec2 a, float b) {
  float ahi;
  float alo;
  float bhi;
  float blo;
  dsSplit(a.x, ahi, alo);
  dsSplit(b, bhi, blo);

  float p = a.x * b;
  float e = ((ahi * bhi - p) + ahi * blo + alo * bhi) + alo * blo + a.y * b;
  return dsNormalize(p, e);
}

float dsToFloat(vec2 a) {
  return a.x + a.y;
}

vec3 mixPalette(float t, vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4, vec3 c5) {
  float scaled = clamp(t, 0.0, 1.0) * 5.0;
  if (scaled < 1.0) return mix(c0, c1, scaled);
  if (scaled < 2.0) return mix(c1, c2, scaled - 1.0);
  if (scaled < 3.0) return mix(c2, c3, scaled - 2.0);
  if (scaled < 4.0) return mix(c3, c4, scaled - 3.0);
  return mix(c4, c5, scaled - 4.0);
}

vec3 hslToRgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

vec3 getFractalColor(int iter, int maxIterations, float zr2, float zi2) {
  if (iter >= maxIterations) {
    return vec3(3.0, 3.0, 10.0) / 255.0;
  }

  float logZn = log(zr2 + zi2) / 2.0;
  float nu = float(iter) + 1.0 - log(logZn / 0.693147) / 0.693147;
  float t = pow(clamp(nu / float(maxIterations), 0.0, 1.0), 0.45);

  if (u_palette == 0) {
    return mixPalette(t,
      vec3(3.0, 3.0, 15.0) / 255.0,
      vec3(41.0, 10.0, 80.0) / 255.0,
      vec3(106.0, 13.0, 173.0) / 255.0,
      vec3(240.0, 0.0, 120.0) / 255.0,
      vec3(0.0, 240.0, 255.0) / 255.0,
      vec3(3.0, 3.0, 15.0) / 255.0);
  }
  if (u_palette == 1) {
    return mixPalette(t,
      vec3(2.0, 0.0, 4.0) / 255.0,
      vec3(120.0, 0.0, 0.0) / 255.0,
      vec3(240.0, 60.0, 0.0) / 255.0,
      vec3(255.0, 200.0, 0.0) / 255.0,
      vec3(255.0, 255.0, 220.0) / 255.0,
      vec3(2.0, 0.0, 4.0) / 255.0);
  }
  if (u_palette == 2) {
    return mixPalette(t,
      vec3(2.0, 10.0, 8.0) / 255.0,
      vec3(15.0, 60.0, 25.0) / 255.0,
      vec3(160.0, 140.0, 40.0) / 255.0,
      vec3(140.0, 35.0, 160.0) / 255.0,
      vec3(220.0, 180.0, 255.0) / 255.0,
      vec3(2.0, 10.0, 8.0) / 255.0);
  }
  if (u_palette == 3) {
    return mixPalette(t,
      vec3(0.0, 5.0, 20.0) / 255.0,
      vec3(0.0, 40.0, 100.0) / 255.0,
      vec3(0.0, 128.0, 160.0) / 255.0,
      vec3(70.0, 220.0, 160.0) / 255.0,
      vec3(200.0, 255.0, 240.0) / 255.0,
      vec3(0.0, 5.0, 20.0) / 255.0);
  }
  if (u_palette == 4) {
    return hslToRgb(mod(t * 3.5, 1.0), 1.0, 0.5);
  }
  return mixPalette(t,
    vec3(0.0, 0.0, 0.0) / 255.0,
    vec3(30.0, 30.0, 30.0) / 255.0,
    vec3(110.0, 110.0, 110.0) / 255.0,
    vec3(230.0, 230.0, 230.0) / 255.0,
    vec3(255.0, 255.0, 255.0) / 255.0,
    vec3(0.0, 0.0, 0.0) / 255.0);
}

void main() {
  float px = gl_FragCoord.x - u_resolution.x * 0.5;
  float py = (u_resolution.y - gl_FragCoord.y) - u_resolution.y * 0.5;
  vec2 cx = dsAdd(u_centerX, dsMulFloat(u_pixelScaleX, px));
  vec2 cy = dsAdd(u_centerY, dsMulFloat(u_pixelScaleY, py));

  vec2 zr = u_mode == 0 ? vec2(0.0) : cx;
  vec2 zi = u_mode == 0 ? vec2(0.0) : cy;
  vec2 cr = u_mode == 0 ? cx : u_juliaX;
  vec2 ci = u_mode == 0 ? cy : u_juliaY;
  vec2 zr2 = dsMul(zr, zr);
  vec2 zi2 = dsMul(zi, zi);
  int iter = 0;

  for (int i = 0; i < ${MAX_SHADER_ITERATIONS}; i++) {
    if (i >= u_maxIterations || dsToFloat(zr2) + dsToFloat(zi2) > 4.0) {
      break;
    }

    vec2 zrzi = dsMul(zr, zi);
    vec2 nextZi = dsAdd(dsMulFloat(zrzi, 2.0), ci);
    vec2 nextZr = dsAdd(dsSub(zr2, zi2), cr);

    zr = nextZr;
    zi = nextZi;
    zr2 = dsMul(zr, zr);
    zi2 = dsMul(zi, zi);
    iter++;
  }

  outColor = vec4(
    getFractalColor(iter, u_maxIterations, max(0.0, dsToFloat(zr2)), max(0.0, dsToFloat(zi2))),
    1.0
  );
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Fractal shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createGpuFractalRenderer(
  canvas: HTMLCanvasElement,
): GpuFractalRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) return null;

  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    FRACTAL_VERTEX_SHADER,
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRACTAL_FRAGMENT_SHADER,
  );
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Fractal shader link failed", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const centerX = gl.getUniformLocation(program, "u_centerX");
  const centerY = gl.getUniformLocation(program, "u_centerY");
  const pixelScaleX = gl.getUniformLocation(program, "u_pixelScaleX");
  const pixelScaleY = gl.getUniformLocation(program, "u_pixelScaleY");
  const maxIterations = gl.getUniformLocation(program, "u_maxIterations");
  const palette = gl.getUniformLocation(program, "u_palette");
  const mode = gl.getUniformLocation(program, "u_mode");
  const juliaX = gl.getUniformLocation(program, "u_juliaX");
  const juliaY = gl.getUniformLocation(program, "u_juliaY");

  if (
    !vao ||
    !buffer ||
    positionLocation < 0 ||
    !resolution ||
    !centerX ||
    !centerY ||
    !pixelScaleX ||
    !pixelScaleY ||
    !maxIterations ||
    !palette ||
    !mode ||
    !juliaX ||
    !juliaY
  ) {
    gl.deleteProgram(program);
    return null;
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return {
    gl,
    program,
    vao,
    buffer,
    uniforms: {
      resolution,
      centerX,
      centerY,
      pixelScaleX,
      pixelScaleY,
      maxIterations,
      palette,
      mode,
      juliaX,
      juliaY,
    },
  };
}

export function splitDouble(value: number): [number, number] {
  const high = Math.fround(value);
  return [high, value - high];
}
