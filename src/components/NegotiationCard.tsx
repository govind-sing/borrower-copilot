interface NegotiationCardProps {
  lines: string[];
}

export function NegotiationCard({ lines }: NegotiationCardProps) {
  return (
    <div className="card">
      <ul>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
