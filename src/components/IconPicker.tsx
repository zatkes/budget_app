import { PICKABLE_ICONS } from "@/lib/icons";

// Pure-CSS radio grid (no client JS) so it works inside a plain server-action
// form - each swatch is a hidden radio + a label styled via peer-checked.
export function IconPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PICKABLE_ICONS.map(({ name: iconName, Icon }) => (
        <label key={iconName} className="group">
          <input
            type="radio"
            name={name}
            value={iconName}
            defaultChecked={iconName === defaultValue}
            className="peer sr-only"
          />
          <div className="flex aspect-square items-center justify-center rounded-xl border border-[color:var(--card-border)] [background:var(--card-bg)] text-[color:var(--text-muted)] transition-colors peer-checked:border-transparent peer-checked:text-white peer-checked:[background:var(--accent-gradient)]">
            <Icon size={18} />
          </div>
        </label>
      ))}
    </div>
  );
}
