export const formatPublicId = (value: string): string => {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+$/g, "") // ❗ remove trailing hyphens
    .replace(/^-+/g, "") // ❗ remove leading hyphens
    .toLowerCase();
};
