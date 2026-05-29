import type { AppStore } from "@/entities/preset/model/store";
import type { MosaicSettings } from "@/shared/types/app";
import { getMosaicControls } from "../config/control-config";
import { Panel, RangeControlGroup } from "./control-fields";

type Props = {
  mosaic: MosaicSettings;
  setMosaic: AppStore["setMosaic"];
};

export function MosaicPanel({ mosaic, setMosaic }: Props) {
  return (
    <Panel title="Mosaic">
      <RangeControlGroup controls={getMosaicControls(mosaic, setMosaic)} />
    </Panel>
  );
}
