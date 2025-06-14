import type { GameStore } from "@/store/gameStore";
import type { CardInstance, MagicCard } from "@/types/card";
import { v4 as uuidv4 } from "uuid";
import { getSpellTrapZoneIndex, sendCard, summon } from "./cardMovement";
import { type EffectQueueItem } from "../store/gameStore";
import { canNormalSummon } from "./summonUtils";
import { hasEmptySpellField, isMagicCard, isTrapCard, monsterFilter } from "./cardManagement";
import { CardSelector } from "./CardSelector";
import { placementPriority } from "@/components/SummonSelector";
import { getLevel } from "./gameUtils";

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
    console.log("pushQueue called with item:", item);
    const queue = [item, ...state.effectQueue].sort((a, b) => a.order - b.order);
    state.effectQueue = queue;
    console.log("Effect queue after push:", state.effectQueue);
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
        canCancel?: boolean;
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

export const withLifeChange = (
    state: GameStore,
    card: CardInstance,
    options: {
        target: "player" | "opponent";
        amount: number;
        operation: "decrease" | "increase";
        order?: number;
    },
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // Calculate the new life points
    const currentLP = options.target === "player" ? state.lifePoints : state.opponentLifePoints;
    const change = options.operation === "decrease" ? -options.amount : options.amount;
    const newLP = Math.max(0, currentLP + change);

    // Update the life points immediately
    if (options.target === "player") {
        state.lifePoints = newLP;
    } else {
        state.opponentLifePoints = newLP;
    }

    // Add the animation to the queue
    pushQueue(state, {
        id: uuidv4(),
        order: options.order ?? 1,
        type: "life_change",
        cardInstance: card,
        effectType: "life_change",
        target: options.target,
        amount: options.amount,
        operation: options.operation,
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

export const withCheckChain = (
    state: GameStore,
    card: CardInstance,
    options: {
        delay?: number;
        order?: number;
        message?: string;
    } = {},
    callback: (state: GameStore, cardInstance: CardInstance, selected?: CardInstance | null) => void
) => {
    pushQueue(state, {
        id: uuidv4(),
        order: options.order ?? 1,
        type: "chain_check",
        cardInstance: card,
        effectType: "chain",
        delay: options.delay,
        callback: (state: GameStore, cardInstance: CardInstance, selected?: CardInstance) => {
            // Execute the callback after the delay
            callback(state, cardInstance, selected);
        },
    });
};

// Check if a card can chain to the current effect
const canChainToEffect = (state: GameStore, card: CardInstance, chain: CardInstance[]): boolean => {
    // Speed Spell (速攻魔法) can chain
    if (isMagicCard(card.card) && card.card.magic_type === "速攻魔法" && card.card.effect?.onChain?.condition) {
        return card.card.effect?.onChain?.condition?.(state, card, chain) ?? false;
    }
    return false;
};

// Get all cards that can chain to the current effect
export const getChainableCards = (state: GameStore, chain: CardInstance[]): CardInstance[] => {
    const chainableCards: CardInstance[] = [];
    // Check hand for speed spells
    const handCards = new CardSelector(state).hand().get();
    for (const card of handCards) {
        if (card && canChainToEffect(state, card, chain)) {
            chainableCards.push(card);
        }
    }

    // Check spell/trap zone for face-down traps and activated cards
    const spellTrapCards = new CardSelector(state).spellTrap().filter().nonNull().get();
    for (const card of spellTrapCards) {
        if (canChainToEffect(state, card, chain)) {
            chainableCards.push(card);
        }
    }

    return chainableCards;
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

export const playCardInternal = (state: GameStore, card: CardInstance) => {
    state.isProcessing = true;
    // Pure card type classification - UI has already checked conditions
    if (card.card.card_type === "魔法") {
        // Handle spell cards
        const magicCard = card.card as MagicCard;
        const spellSubtype = magicCard.magic_type;

        if (spellSubtype === "通常魔法" || spellSubtype === "速攻魔法" || spellSubtype === "儀式魔法") {
            const handler = (state: GameStore, card: CardInstance) => {
                const index = getSpellTrapZoneIndex(state, card);
                if (index !== -1 && card.position === "back") {
                    state.field.spellTrapZones[index]!.position = "attack";
                } else {
                    const availableSpace = state.field.spellTrapZones
                        .map((e, i) => ({ i, e: e }))
                        .filter(({ e }) => e === null)
                        .map((e) => e.i);
                    const index = placementPriority(availableSpace);
                    sendCard(state, card, "SpellField", { spellFieldIndex: index });
                }

                withDelay(state, card, { delay: 500 }, (state, card) => {
                    state.cardChain.unshift(card);
                    withCheckChain(state, card, {}, (state, card, selected) => {
                        if (selected) {
                            card.card.effect.onSpell?.effect(state, card);
                            playCardInternal(state, selected);
                        } else {
                            card.card.effect.onSpell?.effect(state, card);
                        }
                    });

                    pushQueue(state, {
                        order: 100 - state.cardChain.length,
                        id: card.id + "_spell_end",
                        type: "spell_end",
                        cardInstance: card,
                        effectType: "send_to_graveyard",
                        callback: (state, card) => {
                            state.cardChain = state.cardChain.filter((e) => e.id !== card.id);
                        },
                    });
                });
            };
            if (card.card.effect.onSpell?.payCost) {
                card.card.effect.onSpell.payCost(state, card, (state, card) => {
                    handler(state, card);
                });
            } else {
                handler(state, card);
            }
        } else if (spellSubtype === "永続魔法" || spellSubtype === "装備魔法") {
            // Continuous/Equipment spells stay on field
            card.card.effect.onSpell?.effect(state, card);
            sendCard(state, card, "SpellField");
            state.isProcessing = false;
        } else if (spellSubtype === "フィールド魔法") {
            // Field spells go to field zone
            if (state.field.fieldZone !== null) {
                sendCard(state, state.field.fieldZone, "Graveyard");
                withDelay(state, card, { order: -1 }, (state, card) => {
                    sendCard(state, card, "FieldZone");
                    card.card.effect.onSpell?.effect(state, card);
                    state.isProcessing = false;
                });
                return;
            } else {
                sendCard(state, card, "FieldZone");
                card.card.effect.onSpell?.effect(state, card);
                state.isProcessing = false;
            }
        }
    } else if (card.card.card_type === "罠") {
        const index = getSpellTrapZoneIndex(state, card);
        if (index !== -1 && card.position === "back") {
            state.field.spellTrapZones[index]!.position = undefined;
        } else {
            sendCard(state, card, "SpellField", {});
        }
        card.card.effect.onSpell?.effect(state, card);
        pushQueue(state, {
            order: 100,
            id: card.id + "_spell_end",
            type: "spell_end",
            cardInstance: card,
            effectType: "send_to_graveyard",
        });
    } else if (card.card.card_type === "モンスター") {
        // Handle monster cards - add to effect queue for user to choose position and zone
        const level = getLevel(card);
        const needRelease = level <= 4 ? 0 : level <= 6 ? 1 : 2;
        withUserSummon(
            state,
            card,
            card,
            {
                canSelectPosition: true,
                optionPosition: ["attack", "back_defense"],
                needRelease: needRelease,
            },
            (state) => {
                state.hasNormalSummoned = true;
            }
        );
    }
};
