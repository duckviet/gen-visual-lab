import type { AppStore } from "@/entities/preset/model/store";
import type { GrowthSettings } from "@/shared/types/app";
import {
  GROWTH_LAYOUT_OPTIONS,
  GROWTH_STYLE_OPTIONS,
  getGrowthControls,
} from "../config/control-config";
import { Panel, RangeControlGroup, SelectControl } from "./control-fields";

type Props = {
  growth: GrowthSettings;
  setGrowth: AppStore["setGrowth"];
};

export function GrowthPanel({ growth, setGrowth }: Props) {
  return (
    <Panel title="Growth">
      <SelectControl
        label="Style"
        onChange={(value) => setGrowth({ style: value })}
        options={GROWTH_STYLE_OPTIONS}
        value={growth.style}
      />
      <SelectControl
        label="Layout"
        onChange={(value) => setGrowth({ layout: value })}
        options={GROWTH_LAYOUT_OPTIONS}
        value={growth.layout}
      />
      <RangeControlGroup controls={getGrowthControls(growth, setGrowth)} />
    </Panel>
  );
}
