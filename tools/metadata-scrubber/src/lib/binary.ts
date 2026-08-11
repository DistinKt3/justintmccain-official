export function uint8ToBinaryString(bytes: Uint8Array): string {
  let s = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return s;
}

export function binaryStringToUint8(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function base64ToBinaryString(b64: string): string {
  return atob(b64);
}
