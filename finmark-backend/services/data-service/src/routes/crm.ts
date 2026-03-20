import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';
import { crmService } from '../services/crmService.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const crmRouter: RouterType = Router();

crmRouter.use(requireAuth);

crmRouter.get('/customers/:id',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const customer = await crmService.getCustomer(req.params.id);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

crmRouter.get('/customers/:id/accounts',
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const accounts = await crmService.getCustomerAccounts(req.params.id);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }
);

crmRouter.get('/customers/:id/transactions',
  param('id').isString().notEmpty(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const transactions = await crmService.getCustomerTransactions(req.params.id, {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit as number,
      });
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
);

crmRouter.get('/customers/search',
  query('name').optional().isString(),
  query('phone').optional().isString(),
  query('idNumber').optional().isString(),
  query('accountNumber').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const customers = await crmService.searchCustomers({
        name: req.query.name as string,
        phone: req.query.phone as string,
        idNumber: req.query.idNumber as string,
        accountNumber: req.query.accountNumber as string,
      });
      res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }
);

crmRouter.post('/customers/sync',
  query('since').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map(e => e.msg).join(', '));

      const lastSyncDate = req.query.since ? new Date(req.query.since as string) : undefined;
      const result = await crmService.syncCustomers(lastSyncDate);
      
      const authReq = req as AuthRequest;
      const ip = (typeof req.ip === 'string' ? req.ip : undefined) as string | undefined;
      await createAuditLog(authReq.user?.userId, 'SYNC', 'crm', { 
        syncedCount: result.customers?.length || 0 
      }, ip);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
