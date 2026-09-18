import { usingSupabase } from "./data-source";
import * as mock from "./collections.mock";
import * as db from "./collections.supabase";

/**
 * Collection store. Delegates to Supabase or to the in-memory sample data
 * depending on ADMIN_DATA_SOURCE -- see lib/admin/data-source.ts.
 */

const impl = usingSupabase ? db : mock;

export const listCollections = impl.listCollections;
export const getCollection = impl.getCollection;
export const findCollectionConflict = impl.findCollectionConflict;
export const createCollection = impl.createCollection;
export const updateCollection = impl.updateCollection;
export const setCollectionActive = impl.setCollectionActive;

/** Pure helper -- same in both modes. */
export { slugify } from "./collections.mock";
