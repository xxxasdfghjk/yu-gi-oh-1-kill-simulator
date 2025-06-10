import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "./cardManagement";
import { withTurnAtOneceCondition } from "./effectUtils";

type Name = "竜輝巧－エルγ" | "竜輝巧－アルζ" | "竜輝巧－バンα";
// Draitron specific utilities
export const draitronIgnitionCondition =
    (cardName: Name) =>
    (gameState: GameStore, cardInstance: CardInstance): boolean => {
        // Must be in hand or graveyard
        if (cardInstance.location !== "Hand" && cardInstance.location !== "Graveyard") return false;

        // Once per turn check
        if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

        // Need a Draitron or Ritual monster to release (excluding this card)
        const releaseTargets = [
            ...gameState.hand,
            ...gameState.field.monsterZones.filter((c) => c !== null),
            ...gameState.field.extraMonsterZones.filter((c) => c !== null),
        ]
            .filter((card) => card && card.card.card_name !== cardName)
            .filter((card) => {
                if (!card || !monsterFilter(card.card)) return false;
                return card.card.card_name.includes("竜輝巧") || card.card.monster_type === "儀式モンスター";
            });

        return releaseTargets.length > 0;
    };

export const getDraitronReleaseTargets =
    (name: Name) =>
    (gameState: GameStore): CardInstance[] => {
        return [
            ...gameState.hand,
            ...gameState.field.monsterZones.filter((c) => c !== null),
            ...gameState.field.extraMonsterZones.filter((c) => c !== null),
        ]
            .filter((e) => e !== null)
            .filter((card) => card && card.card.card_name !== name)
            .filter((card) => {
                if (!card || !monsterFilter(card.card)) return false;
                return card.card.card_name.includes("竜輝巧") || card.card.monster_type === "儀式モンスター";
            });
    };
