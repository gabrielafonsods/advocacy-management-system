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

router.get('/', getContracts);
router.get('/:id', getContract);
router.get('/:id/pdf', downloadContractPdf);
router.post('/', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), createContract);
router.put('/:id', authorize('SOCIO', 'ADVOGADO', 'ADMINISTRATIVO'), updateContract);
router.delete('/:id', authorize('SOCIO', 'ADVOGADO'), deleteContract);

export default router;
