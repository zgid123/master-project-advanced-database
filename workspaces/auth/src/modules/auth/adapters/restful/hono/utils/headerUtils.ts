export function extractBearerToken(value: string = ''): string {
  return value.replace(/bearer/i, '').trim();
}
