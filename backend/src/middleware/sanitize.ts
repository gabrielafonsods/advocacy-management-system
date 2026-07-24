import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * Nenhum campo do sistema permite HTML (não existe editor de texto rico em
 * nenhuma tela). Por isso, removemos QUALQUER tag HTML/script de todo texto
 * enviado pelo usuário, em todos os campos do body — antes mesmo de chegar
 * no controller. Isso é uma camada extra de proteção: o React já escapa
 * tudo que exibe na tela, então isso protege sobretudo o que sai do
 * sistema por outros caminhos (PDF gerado, futura integração, etc.).
 */
// Campos que nunca devem ser sanitizados: senha, tokens e códigos podem
// legitimamente conter caracteres como < > que a sanitização removeria,
// corrompendo o valor (ex: senha forte com caractere especial).
const SKIP_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'twoFactorSecret',
  'twoFactorCode',
  'code',
]);

function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && SKIP_FIELDS.has(key)) {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(value)) {
      result[k] = sanitizeValue(val, k);
    }
    return result;
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body) as typeof req.body;
  }
  next();
}
