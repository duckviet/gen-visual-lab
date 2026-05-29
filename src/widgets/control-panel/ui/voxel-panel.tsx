import type { AppStore } from "@/entities/preset/model/store";
import type { VoxelSettings } from "@/shared/types/app";
import { getVoxelControls } from "../config/control-config";
import { Panel, RangeControlGroup } from "./control-fields";

type Props = {
  voxel: VoxelSettings;
  setVoxel: AppStore["setVoxel"];
};

export function VoxelPanel({ voxel, setVoxel }: Props) {
  return (
    <Panel title="Voxel">
      <RangeControlGroup controls={getVoxelControls(voxel, setVoxel)} />
    </Panel>
  );
}
