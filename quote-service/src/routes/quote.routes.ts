import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';

const router = Router();

router.get('/', quoteController.getAll);
router.get('/:id', quoteController.getById);
router.post('/', quoteController.create);
router.post('/:id/analyze', quoteController.analyze);
router.patch('/:id/status', quoteController.updateStatus);

export default router;
