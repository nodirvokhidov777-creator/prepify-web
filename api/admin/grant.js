// POST /api/admin/grant — requires `Authorization: Bearer <ADMIN_SECRET>`.
import { createHandlers } from '../../server/handlers.js';

export default createHandlers().grant;
