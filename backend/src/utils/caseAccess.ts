import prisma from '../config/database';

interface RequestUser {
  id: string;
  role: string;
}

/**
 * Retorna os IDs de processo que o usuário pode acessar, ou `null` quando
 * não há restrição (Sócio e Administrativo veem todos os processos).
 *
 * Advogado e Estagiário só enxergam processos onde são o responsável
 * principal OU foram explicitamente adicionados (CaseAssignment) — por
 * exemplo, um estagiário incluído num caso, ou um segundo advogado
 * atuando junto.
 */
export async function getAccessibleCaseIds(user: RequestUser): Promise<string[] | null> {
  if (user.role === 'SOCIO' || user.role === 'ADMINISTRATIVO') {
    return null;
  }

  const [ownCases, sharedCases] = await Promise.all([
    prisma.case.findMany({ where: { responsibleId: user.id }, select: { id: true } }),
    prisma.caseAssignment.findMany({ where: { userId: user.id }, select: { caseId: true } }),
  ]);

  const ids = new Set<string>();
  ownCases.forEach((c) => ids.add(c.id));
  sharedCases.forEach((a) => ids.add(a.caseId));

  return Array.from(ids);
}

/**
 * Verifica se o usuário pode acessar um processo específico.
 */
export async function canAccessCase(user: RequestUser, caseId: string): Promise<boolean> {
  const accessible = await getAccessibleCaseIds(user);
  if (accessible === null) return true;
  return accessible.includes(caseId);
}
