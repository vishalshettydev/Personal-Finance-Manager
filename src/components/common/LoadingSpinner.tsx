interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({
  size = "md",
  className = "",
  text = "Loading...",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

// Full screen loading component
export const FullScreenLoading = ({
  text = "Loading...",
}: {
  text?: string;
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// Inline loading skeleton for lists
export const ListItemSkeleton = () => {
  return (
    <div className="animate-pulse p-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="text-right">
          <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};
