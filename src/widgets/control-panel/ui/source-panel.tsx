import type { AppStore } from "@/entities/preset/model/store";
import type { InputType } from "@/shared/types/app";
import {
  SOURCE_OPTIONS,
  SVG_FIT_OPTIONS,
  SVG_SAMPLE_OPTIONS,
} from "../config/control-config";
import {
  CheckControl,
  FileControl,
  Panel,
  RangeControlGroup,
  SegmentedButtons,
  SelectControl,
  TextControl,
} from "./control-fields";

type Props = {
  inputType: InputType;
  svg: AppStore["svg"];
  text: AppStore["text"];
  onFontUpload: (file: File | undefined) => Promise<void>;
  onInputTypeChange: (value: InputType) => void;
  onSvgUpload: (file: File | undefined) => Promise<void>;
  setSvg: AppStore["setSvg"];
  setText: AppStore["setText"];
};

export function SourcePanel({
  inputType,
  svg,
  text,
  onFontUpload,
  onInputTypeChange,
  onSvgUpload,
  setSvg,
  setText,
}: Props) {
  return (
    <Panel title="Source">
      <SegmentedButtons
        columns={2}
        onChange={onInputTypeChange}
        options={SOURCE_OPTIONS}
        value={inputType}
      />
      {inputType === "text" ? (
        <>
          <TextControl
            label="Text"
            maxLength={30}
            onChange={(value) => setText({ value })}
            value={text.value}
          />
          <RangeControlGroup
            controls={[
              {
                label: "Font Size",
                max: 300,
                min: 20,
                onChange: (value) => setText({ fontSize: value }),
                step: 1,
                value: text.fontSize,
              },
            ]}
          />
          <CheckControl
            label="Preview Outline"
            onChange={(value) => setText({ showOutline: value })}
            value={text.showOutline}
          />
          <FileControl
            accept=".ttf,.otf"
            label="Font Upload"
            onChange={onFontUpload}
          />
          <p className="ds-muted">{text.fontName ?? "system-ui"}</p>
        </>
      ) : (
        <>
          <FileControl
            accept=".svg"
            label="SVG Upload"
            onChange={onSvgUpload}
          />
          <RangeControlGroup
            controls={[
              {
                label: "Sample Density",
                max: 5000,
                min: 100,
                onChange: (value) => setSvg({ samplePoints: value }),
                step: 50,
                value: svg.samplePoints,
              },
            ]}
          />
          <SelectControl
            label="Sampling"
            onChange={(value) => setSvg({ sampleMode: value })}
            options={SVG_SAMPLE_OPTIONS}
            value={svg.sampleMode}
          />
          <CheckControl
            label="Preview Points"
            onChange={(value) => setText({ showOutline: value })}
            value={text.showOutline}
          />
          <SelectControl
            label="Fitting Mode"
            onChange={(value) => setSvg({ fit: value })}
            options={SVG_FIT_OPTIONS}
            value={svg.fit}
          />
        </>
      )}
    </Panel>
  );
}
