import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/generate', generateFromTemplate);

export default router;
