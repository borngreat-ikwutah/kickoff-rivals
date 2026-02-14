import { cn } from "../lib/utils";

interface TeamLogoProps {
  name: string;
  color: string;
  logo?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TeamLogo({
  name,
  color,
  logo,
  className,
  size = "md",
}: TeamLogoProps) {
  // Logic to get initials
  const safeName = name || "Unknown";
  const initials = safeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  if (logo) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-white shadow-sm p-1 border-2 border-white/50",
          sizeClasses[size],
          className,
        )}
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {/* Shield SVG Background */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full drop-shadow-md"
      >
        <path
          d="M12 2.5L4 6.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V6.5L12 2.5Z"
          fill={color}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        {/* Gradient Overlay for 3D effect */}
        <path
          d="M12 2.5L4 6.5V11.5C4 16.5 7.5 21 12 22C12 21 12 11.5 12 2.5Z"
          fill="#ffffff"
          fillOpacity="0.1"
        />
      </svg>
      {/* Initials */}
      <span className="relative z-10 font-black text-white drop-shadow-sm tracking-tight font-mono">
        {initials}
      </span>
    </div>
  );
}
