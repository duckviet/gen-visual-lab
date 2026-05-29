import type { AppStore } from "@/entities/preset/model/store";
import type { BoidSettings } from "@/shared/types/app";
import { getBoidControls } from "../config/control-config";
import { CheckControl, Panel, RangeControlGroup } from "./control-fields";

type Props = {
  boids: BoidSettings;
  setBoids: AppStore["setBoids"];
};

export function BoidsPanel({ boids, setBoids }: Props) {
  return (
    <Panel title="Boids">
      <RangeControlGroup controls={getBoidControls(boids, setBoids)} />
      <CheckControl
        label="Wrap Boundaries"
        onChange={(value) => setBoids({ wrap: value })}
        value={boids.wrap}
      />
    </Panel>
  );
}
