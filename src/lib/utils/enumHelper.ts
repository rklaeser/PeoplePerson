export function getEnumValue<T extends { [key: string]: string }>(
    enumObj: T,
    value: string | null
  ): T[keyof T] | undefined {
    if (!value) return undefined;
    const lowerValue = value.toLowerCase();
    return Object.values(enumObj).includes(lowerValue) ? lowerValue as T[keyof T] : undefined;
  }