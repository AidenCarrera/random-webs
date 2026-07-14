type RenderTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  internalFormat: number;
  format: number;
  type: number;
};

type PingPongTarget = {
  read: RenderTarget;
  write: RenderTarget;
};

type ProgramHandle = {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
};

// This only limits a single delayed physics step for solver stability. Rendering
// remains synchronized to the display through requestAnimationFrame with no
// software FPS ceiling.
const MAX_FRAME_DELTA_SECONDS = 1 / 30;

export type FluidEngineStats = {
  fps: number;
  particles: number;
  simulationWidth: number;
  simulationHeight: number;
  renderer: string;
};

export type FluidEngineOptions = {
  solverIterations: number;
  particleCount: number;
  force: number;
  paused?: boolean;
  onStats?: (stats: FluidEngineStats) => void;
};

const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const BILINEAR_GLSL = `
vec4 sampleBilinear(sampler2D source, vec2 uv) {
  ivec2 size = textureSize(source, 0);
  vec2 position = clamp(uv, vec2(0.0), vec2(1.0)) * vec2(size) - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 fraction = fract(position);
  ivec2 maximum = size - ivec2(1);

  vec4 a = texelFetch(source, clamp(base, ivec2(0), maximum), 0);
  vec4 b = texelFetch(source, clamp(base + ivec2(1, 0), ivec2(0), maximum), 0);
  vec4 c = texelFetch(source, clamp(base + ivec2(0, 1), ivec2(0), maximum), 0);
  vec4 d = texelFetch(source, clamp(base + ivec2(1, 1), ivec2(0), maximum), 0);

  return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
}
`;

const ADVECT_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_source;
uniform sampler2D u_velocity;
uniform float u_dt;
uniform float u_dissipation;
out vec4 outColor;

${BILINEAR_GLSL}

void main() {
  vec2 velocity = sampleBilinear(u_velocity, v_uv).xy;
  vec2 previousPosition = v_uv - velocity * u_dt;
  outColor = sampleBilinear(u_source, previousPosition) * u_dissipation;
}
`;

const FORCE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocity;
uniform vec2 u_pointer;
uniform vec2 u_previousPointer;
uniform float u_dt;
uniform float u_force;
uniform float u_aspect;
uniform float u_active;
out vec4 outColor;

float distanceToSegment(vec2 point, vec2 start, vec2 end, out float projection) {
  vec2 segment = end - start;
  float lengthSquared = max(dot(segment, segment), 0.000001);
  projection = clamp(dot(point - start, segment) / lengthSquared, 0.0, 1.0);
  return length(point - (start + projection * segment));
}

void main() {
  vec2 velocity = texture(u_velocity, v_uv).xy * 0.9992;

  if (u_active > 0.5) {
    vec2 point = vec2(v_uv.x * u_aspect, v_uv.y);
    vec2 current = vec2(u_pointer.x * u_aspect, u_pointer.y);
    vec2 previous = vec2(u_previousPointer.x * u_aspect, u_previousPointer.y);
    float projection = 0.0;
    float distanceFromStroke = distanceToSegment(point, previous, current, projection);
    float radius = 0.032;
    float falloff = exp(-distanceFromStroke * distanceFromStroke / (radius * radius));
    float taper = mix(0.34, 1.0, projection);

    vec2 pointerVelocity = (u_pointer - u_previousPointer) / max(u_dt, 0.008);
    float pointerSpeed = length(pointerVelocity);
    if (pointerSpeed > 2.8) {
      pointerVelocity *= 2.8 / pointerSpeed;
    }

    float coupling = clamp(falloff * taper * u_force, 0.0, 0.94);
    velocity += (pointerVelocity * 0.82 - velocity) * coupling;
  }

  outColor = vec4(velocity, 0.0, 1.0);
}
`;

const DIVERGENCE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocity;
out vec4 outColor;

void main() {
  ivec2 size = textureSize(u_velocity, 0);
  ivec2 coord = ivec2(gl_FragCoord.xy);
  ivec2 maximum = size - ivec2(1);

  float left = texelFetch(u_velocity, clamp(coord + ivec2(-1, 0), ivec2(0), maximum), 0).x;
  float right = texelFetch(u_velocity, clamp(coord + ivec2(1, 0), ivec2(0), maximum), 0).x;
  float bottom = texelFetch(u_velocity, clamp(coord + ivec2(0, -1), ivec2(0), maximum), 0).y;
  float top = texelFetch(u_velocity, clamp(coord + ivec2(0, 1), ivec2(0), maximum), 0).y;

  float divergence = 0.5 * (right - left + top - bottom);
  outColor = vec4(divergence, 0.0, 0.0, 1.0);
}
`;

const PRESSURE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
out vec4 outColor;

void main() {
  ivec2 size = textureSize(u_pressure, 0);
  ivec2 coord = ivec2(gl_FragCoord.xy);
  ivec2 maximum = size - ivec2(1);

  float left = texelFetch(u_pressure, clamp(coord + ivec2(-1, 0), ivec2(0), maximum), 0).x;
  float right = texelFetch(u_pressure, clamp(coord + ivec2(1, 0), ivec2(0), maximum), 0).x;
  float bottom = texelFetch(u_pressure, clamp(coord + ivec2(0, -1), ivec2(0), maximum), 0).x;
  float top = texelFetch(u_pressure, clamp(coord + ivec2(0, 1), ivec2(0), maximum), 0).x;
  float divergence = texelFetch(u_divergence, coord, 0).x;

  float pressure = (left + right + bottom + top - divergence) * 0.25;
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
out vec4 outColor;

void main() {
  ivec2 size = textureSize(u_pressure, 0);
  ivec2 coord = ivec2(gl_FragCoord.xy);
  ivec2 maximum = size - ivec2(1);

  float left = texelFetch(u_pressure, clamp(coord + ivec2(-1, 0), ivec2(0), maximum), 0).x;
  float right = texelFetch(u_pressure, clamp(coord + ivec2(1, 0), ivec2(0), maximum), 0).x;
  float bottom = texelFetch(u_pressure, clamp(coord + ivec2(0, -1), ivec2(0), maximum), 0).x;
  float top = texelFetch(u_pressure, clamp(coord + ivec2(0, 1), ivec2(0), maximum), 0).x;
  vec2 velocity = texelFetch(u_velocity, coord, 0).xy;

  velocity -= 0.5 * vec2(right - left, top - bottom);

  if (coord.x <= 1 || coord.x >= maximum.x - 1) velocity.x = 0.0;
  if (coord.y <= 1 || coord.y >= maximum.y - 1) velocity.y = 0.0;

  outColor = vec4(velocity, 0.0, 1.0);
}
`;

const DYE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_dye;
uniform vec2 u_pointer;
uniform vec2 u_previousPointer;
uniform float u_dt;
uniform float u_aspect;
uniform float u_active;
out vec4 outColor;

float distanceToSegment(vec2 point, vec2 start, vec2 end, out float projection) {
  vec2 segment = end - start;
  float lengthSquared = max(dot(segment, segment), 0.000001);
  projection = clamp(dot(point - start, segment) / lengthSquared, 0.0, 1.0);
  return length(point - (start + projection * segment));
}

void main() {
  vec3 dye = texture(u_dye, v_uv).rgb * exp(-u_dt * 0.74);

  if (u_active > 0.5) {
    vec2 point = vec2(v_uv.x * u_aspect, v_uv.y);
    vec2 current = vec2(u_pointer.x * u_aspect, u_pointer.y);
    vec2 previous = vec2(u_previousPointer.x * u_aspect, u_previousPointer.y);
    float projection = 0.0;
    float distanceFromStroke = distanceToSegment(point, previous, current, projection);
    float radius = 0.022;
    float falloff = exp(-distanceFromStroke * distanceFromStroke / (radius * radius));
    float speed = clamp(length(u_pointer - u_previousPointer) / max(u_dt, 0.008) * 0.45, 0.0, 1.0);
    vec3 magenta = vec3(0.68, 0.015, 0.46);
    vec3 violet = vec3(0.42, 0.025, 0.92);
    vec3 blue = vec3(0.015, 0.30, 1.0);
    vec3 cyan = vec3(0.03, 0.90, 1.0);
    vec3 crest = vec3(0.90, 0.98, 1.0);
    vec3 ink = mix(magenta, violet, smoothstep(0.12, 0.88, u_pointer.x));
    ink = mix(ink, blue, smoothstep(0.12, 0.52, speed));
    ink = mix(ink, cyan, smoothstep(0.46, 0.84, speed));
    ink = mix(ink, crest, pow(speed, 5.0) * 0.72);
    dye += ink * falloff * mix(0.35, 1.0, projection);
  }

  outColor = vec4(min(dye, vec3(2.4)), 1.0);
}
`;

const PARTICLE_UPDATE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_particles;
uniform sampler2D u_velocity;
uniform float u_dt;
out vec4 outColor;

${BILINEAR_GLSL}

void main() {
  vec4 particle = texture(u_particles, v_uv);
  vec2 position = particle.xy;
  vec2 velocity = particle.zw;
  vec2 fluidVelocity = sampleBilinear(u_velocity, position).xy;

  float drag = 1.0 - exp(-u_dt * 11.0);
  velocity += (fluidVelocity - velocity) * drag;
  position += velocity * u_dt;

  if (position.x < 0.001) {
    position.x = 0.001;
    velocity.x = abs(velocity.x) * 0.36;
  } else if (position.x > 0.999) {
    position.x = 0.999;
    velocity.x = -abs(velocity.x) * 0.36;
  }

  if (position.y < 0.001) {
    position.y = 0.001;
    velocity.y = abs(velocity.y) * 0.36;
  } else if (position.y > 0.999) {
    position.y = 0.999;
    velocity.y = -abs(velocity.y) * 0.36;
  }

  outColor = vec4(position, velocity);
}
`;

const SCREEN_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_dye;
uniform sampler2D u_velocity;
out vec4 outColor;

${BILINEAR_GLSL}

float noise(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 dye = sampleBilinear(u_dye, v_uv).rgb;
  float speed = length(sampleBilinear(u_velocity, v_uv).xy);
  float vignette = 1.0 - 0.28 * smoothstep(0.24, 0.78, distance(v_uv, vec2(0.5)));
  float grain = (noise(gl_FragCoord.xy) - 0.5) * 0.006;
  vec3 base = vec3(0.003, 0.004, 0.012);
  vec3 current = vec3(0.012, 0.025, 0.09) * min(speed * 2.4, 1.0);
  vec3 color = (base + current + dye * 0.44) * vignette + grain;
  outColor = vec4(max(color, vec3(0.0)), 1.0);
}
`;

const PARTICLE_VERTEX = `#version 300 es
precision highp float;

uniform sampler2D u_particles;
uniform float u_pointSize;
out float v_energy;
out vec2 v_position;

void main() {
  ivec2 size = textureSize(u_particles, 0);
  int x = gl_VertexID % size.x;
  int y = gl_VertexID / size.x;
  vec4 particle = texelFetch(u_particles, ivec2(x, y), 0);
  v_energy = clamp(length(particle.zw) * 5.4, 0.0, 1.0);
  v_position = particle.xy;
  gl_PointSize = mix(u_pointSize, u_pointSize * 3.4, pow(v_energy, 0.72));
  gl_Position = vec4(particle.xy * 2.0 - 1.0, 0.0, 1.0);
}
`;

const PARTICLE_FRAGMENT = `#version 300 es
precision highp float;

in float v_energy;
in vec2 v_position;
out vec4 outColor;

void main() {
  float radius = distance(gl_PointCoord, vec2(0.5)) * 2.0;
  float edge = 1.0 - smoothstep(1.05, 1.40, radius);
  float core = 1.0 - smoothstep(0.08, 0.34, radius);
  float halo = exp(-radius * radius * 2.1) * edge;

  vec3 magenta = vec3(0.48, 0.015, 0.38);
  vec3 violet = vec3(0.30, 0.025, 0.78);
  vec3 blue = vec3(0.015, 0.32, 1.0);
  vec3 cyan = vec3(0.04, 0.88, 1.0);
  vec3 crest = vec3(0.90, 0.98, 1.0);
  vec3 color = mix(magenta, violet, v_position.x);
  color = mix(color, blue, smoothstep(0.10, 0.48, v_energy));
  color = mix(color, cyan, smoothstep(0.42, 0.82, v_energy));
  color = mix(color, crest, pow(v_energy, 4.0) * 0.76);

  float coreAlpha = core * mix(0.28, 0.96, v_energy);
  float glowAlpha = halo * mix(0.035, 0.38, pow(v_energy, 0.7));
  float alpha = (coreAlpha + glowAlpha) * edge;
  outColor = vec4(color, alpha);
}
`;

function swap(target: PingPongTarget) {
  const previousRead = target.read;
  target.read = target.write;
  target.write = previousRead;
}

function deterministicRandom(index: number, offset: number) {
  const value = Math.sin(index * 12.9898 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export class FluidEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly onStats?: (stats: FluidEngineStats) => void;
  private readonly programs: ProgramHandle[] = [];

  private quadVao: WebGLVertexArrayObject;
  private quadBuffer: WebGLBuffer;
  private advectProgram: ProgramHandle;
  private forceProgram: ProgramHandle;
  private divergenceProgram: ProgramHandle;
  private pressureProgram: ProgramHandle;
  private gradientProgram: ProgramHandle;
  private dyeProgram: ProgramHandle;
  private particleUpdateProgram: ProgramHandle;
  private screenProgram: ProgramHandle;
  private particleProgram: ProgramHandle;

  private velocity: PingPongTarget | null = null;
  private pressure: PingPongTarget | null = null;
  private dye: PingPongTarget | null = null;
  private particles: PingPongTarget | null = null;
  private divergence: RenderTarget | null = null;

  private solverIterations: number;
  private particleCount: number;
  private force: number;
  private paused: boolean;
  private particleTextureSide = 0;
  private simulationWidth = 0;
  private simulationHeight = 0;
  private displayWidth = 0;
  private displayHeight = 0;
  private pixelRatio = 1;
  private renderer = "WebGL2 GPU";
  private animationFrame: number | null = null;
  private lastTime = 0;
  private lastStatsTime = 0;
  private framesSinceStats = 0;
  private destroyed = false;

  private pointer = {
    active: false,
    x: 0.5,
    y: 0.5,
    previousX: 0.5,
    previousY: 0.5,
  };

  constructor(canvas: HTMLCanvasElement, options: FluidEngineOptions) {
    this.canvas = canvas;
    this.onStats = options.onStats;
    this.solverIterations = options.solverIterations;
    this.particleCount = options.particleCount;
    this.force = options.force;
    this.paused = options.paused ?? false;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error("This experiment needs a browser with WebGL2 support.");
    }

    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error(
        "Floating-point GPU textures are unavailable on this device.",
      );
    }

    this.gl = gl;
    this.renderer = this.readRendererName();

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) {
      throw new Error("Unable to create the GPU drawing buffers.");
    }
    this.quadVao = vao;
    this.quadBuffer = buffer;

    this.advectProgram = this.createProgram(FULLSCREEN_VERTEX, ADVECT_FRAGMENT);
    this.forceProgram = this.createProgram(FULLSCREEN_VERTEX, FORCE_FRAGMENT);
    this.divergenceProgram = this.createProgram(
      FULLSCREEN_VERTEX,
      DIVERGENCE_FRAGMENT,
    );
    this.pressureProgram = this.createProgram(
      FULLSCREEN_VERTEX,
      PRESSURE_FRAGMENT,
    );
    this.gradientProgram = this.createProgram(
      FULLSCREEN_VERTEX,
      GRADIENT_FRAGMENT,
    );
    this.dyeProgram = this.createProgram(FULLSCREEN_VERTEX, DYE_FRAGMENT);
    this.particleUpdateProgram = this.createProgram(
      FULLSCREEN_VERTEX,
      PARTICLE_UPDATE_FRAGMENT,
    );
    this.screenProgram = this.createProgram(FULLSCREEN_VERTEX, SCREEN_FRAGMENT);
    this.particleProgram = this.createProgram(
      PARTICLE_VERTEX,
      PARTICLE_FRAGMENT,
    );

    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(
      this.advectProgram.program,
      "a_position",
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DITHER);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    this.createParticleTargets(this.particleCount);
  }

  start() {
    if (this.animationFrame !== null || this.destroyed) return;
    this.lastTime = performance.now();
    this.lastStatsTime = this.lastTime;
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  resize(cssWidth: number, cssHeight: number) {
    if (this.destroyed || cssWidth < 1 || cssHeight < 1) return;

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const nextDisplayWidth = Math.max(
      1,
      Math.round(cssWidth * this.pixelRatio),
    );
    const nextDisplayHeight = Math.max(
      1,
      Math.round(cssHeight * this.pixelRatio),
    );
    const longestSide = Math.max(cssWidth, cssHeight);
    const scale = Math.min(0.255, 300 / longestSide);
    const nextSimulationWidth = Math.max(72, Math.round(cssWidth * scale));
    const nextSimulationHeight = Math.max(72, Math.round(cssHeight * scale));

    const displayChanged =
      nextDisplayWidth !== this.displayWidth ||
      nextDisplayHeight !== this.displayHeight;
    const simulationChanged =
      nextSimulationWidth !== this.simulationWidth ||
      nextSimulationHeight !== this.simulationHeight;

    if (displayChanged) {
      this.displayWidth = nextDisplayWidth;
      this.displayHeight = nextDisplayHeight;
      this.canvas.width = nextDisplayWidth;
      this.canvas.height = nextDisplayHeight;
    }

    if (simulationChanged) {
      this.simulationWidth = nextSimulationWidth;
      this.simulationHeight = nextSimulationHeight;
      this.createFluidTargets();
      this.seedFlow();
    }
  }

  setSolverIterations(iterations: number) {
    this.solverIterations = Math.max(1, Math.round(iterations));
  }

  setForce(force: number) {
    this.force = Math.max(0.1, force);
  }

  setParticleCount(count: number) {
    const nextCount = Math.max(1024, Math.round(count));
    if (nextCount === this.particleCount) return;
    this.particleCount = nextCount;
    this.createParticleTargets(nextCount);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.lastTime = performance.now();
  }

  reset() {
    if (!this.velocity || !this.pressure || !this.dye) return;
    this.seedFlow();
    this.seedParticles();
  }

  pointerDown(clientX: number, clientY: number, bounds: DOMRect) {
    const point = this.normalizePointer(clientX, clientY, bounds);
    this.pointer.active = true;
    this.pointer.x = point.x;
    this.pointer.y = point.y;
    this.pointer.previousX = point.x;
    this.pointer.previousY = point.y;
  }

  pointerMove(clientX: number, clientY: number, bounds: DOMRect) {
    if (!this.pointer.active) return;
    const point = this.normalizePointer(clientX, clientY, bounds);
    this.pointer.x = point.x;
    this.pointer.y = point.y;
  }

  pointerUp() {
    this.pointer.active = false;
  }

  async capture(): Promise<Blob> {
    if (this.destroyed) {
      throw new Error("The fluid canvas is no longer available.");
    }

    this.renderScene();
    this.gl.finish();

    return new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not create the image."));
      }, "image/png");
    });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.destroyFluidTargets();
    this.destroyParticleTargets();
    this.programs.forEach(({ program }) => this.gl.deleteProgram(program));
    this.gl.deleteBuffer(this.quadBuffer);
    this.gl.deleteVertexArray(this.quadVao);
  }

  private readonly frame = (time: number) => {
    if (this.destroyed) return;

    const dt = Math.min((time - this.lastTime) / 1000, MAX_FRAME_DELTA_SECONDS);
    this.lastTime = time;

    if (!this.paused && this.velocity && this.particles) {
      this.step(dt);
    }

    this.renderScene();
    this.pointer.previousX = this.pointer.x;
    this.pointer.previousY = this.pointer.y;

    this.framesSinceStats += 1;
    if (time - this.lastStatsTime >= 750) {
      const elapsed = Math.max(time - this.lastStatsTime, 1);
      this.onStats?.({
        fps: Math.round((this.framesSinceStats * 1000) / elapsed),
        particles: this.particleCount,
        simulationWidth: this.simulationWidth,
        simulationHeight: this.simulationHeight,
        renderer: this.renderer,
      });
      this.framesSinceStats = 0;
      this.lastStatsTime = time;
    }

    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private step(dt: number) {
    const { gl } = this;
    const velocity = this.velocity;
    const pressure = this.pressure;
    const dye = this.dye;
    const divergence = this.divergence;
    const particles = this.particles;
    if (!velocity || !pressure || !dye || !divergence || !particles) return;

    this.drawFullscreen(
      this.advectProgram,
      velocity.write,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_source", velocity.read.texture, 0);
        this.bindTexture(program, "u_velocity", velocity.read.texture, 1);
        gl.uniform1f(this.uniform(program, "u_dt"), dt);
        gl.uniform1f(
          this.uniform(program, "u_dissipation"),
          Math.exp(-dt * 0.05),
        );
      },
    );
    swap(velocity);

    this.drawFullscreen(
      this.forceProgram,
      velocity.write,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_velocity", velocity.read.texture, 0);
        gl.uniform2f(
          this.uniform(program, "u_pointer"),
          this.pointer.x,
          this.pointer.y,
        );
        gl.uniform2f(
          this.uniform(program, "u_previousPointer"),
          this.pointer.previousX,
          this.pointer.previousY,
        );
        gl.uniform1f(this.uniform(program, "u_dt"), dt);
        gl.uniform1f(this.uniform(program, "u_force"), this.force);
        gl.uniform1f(
          this.uniform(program, "u_aspect"),
          this.simulationWidth / this.simulationHeight,
        );
        gl.uniform1f(
          this.uniform(program, "u_active"),
          this.pointer.active ? 1 : 0,
        );
      },
    );
    swap(velocity);

    this.drawFullscreen(
      this.divergenceProgram,
      divergence,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_velocity", velocity.read.texture, 0);
      },
    );

    for (let iteration = 0; iteration < this.solverIterations; iteration += 1) {
      this.drawFullscreen(
        this.pressureProgram,
        pressure.write,
        this.simulationWidth,
        this.simulationHeight,
        (program) => {
          this.bindTexture(program, "u_pressure", pressure.read.texture, 0);
          this.bindTexture(program, "u_divergence", divergence.texture, 1);
        },
      );
      swap(pressure);
    }

    this.drawFullscreen(
      this.gradientProgram,
      velocity.write,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_pressure", pressure.read.texture, 0);
        this.bindTexture(program, "u_velocity", velocity.read.texture, 1);
      },
    );
    swap(velocity);

    this.drawFullscreen(
      this.dyeProgram,
      dye.write,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_dye", dye.read.texture, 0);
        gl.uniform2f(
          this.uniform(program, "u_pointer"),
          this.pointer.x,
          this.pointer.y,
        );
        gl.uniform2f(
          this.uniform(program, "u_previousPointer"),
          this.pointer.previousX,
          this.pointer.previousY,
        );
        gl.uniform1f(this.uniform(program, "u_dt"), dt);
        gl.uniform1f(
          this.uniform(program, "u_aspect"),
          this.simulationWidth / this.simulationHeight,
        );
        gl.uniform1f(
          this.uniform(program, "u_active"),
          this.pointer.active ? 1 : 0,
        );
      },
    );
    swap(dye);

    this.drawFullscreen(
      this.advectProgram,
      dye.write,
      this.simulationWidth,
      this.simulationHeight,
      (program) => {
        this.bindTexture(program, "u_source", dye.read.texture, 0);
        this.bindTexture(program, "u_velocity", velocity.read.texture, 1);
        gl.uniform1f(this.uniform(program, "u_dt"), dt);
        gl.uniform1f(
          this.uniform(program, "u_dissipation"),
          Math.exp(-dt * 0.08),
        );
      },
    );
    swap(dye);

    this.drawFullscreen(
      this.particleUpdateProgram,
      particles.write,
      this.particleTextureSide,
      this.particleTextureSide,
      (program) => {
        this.bindTexture(program, "u_particles", particles.read.texture, 0);
        this.bindTexture(program, "u_velocity", velocity.read.texture, 1);
        gl.uniform1f(this.uniform(program, "u_dt"), dt);
      },
    );
    swap(particles);
  }

  private renderScene() {
    const { gl } = this;
    if (!this.velocity || !this.dye || !this.particles) return;

    this.drawFullscreen(
      this.screenProgram,
      null,
      this.displayWidth,
      this.displayHeight,
      (program) => {
        this.bindTexture(program, "u_dye", this.dye!.read.texture, 0);
        this.bindTexture(program, "u_velocity", this.velocity!.read.texture, 1);
      },
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.displayWidth, this.displayHeight);
    gl.useProgram(this.particleProgram.program);
    gl.bindVertexArray(this.quadVao);
    this.bindTexture(
      this.particleProgram,
      "u_particles",
      this.particles.read.texture,
      0,
    );
    gl.uniform1f(
      this.uniform(this.particleProgram, "u_pointSize"),
      Math.min(2.15, Math.max(1.15, this.pixelRatio * 1.05)),
    );
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  private createFluidTargets() {
    this.destroyFluidTargets();
    const { gl } = this;
    const create = () =>
      this.createTarget(
        this.simulationWidth,
        this.simulationHeight,
        gl.RGBA32F,
        gl.RGBA,
        gl.FLOAT,
      );

    this.velocity = { read: create(), write: create() };
    this.pressure = { read: create(), write: create() };
    this.dye = { read: create(), write: create() };
    this.divergence = create();
    this.clearTarget(this.pressure.read);
    this.clearTarget(this.pressure.write);
    this.clearTarget(this.divergence);
  }

  private createParticleTargets(count: number) {
    this.destroyParticleTargets();
    const { gl } = this;
    this.particleTextureSide = Math.ceil(Math.sqrt(count));
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (this.particleTextureSide > maxTextureSize) {
      throw new Error(
        "The requested particle field is larger than this GPU supports.",
      );
    }

    const create = () =>
      this.createTarget(
        this.particleTextureSide,
        this.particleTextureSide,
        gl.RGBA32F,
        gl.RGBA,
        gl.FLOAT,
      );
    this.particles = { read: create(), write: create() };
    this.seedParticles();
  }

  private seedParticles() {
    if (!this.particles) return;
    const side = this.particleTextureSide;
    const data = new Float32Array(side * side * 4);

    for (let index = 0; index < side * side; index += 1) {
      const x = index % side;
      const y = Math.floor(index / side);
      const offset = index * 4;
      const jitterX = deterministicRandom(index, 0.17);
      const jitterY = deterministicRandom(index, 0.73);
      data[offset] = (x + jitterX) / side;
      data[offset + 1] = (y + jitterY) / side;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    }

    this.uploadTarget(this.particles.read, data);
    this.uploadTarget(this.particles.write, data);
  }

  private seedFlow() {
    if (!this.velocity || !this.dye) return;
    const width = this.simulationWidth;
    const height = this.simulationHeight;
    const aspect = width / height;
    const velocityData = new Float32Array(width * height * 4);
    const dyeData = new Float32Array(width * height * 4);
    const vortices = [
      { x: 0.26, y: 0.36, radius: 0.34, strength: 0.52 },
      { x: 0.7, y: 0.62, radius: 0.4, strength: -0.48 },
      { x: 0.52, y: 0.24, radius: 0.26, strength: 0.28 },
    ];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        let velocityX = 0;
        let velocityY = 0;

        for (const vortex of vortices) {
          const dx = (u - vortex.x) * aspect;
          const dy = v - vortex.y;
          const distanceSquared = dx * dx + dy * dy;
          const falloff = Math.exp(
            -distanceSquared / (vortex.radius * vortex.radius),
          );
          velocityX += (-dy * vortex.strength * falloff) / aspect;
          velocityY += dx * vortex.strength * falloff;
        }

        const index = (y * width + x) * 4;
        const speed = Math.hypot(velocityX, velocityY);
        velocityData[index] = velocityX;
        velocityData[index + 1] = velocityY;
        velocityData[index + 2] = 0;
        velocityData[index + 3] = 1;

        const mist = Math.min(speed * 0.34, 0.045);
        const direction =
          0.5 + 0.5 * Math.sin(Math.atan2(velocityY, velocityX) * 2);
        dyeData[index] = mist * (0.75 + direction * 0.72);
        dyeData[index + 1] = mist * (0.12 + (1 - direction) * 0.42);
        dyeData[index + 2] = mist * (1.35 + direction * 0.5);
        dyeData[index + 3] = 1;
      }
    }

    this.uploadTarget(this.velocity.read, velocityData);
    this.uploadTarget(this.velocity.write, velocityData);
    this.uploadTarget(this.dye.read, dyeData);
    this.uploadTarget(this.dye.write, dyeData);
    if (this.pressure) {
      this.clearTarget(this.pressure.read);
      this.clearTarget(this.pressure.write);
    }
    if (this.divergence) this.clearTarget(this.divergence);
  }

  private createTarget(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
  ): RenderTarget {
    const { gl } = this;
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
      throw new Error(
        "Unable to allocate a floating-point simulation texture.",
      );
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      format,
      type,
      null,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      throw new Error("This GPU cannot render the fluid texture format.");
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      texture,
      framebuffer,
      width,
      height,
      internalFormat,
      format,
      type,
    };
  }

  private uploadTarget(target: RenderTarget, data: Float32Array) {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      target.width,
      target.height,
      target.format,
      gl.FLOAT,
      data,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private clearTarget(target: RenderTarget) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private drawFullscreen(
    program: ProgramHandle,
    target: RenderTarget | null,
    width: number,
    height: number,
    setUniforms: (program: ProgramHandle) => void,
  ) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(program.program);
    gl.bindVertexArray(this.quadVao);
    setUniforms(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  private bindTexture(
    program: ProgramHandle,
    name: string,
    texture: WebGLTexture,
    unit: number,
  ) {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.uniform(program, name), unit);
  }

  private uniform(program: ProgramHandle, name: string) {
    if (!program.uniforms.has(name)) {
      program.uniforms.set(
        name,
        this.gl.getUniformLocation(program.program, name),
      );
    }
    return program.uniforms.get(name) ?? null;
  }

  private createProgram(vertexSource: string, fragmentSource: string) {
    const { gl } = this;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSource,
    );
    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create a GPU shader program.");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message =
        gl.getProgramInfoLog(program) || "Unknown shader link error";
      gl.deleteProgram(program);
      throw new Error(`Fluid shader link failed: ${message}`);
    }

    const handle: ProgramHandle = { program, uniforms: new Map() };
    this.programs.push(handle);
    return handle;
  }

  private compileShader(type: number, source: string) {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to create a GPU shader.");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message =
        gl.getShaderInfoLog(shader) || "Unknown shader compile error";
      gl.deleteShader(shader);
      throw new Error(`Fluid shader compilation failed: ${message}`);
    }

    return shader;
  }

  private readRendererName() {
    const debugInfo = this.gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "WebGL2 GPU";
    const renderer = this.gl.getParameter(
      debugInfo.UNMASKED_RENDERER_WEBGL,
    ) as string;
    return (
      renderer
        .replace(/ANGLE \(|\)/g, "")
        .split(",")[0]
        ?.trim() || "WebGL2 GPU"
    );
  }

  private normalizePointer(clientX: number, clientY: number, bounds: DOMRect) {
    return {
      x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, 1 - (clientY - bounds.top) / bounds.height)),
    };
  }

  private destroyTarget(target: RenderTarget | null) {
    if (!target) return;
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
  }

  private destroyPingPong(target: PingPongTarget | null) {
    if (!target) return;
    this.destroyTarget(target.read);
    this.destroyTarget(target.write);
  }

  private destroyFluidTargets() {
    this.destroyPingPong(this.velocity);
    this.destroyPingPong(this.pressure);
    this.destroyPingPong(this.dye);
    this.destroyTarget(this.divergence);
    this.velocity = null;
    this.pressure = null;
    this.dye = null;
    this.divergence = null;
  }

  private destroyParticleTargets() {
    this.destroyPingPong(this.particles);
    this.particles = null;
  }
}
