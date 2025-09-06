import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = memo(({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 p-4', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-primary will-change-transform',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-responsive-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
});

Loading.displayName = "Loading";

export const SkeletonLoader: React.FC<{ className?: string }> = memo(({ className }) => (
  <div
    className={cn(
      'animate-pulse bg-gray-200 dark:bg-gray-700 rounded will-change-transform',
      className
    )}
    role="status"
    aria-label="Loading content"
  />
));

SkeletonLoader.displayName = "SkeletonLoader";

export const PageLoader: React.FC = memo(() => (
  <div className="min-h-screen flex items-center justify-center safe-area-inset">
    <Loading size="lg" text="Loading..." />
  </div>
));

PageLoader.displayName = "PageLoader";

// Mobile-optimized skeleton components
export const CardSkeleton: React.FC = memo(() => (
  <div className="bg-white border-4 border-black shadow-brutal p-responsive animate-pulse">
    <SkeletonLoader className="h-4 w-3/4 mb-2" />
    <SkeletonLoader className="h-3 w-1/2 mb-4" />
    <SkeletonLoader className="h-10 w-full" />
  </div>
));

CardSkeleton.displayName = "CardSkeleton";

export const ImageSkeleton: React.FC<{ className?: string }> = memo(({ className }) => (
  <SkeletonLoader className={cn("aspect-video w-full", className)} />
));

ImageSkeleton.displayName = "ImageSkeleton";