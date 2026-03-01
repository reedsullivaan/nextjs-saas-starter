"use client";

import { slugify } from "@/lib/validation";

interface SlugInputProps {
  name: string;
  slug: string;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  nameLabel?: string;
  namePlaceholder?: string;
}

export function SlugInput({
  name,
  slug,
  onNameChange,
  onSlugChange,
  nameLabel = "Name",
  namePlaceholder = "My Company",
}: SlugInputProps) {
  function handleNameChange(value: string) {
    onNameChange(value);
    onSlugChange(slugify(value));
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{nameLabel}</label>
        <input
          type="text"
          placeholder={namePlaceholder}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
          required
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">URL slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) =>
            onSlugChange(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 40)
            )
          }
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="text-xs text-muted-foreground">
          Only lowercase letters, numbers, and hyphens
        </p>
      </div>
    </>
  );
}
