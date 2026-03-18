import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden rounded-xl',
        className,
      )}
    >
      {/* Shimmer gradient overlay */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-forge-card/20 to-transparent"
        style={{ animation: 'shimmer 1.5s infinite' }}
      />
    </div>
  );
}
