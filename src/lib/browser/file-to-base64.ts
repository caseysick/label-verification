/**
 * Browser-side File → base64 (no data URL prefix). Used before JSON POST to `/api/verify`.
 */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return globalThis.btoa(binary);
}
