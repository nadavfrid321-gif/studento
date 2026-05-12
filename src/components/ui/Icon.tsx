import clsx from 'clsx';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  size?: number;
}

export function Icon({ name, className, filled = false, weight = 400, size }: IconProps) {
  return (
    <span
      className={clsx('material-symbols-outlined', className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}`,
        fontSize: size ? `${size}px` : undefined,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
