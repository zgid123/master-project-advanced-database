export function extractBearerToken(value = '') {
    return value.replace(/bearer/i, '').trim();
}
