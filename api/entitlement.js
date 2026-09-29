// GET /api/entitlement?id=PRP-XXXXXXXX-XXXXXX  — public, read-only.
import { createHandlers } from '../server/handlers.js';

export default createHandlers().entitlement;
