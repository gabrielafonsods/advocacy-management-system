import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
} from '../controllers/template.controller';

const router = Router();
router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', authorize('SOCIO', 'ADVOGADO'), createTemplate);
router.put('/:id', authorize('SOCIO', 'ADVOGADO'), updateTemplate);
router.delete('/:id', authorize('SOCIO', 'ADVOGADO'), deleteTemplate);
router.post('/:id/generate', generateFromTemplate);

export default router;
