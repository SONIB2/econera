/** Structured ECONERA Voice responses. The UI renders only these shapes; links come from the route registry or real listing IDs. */
import type { CartItem } from "@/lib/cart";

export type Filters = { category?: string; q?: string; near?: string; qty?: number; unit?: string; maxUnitLek?: number; sort?: "relevance" | "price_asc" | "distance"; verified?: boolean };
export type Ctx = { filters?: Filters; items?: string[]; lastText?: string };

export type Card = {
  id: string; title: string; href: string; photo: string; representative: boolean; demo: boolean;
  condition: string; category: string; price: string; unit: string; available: string; region: string; verified?: string; total?: string;
  cart: Omit<CartItem, "quantity">; qty: number;
};
export type Action =
  | { kind: "link"; label: string; href: string; primary?: boolean }
  | { kind: "ask"; label: string; text: string }
  | { kind: "assistant"; label: string };

export type Block =
  | { type: "categories"; items: { id: string; label: string; desc: string; href: string }[] }
  | { type: "products"; items: Card[]; count: number; demo: boolean; allHref: string }
  | { type: "actions"; items: Action[] }
  | { type: "confirm"; prompt: string; action: Pending };

export type Pending =
  | { kind: "cart"; item: Omit<CartItem, "quantity">; qty: number; demo: boolean }
  | { kind: "basket"; text: string };

export type Reply = { text: string; speak: string; blocks: Block[]; ctx: Ctx };
