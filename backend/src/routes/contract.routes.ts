import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  downloadContractPdf,
} from '../controllers/contract.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), getContracts);
router.get('/:id', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), getContract);
router.get('/:id/pdf', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), downloadContractPdf);
router.post('/', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), createContract);
router.put('/:id', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), updateContract);
router.delete('/:id', authorize('SOCIO', 'ADVOGADO'), deleteContract);

export default router;
