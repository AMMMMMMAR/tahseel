import { getInitial, cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 34, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[5px] bg-[var(--color-avatar)] text-white font-bold",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {getInitial(name)}
    </div>
  );
}
