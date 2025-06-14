import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { v4 as uuidv4 } from "uuid";
import { sendCard, summon } from "./cardMovement";
import { type EffectQueueItem } from "../store/gameStore";
import { canNormalSummon } from "./summonUtils";
import { hasEmptySpellField, isMagicCard, isTrapCard, monsterFilter } from "./cardManagement";
import { CardSelector } from "./CardSelector";

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
        canCancel: boolean;
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
        canCancel: option?.canCancel ?? false,
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
    _card: CardInstance,
    monster: CardInstance,
    {
        canSelectPosition,
        optionPosition,
        order,
        needRelease,
    }: {
        order?: number;
        canSelectPosition?: boolean;
        optionPosition?: Exclude<Position, undefined>[];
        needRelease?: number;
    },
    callback: (state: GameStore, card: CardInstance, monster: CardInstance) => void
) => {
    if ((needRelease ?? 0) > 0) {
        // Add summon selection to effect queue
        withUserSelectCard(
            state,
            _card,
            (state) => new CardSelector(state).allMonster().getNonNull(),
            {
                select: "multi",
                condition: (list) => list.length === needRelease,
                canCancel: true,
                message: "リリース対象を選んでください",
            },
            (state, _card, selected) => {
                withDelayRecursive(
                    state,
                    _card,
                    { delay: 100 },
                    selected.length,
                    (state, _card, depth) => {
                        sendCard(state, selected[depth - 1], "Graveyard");
                    },
                    (state) => {
                        pushQueue(state, {
                            id: uuidv4(),
                            order: order ?? 1,
                            type: "summon",
                            cardInstance: monster,
                            effectType: "with_user_summon_callback",
                            canSelectPosition: canSelectPosition ?? true,
                            optionPosition: optionPosition ?? ["attack", "defense"],
                            callback: (
                                state: GameStore,
                                cardInstance: CardInstance,
                                result: { zone: number; position: Position }
                            ) => {
                                const summonResult = summon(state, cardInstance, result.zone, result.position);
                                callback(state, cardInstance, summonResult);
                            },
                        });
                    }
                );
            }
        );
    } else {
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
    }
};

export const withNotification = (
    state: GameStore,
    card: CardInstance,
    options: {
        message: string;
        duration?: number;
        order?: number;
    },
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    pushQueue(state, {
        id: uuidv4(),
        order: options.order ?? 1,
        type: "notification",
        cardInstance: card,
        effectType: "notification",
        message: options.message,
        duration: options.duration ?? 2000,
        callback,
    });
};

export const withDelayRecursive = (
    state: GameStore,
    card: CardInstance,
    options: Parameters<typeof withDelay>[2],
    depth: number,
    callback: (state: GameStore, cardInstance: CardInstance, currentDepth: number) => void,
    finalCallback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    if (depth <= 0) {
        // 最後のコールバックを実行
        if (finalCallback) {
            finalCallback(state, card);
        }
        return;
    }

    withDelay(state, card, options, (state, card) => {
        // 現在の深さでコールバックを実行
        callback(state, card, depth);
        // 次の深さへ再帰
        withDelayRecursive(state, card, options, depth - 1, callback, finalCallback);
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
        delay: options.delay,
        callback: (state: GameStore, cardInstance: CardInstance) => {
            // Execute the callback after the delay
            callback(state, cardInstance);
        },
    });
};

export const getCardActions = (gameState: GameStore, card: CardInstance): string[] => {
    if (gameState.isProcessing) {
        return [];
    }
    const actions: string[] = [];
    if (monsterFilter(card.card) && canNormalSummon(gameState, card) && card.location === "Hand") {
        actions.push("summon");
    }
    if (
        (isMagicCard(card.card) &&
            card.card.effect?.onSpell?.condition(gameState, card) &&
            (hasEmptySpellField(gameState) || (card.location === "SpellField" && card.position === "back")) &&
            card.position !== "attack" &&
            (card.location === "Hand" || card.location === "SpellField") &&
            !(card.card.magic_type === "フィールド魔法" && gameState.isFieldSpellActivationProhibited) &&
            gameState.phase === "main1") ||
        (isTrapCard(card.card) &&
            card.card.effect.onSpell?.condition(gameState, card) &&
            card.location === "SpellField" &&
            (card?.setTurn ?? 999999) < gameState.turn)
    ) {
        actions.push("activate");
    }

    if (
        (isTrapCard(card.card) || (isMagicCard(card.card) && card.card.magic_type !== "フィールド魔法")) &&
        hasEmptySpellField(gameState) &&
        card.location === "Hand" &&
        gameState.phase === "main1"
    ) {
        actions.push("set");
    }
    if (card.card.effect?.onIgnition?.condition(gameState, card) && gameState.phase === "main1") {
        actions.push("effect");
    }

    return actions;
};
