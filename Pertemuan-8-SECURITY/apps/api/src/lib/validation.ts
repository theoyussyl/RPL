const MaxTextLength = 200;

export function ValidateRequiredText(Value: unknown, FieldLabel: string): string | null {
  if (typeof Value !== "string" || Value.trim().length === 0) {
    return `${FieldLabel} wajib diisi`;
  }
  if (Value.length > MaxTextLength) {
    return `${FieldLabel} maksimal ${MaxTextLength} karakter`;
  }
  return null;
}
