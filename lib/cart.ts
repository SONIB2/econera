/**
 * Cart: listings and quantities kept in this browser. Checkout sends one quote request per item to its seller
 * (no online payment until a payment provider is configured).
 */
export type CartItem = { id: string; title: string; unit: string; priceLek: number; quantity: number; max: number; seller: string; city: string };
const KEY = "econera.cart.v1";
const FAV = "econera.saved.v1";

function read<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } }
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event("econera-cart")); } catch { /* ignore */ } }

export const cart = {
  items: (): CartItem[] => read<CartItem[]>(KEY, []),
  count: () => cart.items().length,
  add(item: CartItem) {
    const list = cart.items();
    const existing = list.find((x) => x.id === item.id);
    if (existing) existing.quantity = Math.min(item.max, existing.quantity + item.quantity);
    else list.push({ ...item, quantity: Math.min(item.max, item.quantity) });
    write(KEY, list);
  },
  set(id: string, quantity: number) { write(KEY, cart.items().map((x) => (x.id === id ? { ...x, quantity: Math.max(0, Math.min(x.max, quantity)) } : x)).filter((x) => x.quantity > 0)); },
  remove(id: string) { write(KEY, cart.items().filter((x) => x.id !== id)); },
  clear() { write(KEY, []); },
};

export type Saved = { id: string; title: string; href: string };
export const saved = {
  list: (): Saved[] => read<Saved[]>(FAV, []),
  has: (id: string) => saved.list().some((x) => x.id === id),
  toggle(item: Saved) { const l = saved.list(); write(FAV, l.some((x) => x.id === item.id) ? l.filter((x) => x.id !== item.id) : [...l, item]); },
};

export function subscribeCart(cb: () => void) {
  window.addEventListener("econera-cart", cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener("econera-cart", cb); window.removeEventListener("storage", cb); };
}
