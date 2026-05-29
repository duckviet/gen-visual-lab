import type { AppStore } from "@/entities/preset/model/store";
import type { FlowSettings } from "@/shared/types/app";
import { getFlowControls } from "../config/control-config";
import { Panel, RangeControlGroup } from "./control-fields";

type Props = {
  flow: FlowSettings;
  setFlow: AppStore["setFlow"];
};

export function FlowPanel({ flow, setFlow }: Props) {
  return (
    <Panel title="Flow Field">
      <RangeControlGroup controls={getFlowControls(flow, setFlow)} />
    </Panel>
  );
}
