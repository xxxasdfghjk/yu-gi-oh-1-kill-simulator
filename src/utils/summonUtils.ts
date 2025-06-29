import type { Card, CardInstance } from "@/types/card";
import type { GameState } from "@/types/game";
import { isMagicCard, isTrapCard, monsterFilter } from "./cardManagement";
import { getLevel } from "./gameUtils";
import { CardSelector } from "./CardSelector";
import type { GameStore } from "@/store/gameStore";

export const getNeedReleaseCount = (_gameState: GameStore, card: CardInstance): number => {
    return monsterFilter(card.card)
        ? card.card.element === "神"
            ? 3
            : getLevel(card) <= 4
            ? 0
            : getLevel(card) <= 6
            ? 1
            : 2
        : 0;
};

export const canNormalSummon = (gameState: GameStore, card: CardInstance): boolean => {
    if (!monsterFilter(card.card)) return false;
    if (gameState.hasNormalSummoned) return false;
    if (gameState.normalSummonProhibited) return false;

    if (gameState.phase !== "main1" && gameState.phase !== "main2") return false;
    // 特殊召喚モンスターは通常召喚できない
    if (!card.card.canNormalSummon) return false;
    const needRelease = getNeedReleaseCount(gameState, card);
    if (needRelease) {
        return new CardSelector(gameState).allMonster().getNonNull().length >= needRelease;
    } else {
        const hasEmpty = gameState.field.monsterZones.filter((e) => e === null).length > 0;
        return hasEmpty;
    }
};

export const findEmptyMonsterZone = (gameState: GameState): number => {
    // 通常のモンスターゾーン（0-4）で空いているゾーンを探す
    for (let i = 0; i < 5; i++) {
        if (gameState.field.monsterZones[i] === null) {
            return i;
        }
    }
    return -1;
};

export const findEmptySpellTrapZone = (gameState: GameState): number => {
    for (let i = 0; i < 5; i++) {
        if (gameState.field.spellTrapZones[i] === null) {
            return i;
        }
    }
    return -1;
};

const settableTrapTypes = ["通常罠", "永続罠", "カウンター罠"];

export const canSetSpellTrap = (gameState: GameState, card: Card): boolean => {
    if (!isMagicCard(card) && !isTrapCard(card)) {
        return false;
    }
    if (isMagicCard(card) && card.magic_type === "フィールド魔法") {
        return false;
    }
    if (isTrapCard(card) && !settableTrapTypes.includes(card.trap_type)) {
        return false;
    }

    // メインフェイズのみセット可能
    if (gameState.phase !== "main1" && gameState.phase !== "main2") {
        return false;
    }

    // 魔法・罠ゾーンに空きが必要
    return findEmptySpellTrapZone(gameState) !== -1;
};
