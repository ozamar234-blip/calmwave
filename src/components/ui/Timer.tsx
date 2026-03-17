interface TimerProps {
  seconds: number;
  className?: string;
}

export function Timer({ seconds, className = '' }: TimerProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className={`font-mono text-text-secondary ${className}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}
