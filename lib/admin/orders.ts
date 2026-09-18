import { usingSupabase } from "./data-source";
import * as mock from "./orders.mock";
import * as db from "./orders.supabase";

/**
 * Order store. Delegates to Supabase or to the in-memory sample data
 * depending on ADMIN_DATA_SOURCE -- see lib/admin/data-source.ts.
 */

const impl = usingSupabase ? db : mock;

export const listOrders = impl.listOrders;
export const getOrder = impl.getOrder;
export const updateOrderStatus = impl.updateOrderStatus;
