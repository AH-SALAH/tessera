"use client";

import { useEffect, useRef } from "react";

/**
 * WebGL shader canvas — animated grid pattern in Tessera chalk/clay-line palette.
 * Derived from Stitch screen "Tessera: The Immersive Ledger Landing".
 */
export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas!.clientWidth || 1280;
      const h = canvas!.clientHeight || 720;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    const gl =
      (canvas!.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas!.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 pos = uv * u_resolution.xy / 800.0;

    vec3 chalk = vec3(0.945, 0.941, 0.925);
    vec3 clay = vec3(0.847, 0.835, 0.8);

    vec2 grid_uv = uv * 40.0;
    vec2 grid_id = floor(grid_uv);
    vec2 grid_f = fract(grid_uv);

    float line_x = smoothstep(0.02, 0.0, abs(grid_f.x - 0.5));
    float line_y = smoothstep(0.02, 0.0, abs(grid_f.y - 0.5));
    float lines = max(line_x, line_y);

    float wave = sin(uv.x * 2.0 + u_time * 0.5) * cos(uv.y * 3.0 + u_time * 0.3) * 0.1;
    lines *= 0.15 + 0.05 * sin(u_time * 0.2 + hash(grid_id) * 6.28);

    float n = hash(uv + u_time * 0.001) * 0.04;

    float dist = distance(uv, u_mouse / u_resolution);
    float glow = smoothstep(0.3, 0.0, dist) * 0.05;

    vec3 color = mix(chalk, clay, lines);
    color += n + glow;

    gl_FragColor = vec4(color, 1.0);
}`;

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl!.createProgram()!;
    gl!.attachShader(prog, createShader(gl!.VERTEX_SHADER, vs));
    gl!.attachShader(prog, createShader(gl!.FRAGMENT_SHADER, fs));
    gl!.linkProgram(prog);
    gl!.useProgram(prog);

    const buf = gl!.createBuffer()!;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
    gl!.bufferData(
      gl!.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl!.STATIC_DRAW,
    );
    const pos = gl!.getAttribLocation(prog, "a_position");
    gl!.enableVertexAttribArray(pos);
    gl!.vertexAttribPointer(pos, 2, gl!.FLOAT, false, 0, 0);

    const uTime = gl!.getUniformLocation(prog, "u_time");
    const uRes = gl!.getUniformLocation(prog, "u_resolution");
    const uMouse = gl!.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas!.width / 2, y: canvas!.height / 2 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = 1.0 - (e.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas!.width;
        mouse.y = ny * canvas!.height;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    let frameId: number;
    function render(t: number) {
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(render);
    }
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
  );
}
