import crypto from 'crypto';

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  return `{${Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',')}}`;
}

export default function getConfigHash(configSnapshot: any): string {
  const json = stableStringify(configSnapshot);
  return crypto.createHash('sha256').update(json).digest('hex');
}