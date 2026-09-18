import { usingSupabase } from "./data-source";
import * as mock from "./products.mock";
import * as db from "./products.supabase";

/**
 * Product store. Delegates to Supabase or to the in-memory sample data
 * depending on ADMIN_DATA_SOURCE -- see lib/admin/data-source.ts.
 *
 * Callers import from here and never from the two implementations, so
 * switching sources needs no changes anywhere else.
 */

const impl = usingSupabase ? db : mock;

export const listProducts = impl.listProducts;
export const getProduct = impl.getProduct;
export const isProductCodeTaken = impl.isProductCodeTaken;
export const createProduct = impl.createProduct;
export const updateProduct = impl.updateProduct;
export const setProductActive = impl.setProductActive;
export const setCollectionMembers = impl.setCollectionMembers;

/** Form option lists -- static either way. */
export { CURRENCIES, SIZE_PRESETS } from "./products.mock";
