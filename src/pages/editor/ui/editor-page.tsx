import { useState } from "react";
import { ControlPanel } from "@/widgets/control-panel/ui/control-panel";
import { PreviewStage } from "@/widgets/preview-stage/ui/preview-stage";

export function EditorPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <main className="app-shell">
      <div className="mobile-topbar">
        <button className="ds-button text-xs" onClick={() => setIsPanelOpen((value) => !value)} type="button">
          {isPanelOpen ? "Hide Controls" : "Show Controls"}
        </button>
      </div>
      <ControlPanel isOpen={isPanelOpen} onToggleOpen={() => setIsPanelOpen((value) => !value)} />
      <PreviewStage />
    </main>
  );
}
