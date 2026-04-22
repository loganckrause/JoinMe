export function asSingleParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function parseAgeFromDob(dateText: string): number | null {
  const parts = dateText.split('/');
  if (parts.length !== 3) {
    return null;
  }

  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const year = Number(parts[2]);

  if (!month || !day || !year || year < 1900) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  const dayDelta = today.getDate() - birthDate.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age > 0 ? age : null;
}

export function parseCategoryIdsParam(categoryIdsParam: string | undefined): number[] {
  if (!categoryIdsParam) {
    return [];
  }

  try {
    const parsed = JSON.parse(categoryIdsParam);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id) => Number.isInteger(id));
  } catch {
    return [];
  }
}