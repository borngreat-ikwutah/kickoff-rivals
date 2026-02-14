import { cn } from "../lib/utils";

interface RivalsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
}

export function RivalsLogo({
  className,
  size = "md",
  variant = "full",
}: RivalsLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary",
          sizeClasses[size],
          "aspect-square",
          className,
        )}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="white"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M50 10 L50 90 M10 50 L90 50"
            stroke="white"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="12"
            stroke="white"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span
        className={cn(
          "font-sport font-black italic tracking-tighter",
          textSizeClasses[size],
          className,
        )}
      >
        KICKOFF<span className="text-primary">RIVALS</span>
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary",
          sizeClasses[size],
          "aspect-square",
        )}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="white"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M50 10 L50 90 M10 50 L90 50"
            stroke="white"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="12"
            stroke="white"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
      <span
        className={cn(
          "font-sport font-black italic tracking-tighter text-white",
          textSizeClasses[size],
        )}
      >
        KICKOFF<span className="text-primary">RIVALS</span>
      </span>
    </div>
  );
}

export default RivalsLogo;
