import type { AppStore } from "@/entities/preset/model/store";
import type { DotsSettings } from "@/shared/types/app";
import { getDotsControls } from "../config/control-config";
import { Panel, RangeControlGroup } from "./control-fields";

type Props = {
  dots: DotsSettings;
  setDots: AppStore["setDots"];
};

export function DotsPanel({ dots, setDots }: Props) {
  return (
    <Panel title="Dots">
      <RangeControlGroup controls={getDotsControls(dots, setDots)} />
    </Panel>
  );
}
