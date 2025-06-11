import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { v4 as uuidv4 } from "uuid";
import { summon } from "./cardMovement";
import { type EffectQueueItem } from "../store/gameStore";

type EffectCallback = (gameState: GameStore, cardInstance: CardInstance) => void;
type ConditionCallback = (gameState: GameStore, cardInstance: CardInstance) => boolean;
export type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

// Turn once used effect utilities
const markTurnOnceUsedEffect = (gameStore: GameStore, effectId: string) => {
    if (!gameStore.turnOnceUsedEffectMemo) {
        gameStore.turnOnceUsedEffectMemo = {};
    }
    gameStore.turnOnceUsedEffectMemo = { ...gameStore.turnOnceUsedEffectMemo, [effectId]: true };
};

const checkTurnOnceUsedEffect = (gameStore: GameStore, effectId: string) => {
    return gameStore.turnOnceUsedEffectMemo?.[effectId] === true;
};

export const pushQueue = (state: GameStore, item: EffectQueueItem) => {
    const queue = [item, ...state.effectQueue].sort((a, b) => a.order - b.order);
    state.effectQueue = queue;
};

export const withTurnAtOneceCondition = (
    state: GameStore,
    cardInstance: CardInstance,
    callback: ConditionCallback,
    effectId: string | undefined = undefined
) => {
    const id = effectId ?? cardInstance.card.card_name;
    const alreadyUsed = checkTurnOnceUsedEffect(state, id);
    if (alreadyUsed) {
        return false;
    } else {
        return callback(state, cardInstance);
    }
};

export const withTurnAtOneceEffect = (
    state: GameStore,
    cardInstance: CardInstance,
    callback: EffectCallback,
    effectId: string | undefined = undefined
) => {
    const id = effectId ?? cardInstance.card.card_name;
    markTurnOnceUsedEffect(state, id);
    return callback(state, cardInstance);
};

// Effect queue utilities
export const withOption = <T extends string>(
    state: GameStore,
    card: CardInstance,
    options: { name: T; condition: ConditionCallback }[],
    callback: (state: GameStore, card: CardInstance, option: T) => void
) => {
    // Add option selection to effect queue
    const availableOptions = options.filter((opt) => opt.condition(state, card));
    if (availableOptions.length === 0) return;
    pushQueue(state, {
        id: uuidv4(),
        order: 1,
        type: "option",
        effectName: `${card.card.card_name}（選択肢）`,
        cardInstance: card,
        option: availableOptions.map((opt) => ({ name: opt.name, value: opt.name })),
        effectType: "with_option_callback",
        canCancel: false,
        callback: (state: GameStore, cardInstance: CardInstance, selectedOption: string) => {
            callback(state, cardInstance, selectedOption as T);
        },
    });
};

export const withUserSelectCard = (
    state: GameStore,
    card: CardInstance,
    cardOption: (state: GameStore) => CardInstance[],
    option: {
        select: "single" | "multi";
        condition?: (cards: CardInstance[], state: GameStore) => boolean;
        order?: number;
        message?: string;
    },
    callback: (state: GameStore, cardInstance: CardInstance, selected: CardInstance[]) => void
) => {
    pushQueue(state, {
        id: uuidv4(),
        order: option.order ?? 1,
        type: option.select === "single" ? "select" : "multiselect",
        effectName: option.message ? option.message : `${card.card.card_name}（カード選択）`,
        cardInstance: card,
        getAvailableCards: cardOption,
        condition: option.condition
            ? option.condition
            : (cards: CardInstance[]) => (option.select === "single" ? cards.length === 1 : cards.length >= 1),
        effectType: "with_user_select_card_callback",
        canCancel: false,
        callback: (state: GameStore, cardInstance: CardInstance, selectedCards: CardInstance[]) => {
            callback(state, cardInstance, selectedCards);
        },
    });
};

export const withUserConfirm = (
    state: GameStore,
    card: CardInstance,
    option: { message?: string; order?: number },
    callback: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // Add confirmation to effect queue
    pushQueue(state, {
        id: uuidv4(),
        order: option.order ?? 1,
        type: "confirm",
        effectName: option.message || `${card.card.card_name}（確認）`,
        cardInstance: card,
        condition: () => true,
        effectType: "with_user_confirm_callback",
        canCancel: true,
        callback,
    });
};

export const withUserSummon = (
    state: GameStore,
    card: CardInstance,
    monster: CardInstance,
    {
        canSelectPosition,
        optionPosition,
        order,
    }: { order?: number; canSelectPosition?: boolean; optionPosition?: Exclude<Position, undefined>[] },
    callback: (state: GameStore, card: CardInstance, monster: CardInstance) => void
) => {
    // Add summon selection to effect queue
    pushQueue(state, {
        id: uuidv4(),
        order: order ?? 1,
        type: "summon",
        cardInstance: monster,
        effectType: "with_user_summon_callback",
        canSelectPosition: canSelectPosition ?? true,
        optionPosition: optionPosition ?? ["attack", "defense"],
        callback: (state: GameStore, cardInstance: CardInstance, result: { zone: number; position: Position }) => {
            const summonResult = summon(state, cardInstance, result.zone, result.position);
            callback(state, cardInstance, summonResult);
        },
    });
};

export const withDelay = (
    state: GameStore,
    card: CardInstance,
    options: {
        delay?: number;
        order?: number;
        message?: string;
    },
    callback: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // Add delay to effect queue using notify type for auto-processing
    pushQueue(state, {
        id: uuidv4(),
        order: options.order ?? 1,
        type: "notify",
        cardInstance: card,
        effectType: "delay",
        callback: (state: GameStore, cardInstance: CardInstance) => {
            // Execute the callback after the delay
            callback(state, cardInstance);
        },
    });
};
