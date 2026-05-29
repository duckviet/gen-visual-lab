import type { Option, RangeConfig } from "../config/control-config";

type PanelProps = {
  title: string;
  children: React.ReactNode;
};

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="ds-panel">
      <h2 className="ds-panel-title">{title}</h2>
      {children}
    </section>
  );
}

type SegmentedButtonsProps<T extends string> = {
  columns: 2 | 3;
  options: Array<Option<T> & { disabled?: boolean }>;
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedButtons<T extends string>({ columns, options, value, onChange }: SegmentedButtonsProps<T>) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((item) => (
        <button
          className={`${buttonClass(value === item.value)} ds-button-compact ${item.disabled ? "opacity-45" : ""}`}
          disabled={item.disabled}
          key={item.value}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

type SelectControlProps<T extends string | number> = {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
};

export function SelectControl<T extends string | number>({ label, options, value, onChange }: SelectControlProps<T>) {
  return (
    <label className="grid gap-2 uppercase">
      {label}
      <select className="ds-select" onChange={(event) => onChange(parseSelectValue(event.target.value, options))} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextControlProps = {
  label: string;
  value: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

export function TextControl({ label, value, maxLength, onChange }: TextControlProps) {
  return (
    <label className="grid gap-2 uppercase">
      {label}
      <input className="ds-input" maxLength={maxLength} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

type CheckControlProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function CheckControl({ label, value, onChange }: CheckControlProps) {
  return (
    <label className="ds-check-row">
      {label}
      <input checked={value} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

type FileControlProps = {
  accept: string;
  label: string;
  onChange: (file: File | undefined) => Promise<void>;
};

export function FileControl({ accept, label, onChange }: FileControlProps) {
  return (
    <label className="grid gap-2 uppercase">
      {label}
      <input accept={accept} className="ds-file" onChange={(event) => void onChange(event.target.files?.[0])} type="file" />
    </label>
  );
}

type ColorControlProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, onChange }: ColorControlProps) {
  return (
    <label className="grid gap-2 uppercase">
      {label}
      <input onChange={(event) => onChange(event.target.value)} type="color" value={value} />
    </label>
  );
}

type RangeControlGroupProps = {
  controls: RangeConfig[];
};

export function RangeControlGroup({ controls }: RangeControlGroupProps) {
  return (
    <>
      {controls.map((control) => (
        <RangeControl key={control.label} {...control} />
      ))}
    </>
  );
}

function RangeControl({ label, min, max, step, value, onChange }: RangeConfig) {
  return (
    <label className="grid gap-2 uppercase">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        className="ds-range"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function parseSelectValue<T extends string | number>(rawValue: string, options: Array<Option<T>>): T {
  const option = options.find((item) => String(item.value) === rawValue);
  return option ? option.value : options[0].value;
}

function buttonClass(isActive: boolean): string {
  return `ds-button ${isActive ? "ds-button-active" : ""}`;
}
