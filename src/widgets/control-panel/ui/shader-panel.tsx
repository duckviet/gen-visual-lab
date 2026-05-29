import type { AppStore } from "@/entities/preset/model/store";
import type { ShaderSettings } from "@/shared/types/app";
import {
  SHADER_PRESET_OPTIONS,
  SYMMETRY_OPTIONS,
  getShaderControls,
} from "../config/control-config";
import { Panel, RangeControlGroup, SelectControl } from "./control-fields";

type Props = {
  shader: ShaderSettings;
  setShader: AppStore["setShader"];
};

export function ShaderPanel({ shader, setShader }: Props) {
  return (
    <Panel title="Shader">
      <SelectControl
        label="Preset"
        onChange={(value) => setShader({ preset: value })}
        options={SHADER_PRESET_OPTIONS}
        value={shader.preset}
      />
      <SelectControl
        label="Symmetry"
        onChange={(value) => setShader({ symmetry: value })}
        options={SYMMETRY_OPTIONS}
        value={shader.symmetry}
      />
      <RangeControlGroup controls={getShaderControls(shader, setShader)} />
    </Panel>
  );
}
