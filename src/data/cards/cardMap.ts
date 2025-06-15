import type { Card } from "@/types/card";

// Import all cards from each category
const magicModules = import.meta.glob("./magic/*.ts", { eager: true }) as Record<string, { default: Card }>;
const monsterModules = import.meta.glob("./monster/*.ts", { eager: true }) as Record<string, { default: Card }>;
const extraModules = import.meta.glob("./extra/*.ts", { eager: true }) as Record<string, { default: Card }>;
const trapModules = import.meta.glob("./trap/*.ts", { eager: true }) as Record<string, { default: Card }>;
const tokenModules = import.meta.glob("./token/*.ts", { eager: true }) as Record<string, { default: Card }>;

// Create card lists by category
export const magicCardList = Object.values(magicModules).map((e) => e.default);
export const monsterCardList = Object.values(monsterModules).map((e) => e.default);
export const extraCardList = Object.values(extraModules).map((e) => e.default);
export const trapCardList = Object.values(trapModules).map((e) => e.default);
export const tokenCardList = Object.values(tokenModules).map((e) => e.default);

// Create unified card map for easy lookup by card name
export const cardMap = [
    ...monsterCardList,
    ...extraCardList,
    ...magicCardList,
    ...trapCardList,
    ...tokenCardList,
].reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {} as Record<string, Card>);

// Export default as cardMap for convenience
export default cardMap;