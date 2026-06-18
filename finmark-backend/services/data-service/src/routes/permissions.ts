import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPermissions, getRoles, createRole, updateRole, deleteRole } from '../services/permissionService.js';

export const permissionRouter: RouterType = Router();

permissionRouter.use(requireAuth);

permissionRouter.get('/', async (_req, res, next) => {
  try {
    const permissions = await getPermissions();
    res.json({ success: true, data: permissions });
  } catch (err) { next(err); }
});

permissionRouter.get('/roles', async (_req, res, next) => {
  try {
    const roles = await getRoles();
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
});

permissionRouter.post('/roles',
  requireRole('admin'),
  body('name').isString().notEmpty().withMessage('Role name is required'),
  body('description').optional().isString(),
  body('isSystem').optional().isBoolean(),
  body('permissions').optional().isArray(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map(e => e.msg).join(', '));
      const role = await createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (err) { next(err); }
  }
);

permissionRouter.put('/roles/:id',
  requireRole('admin'),
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map(e => e.msg).join(', '));
      const id = req.params.id as string;
      const role = await updateRole(id, req.body);
      if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
      res.json({ success: true, data: role });
    } catch (err) { next(err); }
  }
);

permissionRouter.delete('/roles/:id',
  requireRole('admin'),
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map(e => e.msg).join(', '));
      const id = req.params.id as string;
      const result = await deleteRole(id);
      if (!result.deleted) {
        const message = result.reason === 'system_role' ? 'Cannot delete system role' : 'Role not found';
        return res.status(400).json({ success: false, error: message });
      }
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);
