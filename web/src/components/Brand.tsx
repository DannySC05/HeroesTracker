import { Icon } from './Icon';

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={`brand${compact ? ' brand--compact' : ''}`} aria-label="Heroes Tracker">
      <span className="brand__mark">
        <Icon name="shield" />
        <span />
      </span>
      <span className="brand__name">
        Heroes<span>Tracker</span>
      </span>
    </div>
  );
}
