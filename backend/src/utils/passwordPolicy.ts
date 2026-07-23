/**
 * Política de senha forte:
 * - mínimo 8 caracteres
 * - ao menos 1 letra maiúscula
 * - ao menos 1 letra minúscula
 * - ao menos 1 número
 * - ao menos 1 caractere especial
 *
 * Retorna null se a senha for válida, ou uma mensagem de erro em português
 * caso contrário.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve ter ao menos uma letra maiúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve ter ao menos uma letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve ter ao menos um número';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'A senha deve ter ao menos um caractere especial (ex: ! @ # $ % &)';
  }
  return null;
}
