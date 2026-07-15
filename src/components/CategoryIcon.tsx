import { categoryIcon, pickedIcon } from "@/lib/icons";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = { sm: 28, md: 36, lg: 44 };

export function CategoryIconChip({
  categoryKey,
  color,
  size = "md",
}: {
  categoryKey: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = categoryIcon(categoryKey);
  const px = SIZE_PX[size];
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: px, height: px, background: color }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable reference selected from a fixed module-level map, not created during render */}
      <Icon size={Math.round(px * 0.52)} color="#fff" strokeWidth={2.2} />
    </div>
  );
}

export function PickedIconChip({
  icon,
  color,
  size = "md",
}: {
  icon: string | null | undefined;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = pickedIcon(icon);
  const px = SIZE_PX[size];
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: px, height: px, background: color }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable reference selected from a fixed module-level map, not created during render */}
      <Icon size={Math.round(px * 0.52)} color="#fff" strokeWidth={2.2} />
    </div>
  );
}
