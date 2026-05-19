import { useEffect, useRef, useState } from "react";
import { hexToRgbFloat } from "@/shared/lib/color";
import { useAppStore } from "@/entities/preset/model/store";
import grainShader from "@/engines/shader/shaders/grain.frag.glsl?raw";
import liquidShader from "@/engines/shader/shaders/liquid.frag.glsl?raw";
import terrainShader from "@/engines/shader/shaders/terrain.frag.glsl?raw";
import fluidAdvectionShader from "@/engines/shader/shaders/fluid-advection.frag.glsl?raw";
import tigerWaveShader from "@/engines/shader/shaders/tiger-wave.frag.glsl?raw";
import voronoiShader from "@/engines/shader/shaders/voronoi.frag.glsl?raw";
import waterfallShader from "@/engines/shader/shaders/waterfall.frag.glsl?raw";
import type { ShaderPreset } from "@/shared/types/app";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const SHADERS: Record<ShaderPreset, string> = {
  liquid: liquidShader,
  grain: grainShader,
  terrain: terrainShader,
  "fluid-advection": fluidAdvectionShader,
  "tiger-wave": tigerWaveShader,
  voronoi: voronoiShader,
  waterfall: waterfallShader,
};

export function WebglStage({ canvasRef }: Props) {
  const [contextVersion, setContextVersion] = useState(0);
  const mode = useAppStore((state) => state.mode);
  const canvas = useAppStore((state) => state.canvas);
  const palette = useAppStore((state) => state.palette);
  const shader = useAppStore((state) => state.shader);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }

    canvasElement.width = canvas.width;
    canvasElement.height = canvas.height;
    canvasElement.style.backgroundColor = palette.background;

    const gl = canvasElement.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      canvasElement.style.backgroundColor = palette.background;
      return;
    }

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      canvasElement.style.backgroundColor = palette.background;
    };
    const handleContextRestored = () => {
      setContextVersion((value) => value + 1);
    };

    canvasElement.addEventListener("webglcontextlost", handleContextLost, false);
    canvasElement.addEventListener("webglcontextrestored", handleContextRestored, false);

    let program: WebGLProgram | null = null;
    try {
      program = createProgram(gl, VERTEX_SHADER, SHADERS[shader.preset]);
    } catch (error) {
      console.error("Shader compilation failed", error);
      program = createProgram(gl, VERTEX_SHADER, SHADERS.liquid);
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const uniformLocations = {
      time: gl.getUniformLocation(program, "u_time"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      distortion: gl.getUniformLocation(program, "u_distortion"),
      swirl: gl.getUniformLocation(program, "u_swirl"),
      grain: gl.getUniformLocation(program, "u_grain"),
      speed: gl.getUniformLocation(program, "u_speed"),
      palette: gl.getUniformLocation(program, "u_palette"),
      symmetry: gl.getUniformLocation(program, "u_symmetry"),
      stripeAngle: gl.getUniformLocation(program, "u_stripeAngle"),
      stripeFrequency: gl.getUniformLocation(program, "u_stripeFrequency"),
      stripeWidth: gl.getUniformLocation(program, "u_stripeWidth"),
      waveAmplitude: gl.getUniformLocation(program, "u_waveAmplitude"),
      waveFrequency: gl.getUniformLocation(program, "u_waveFrequency"),
      glow: gl.getUniformLocation(program, "u_glow"),
      voronoiSiteCount: gl.getUniformLocation(program, "u_voronoiSiteCount"),
      voronoiEdgeWidth: gl.getUniformLocation(program, "u_voronoiEdgeWidth"),
      voronoiGlowRadius: gl.getUniformLocation(program, "u_voronoiGlowRadius"),
      voronoiGlowIntensity: gl.getUniformLocation(program, "u_voronoiGlowIntensity"),
    };

    const startedAt = performance.now();

    const render = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const paletteFloats = palette.colors.flatMap((color) => hexToRgbFloat(color));
      const time = isPlaying ? (performance.now() - startedAt) / 1000 : 0;

      gl.uniform1f(uniformLocations.time, time);
      gl.uniform2f(uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniformLocations.distortion, shader.distortion);
      gl.uniform1f(uniformLocations.swirl, shader.swirl);
      gl.uniform1f(uniformLocations.grain, shader.grain);
      gl.uniform1f(uniformLocations.speed, shader.speed);
      gl.uniform3fv(uniformLocations.palette, new Float32Array(paletteFloats));
      gl.uniform1f(uniformLocations.symmetry, symmetryToFloat(shader.symmetry));
      gl.uniform1f(uniformLocations.stripeAngle, shader.stripeAngle);
      gl.uniform1f(uniformLocations.stripeFrequency, shader.stripeFrequency);
      gl.uniform1f(uniformLocations.stripeWidth, shader.stripeWidth);
      gl.uniform1f(uniformLocations.waveAmplitude, shader.waveAmplitude);
      gl.uniform1f(uniformLocations.waveFrequency, shader.waveFrequency);
      gl.uniform1f(uniformLocations.glow, shader.glow);
      gl.uniform1f(uniformLocations.voronoiSiteCount, shader.voronoiSiteCount);
      gl.uniform1f(uniformLocations.voronoiEdgeWidth, shader.voronoiEdgeWidth);
      gl.uniform1f(uniformLocations.voronoiGlowRadius, shader.voronoiGlowRadius);
      gl.uniform1f(uniformLocations.voronoiGlowIntensity, shader.voronoiGlowIntensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      canvasElement.removeEventListener("webglcontextlost", handleContextLost);
      canvasElement.removeEventListener("webglcontextrestored", handleContextRestored);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [canvas.height, canvas.width, canvasRef, contextVersion, isPlaying, palette, shader]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: mode === "custom" || mode === "dots" ? 0.7 : 1 }}
    />
  );
}

function symmetryToFloat(symmetry: string): number {
  if (symmetry === "mirror") return 1;
  if (symmetry === "quad") return 2;
  if (symmetry === "radial") return 3;
  return 0;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Could not create WebGL program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "WebGL program link failed");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Could not create WebGL shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "WebGL shader compile failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}
