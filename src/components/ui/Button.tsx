import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'round';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none border-none outline-none cursor-pointer';

  const variants = {
    primary: 'bg-accent-calm text-white active:bg-accent-calm/80',
    secondary: 'glass text-text-primary active:bg-white/10',
    ghost: 'bg-transparent text-text-secondary active:text-text-primary',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm rounded-xl',
    md: 'px-6 py-3.5 text-base rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl min-h-[56px]',
    round: 'w-44 h-44 rounded-full text-xl flex items-center justify-center',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
