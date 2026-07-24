import fs from 'fs';

/**
 * Verifica se um arquivo é um PDF de verdade lendo a assinatura binária
 * (todo PDF real começa com os bytes "%PDF-"). Nunca confiar apenas na
 * extensão do nome do arquivo nem no Content-Type enviado pelo navegador —
 * os dois são só rótulos que quem faz o upload controla livremente.
 */
export function isRealPdf(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('ascii') === '%PDF-';
  } catch {
    return false;
  }
}

const IMAGE_SIGNATURES: number[][] = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0x47, 0x49, 0x46, 0x38], // GIF
];

/**
 * Verifica se um arquivo é uma imagem de verdade (JPEG, PNG, GIF ou WEBP)
 * lendo a assinatura binária, pelo mesmo motivo do PDF.
 */
export function isRealImage(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const isWebp =
      buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    if (isWebp) return true;

    return IMAGE_SIGNATURES.some((signature) => signature.every((byte, i) => buffer[i] === byte));
  } catch {
    return false;
  }
}
