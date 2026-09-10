interface OutputEntryProps {
  serial: string;
  label: string;
  figure: string;
  why: string;
  confidence: "ink" | "pencil";
}

export function OutputEntry({ serial, label, figure, why, confidence }: OutputEntryProps) {
  return (
    <div className="entry">
      <div className="serial">{serial}</div>
      <div className="label">{label}</div>
      <div className={`figure ${confidence}`}>{figure}</div>
      <div className="why">{why}</div>
    </div>
  );
}
