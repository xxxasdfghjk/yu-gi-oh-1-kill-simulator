import type { GameStore } from "@/store/gameStore";
import type { CardInstance, MagicCard, SummonedBy } from "@/types/card";
import { v4 as uuidv4 } from "uuid";
import { getSpellTrapZoneIndex, releaseCardById, sendCard, sendCardById, summon } from "./cardMovement";
import { type EffectQueueItem } from "../store/gameStore";
import { canNormalSummon, getNeedReleaseCount } from "./summonUtils";
import { hasEmptySpellField, isMagicCard, isTrapCard, monsterFilter } from "./cardManagement";
import { CardSelector } from "./CardSelector";
import { placementPriority, getLinkMonsterSummonalble } from "@/components/SummonSelector";
import { isLinkMonster } from "./cardManagement";

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

// Helper function to get summonable zones for a monster
const getSummonableZones = (state: GameStore, monster: CardInstance): number[] => {
    const isLink = isLinkMonster(monster.card);

    if (isLink) {
        return getLinkMonsterSummonalble(state.field.extraMonsterZones, state.field.monsterZones);
    } else if (
        monsterFilter(monster.card) &&
        (monster.card.monster_type === "エクシーズモンスター" || monster.card.monster_type === "シンクロモンスター")
    ) {
        return [
            ...state.field.monsterZones.map((e, index) => ({ elem: e, index })).filter(({ elem }) => elem === null),
            ...state.field.extraMonsterZones
                .map((e, index) => ({ elem: e, index: index + 5 }))
                .filter(({ elem }) => elem === null),
        ].map((e) => e.index);
    } else {
        return [
            ...state.field.monsterZones.map((e, index) => ({ elem: e, index })).filter(({ elem }) => elem === null),
        ].map((e) => e.index);
    }
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
    callback: (state: GameStore, card: CardInstance, option: T) => void,
    canCancel?: boolean
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
        canCancel: canCancel ?? false,
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
        summonType,
    }: {
        order?: number;
        canSelectPosition?: boolean;
        optionPosition?: Exclude<Position, undefined>[];
        needRelease?: number;
        summonType?: SummonedBy;
    },
    callback: (state: GameStore, card: CardInstance, monster: CardInstance) => void
) => {
    const defaultPositon = optionPosition?.[0] ?? "attack";
    const handler = (state: GameStore, card: CardInstance, monster: CardInstance) => {
        const summonable = getSummonableZones(state, monster);
        const defaultZone = placementPriority(summonable);
        if (defaultZone >= 0) {
            state.isProcessing = false;
            const summonResult = summon(state, monster, defaultZone, defaultPositon);
            callback(state, card, summonResult);
            return;
        }
        // If no zone is available, fall back to manual selection
        // This happens mainly with Link monsters when no suitable zones exist
    };
    // Check if auto summon is enabled
    if (state.autoSummon && !needRelease) {
        const summonable = getSummonableZones(state, monster);
        const defaultZone = placementPriority(summonable);
        if (defaultZone >= 0) {
            handler(state, _card, monster);
            return;
        }
        // If auto summon fails (no available zone), fall back to manual selection
        // This happens mainly with Link monsters when no suitable zones exist
    }

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
                        // Check auto summon after release
                        if (state.autoSummon) {
                            const summonable = getSummonableZones(state, monster);
                            const defaultZone = placementPriority(summonable);
                            if (defaultZone >= 0) {
                                handler(state, _card, monster);
                                return;
                            }
                            // If auto summon fails, fall back to manual selection
                        }

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
                                const summonResult = summon(state, cardInstance, result.zone, result.position, {
                                    summonedBy: summonType,
                                });
                                callback(state, cardInstance, summonResult);
                            },
                        });
                    }
                );
            }
        );
    } else {
        // Check auto summon for normal case
        if (state.autoSummon) {
            const summonable = getSummonableZones(state, monster);
            const defaultZone = placementPriority(summonable);
            if (defaultZone >= 0) {
                const summonResult = summon(state, monster, defaultZone, "attack");
                callback(state, _card, summonResult);
                return;
            }
            // If auto summon fails, fall back to manual selection
        }

        pushQueue(state, {
            id: uuidv4(),
            order: order ?? 1,
            type: "summon",
            cardInstance: monster,
            effectType: "with_user_summon_callback",
            canSelectPosition: canSelectPosition ?? true,
            optionPosition: optionPosition ?? ["attack", "defense"],
            callback: (state: GameStore, cardInstance: CardInstance, result: { zone: number; position: Position }) => {
                const summonResult = summon(state, cardInstance, result.zone, result.position, {
                    summonedBy: summonType,
                });
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

    // Victory conditions will be checked by GameBoard useEffect

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

export const withSendToGraveyardFromDeckTop = (
    state: GameStore,
    card: CardInstance,
    count: number,
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    withDelayRecursive(
        state,
        card,
        {},
        count,
        (state, card) => {
            sendCard(state, state.deck[0], "Graveyard", { effectedBy: card });
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
    // Execute callback after all cards are drawn
};

export const withSendToGraveyard = (
    state: GameStore,
    card: CardInstance,
    cardList: CardInstance[],
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    const idList = cardList.map((c) => c.id);
    withDelayRecursive(
        state,
        card,
        {},
        cardList.length,
        (state, _, depth) => {
            sendCardById(state, idList[depth - 1], "Graveyard");
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
    // Execute callback after all cards are drawn
};

export const withSendToDeckTop = (
    state: GameStore,
    card: CardInstance,
    cardList: CardInstance[],
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    const idList = cardList.map((c) => c.id);
    withDelayRecursive(
        state,
        card,
        {},
        cardList.length,
        (state, _, depth) => {
            sendCardById(state, idList[depth - 1], "Deck");
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
    // Execute callback after all cards are drawn
};

export const withSendDeckBottom = (
    state: GameStore,
    card: CardInstance,
    cardIdList: string[],
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // シャッフルして順番をランダムにする
    const shuffledIdList = [...cardIdList].sort(() => Math.random() - 0.5);

    withDelayRecursive(
        state,
        card,
        {},
        shuffledIdList.length,
        (state, _, depth) => {
            sendCardById(state, shuffledIdList[depth - 1], "Deck", { deckTop: false });
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
};

export const withDraw = (
    state: GameStore,
    card: CardInstance,
    options: {
        count: number;
        order?: number;
        target?: "player" | "opponent";
    },
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    const target = options.target ?? "player";

    if (target === "player") {
        // Check if there are enough cards to draw
        if (state.deck.length < options.count) {
            // Not enough cards to draw - player loses
            state.gameOver = true;
            state.winner = "timeout";
            state.winReason = "deck_out";
            return;
        }

        // Draw cards from deck to hand
        withDelayRecursive(
            state,
            card,
            {},
            options.count,
            (state) => {
                if (state.deck.length > 0) {
                    sendCard(state, state.deck[0], "Hand");
                } else {
                    state.gameOver = true;
                    state.winner = "timeout";
                    state.winReason = "deck_out";
                }
            },
            (state, card) => {
                if (callback) {
                    callback(state, card);
                }
            }
        );
        // Execute callback after all cards are drawn
    }
};

export const withExclusionMonsters = (
    state: GameStore,
    card: CardInstance,
    options: {
        cardIdList: string[];
    },
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // Draw cards from deck to hand
    withDelayRecursive(
        state,
        card,
        {},
        options.cardIdList.length,
        (state, _, depth) => {
            sendCardById(state, options.cardIdList[depth - 1], "Exclusion");
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
    // Execute callback after all cards are drawn
};

export const withReleaseMonsters = (
    state: GameStore,
    card: CardInstance,
    options: {
        cardIdList: string[];
    },
    callback?: (state: GameStore, cardInstance: CardInstance) => void
) => {
    withDelayRecursive(
        state,
        card,
        {},
        options.cardIdList.length,
        (state, _, depth) => {
            releaseCardById(state, options.cardIdList[depth - 1]);
        },
        (state, card) => {
            if (callback) {
                callback(state, card);
            }
        }
    );
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

const canActivateMagicOrTrapCard = (state: GameStore, card: CardInstance) => {
    return (
        (isMagicCard(card.card) &&
            card.card.effect?.onSpell?.condition(state, card) &&
            (hasEmptySpellField(state) ||
                (card.location === "SpellField" && card.position === "back") ||
                (card.location === "FieldZone" && card.position === "back")) &&
            card.position !== "attack" &&
            (card.location === "Hand" || card.location === "SpellField" || card.location === "FieldZone") &&
            (card.card.magic_type !== "フィールド魔法" ||
                state.isFieldSpellActivationAllowed === card.id ||
                state.isFieldSpellActivationAllowed === null) &&
            (card.card.magic_type !== "速攻魔法" ||
                card.location !== "SpellField" ||
                card.position !== "back" ||
                card.setTurn !== state.turn) &&
            state.phase === "main1") ||
        (isTrapCard(card.card) &&
            card.card.effect.onSpell?.condition(state, card) &&
            card.location === "SpellField" &&
            (card?.setTurn ?? 999999) < state.turn)
    );
};

export const getCardActions = (gameState: GameStore, card: CardInstance): string[] => {
    if (gameState.isProcessing) {
        return [];
    }
    const actions: string[] = [];
    if (monsterFilter(card.card) && canNormalSummon(gameState, card) && card.location === "Hand") {
        actions.push("summon");
    }
    if (canActivateMagicOrTrapCard(gameState, card)) {
        actions.push("activate");
    }

    if (
        (isTrapCard(card.card) || isMagicCard(card.card)) &&
        hasEmptySpellField(gameState) &&
        card.location === "Hand" &&
        gameState.phase === "main1" &&
        (!isMagicCard(card.card) ||
            card.card.magic_type !== "フィールド魔法" ||
            gameState.isFieldSpellActivationAllowed === null)
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
            const handler = (state: GameStore, card: CardInstance, context?: Record<string, number | string>) => {
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
                        card.card.effect.onSpell?.effect(state, card, context, (state, card) => {
                            withDelay(state, card, {}, (state, card) => {
                                sendCard(state, card, "Graveyard");
                                state.cardChain.shift();
                                state.isProcessing = false;
                            });
                        });
                        if (selected) {
                            playCardInternal(state, selected);
                        }
                    });
                });
            };
            if (card.card.effect.onSpell?.payCost) {
                card.card.effect.onSpell.payCost(state, card, (state, card, context) => {
                    handler(state, card, context);
                });
            } else {
                handler(state, card, undefined);
            }
        } else if (spellSubtype === "永続魔法" || spellSubtype === "装備魔法") {
            // Continuous/Equipment spells stay on field
            if (card.card.effect.onSpell?.payCost) {
                card.card.effect.onSpell.payCost(state, card, (state, card) => {
                    sendCard(state, card, "SpellField");
                    card.card.effect.onSpell?.effect(state, card, undefined, (state, card) => {
                        withDelay(state, card, {}, (state) => {
                            state.isProcessing = false;
                        });
                    });
                });
            } else {
                sendCard(state, card, "SpellField");
                card.card.effect.onSpell?.effect(state, card, undefined, (state, card) => {
                    withDelay(state, card, {}, (state) => {
                        state.isProcessing = false;
                    });
                });
            }
        } else if (spellSubtype === "フィールド魔法") {
            // Field spells go to field zone
            if (state.field.fieldZone !== null && state.field.fieldZone?.id !== card?.id) {
                sendCard(state, state.field.fieldZone, "Graveyard");
                withDelay(state, card, { order: -1 }, (state, card) => {
                    sendCard(state, card, "FieldZone");
                    card.card.effect.onSpell?.effect(state, card, undefined, () => {
                        state.isProcessing = false;
                    });
                });
                return;
            } else {
                sendCard(state, card, "FieldZone");
                card.card.effect.onSpell?.effect(state, card, undefined, (state) => {
                    state.isProcessing = false;
                });
            }
        }
    } else if (card.card.card_type === "罠") {
        const index = getSpellTrapZoneIndex(state, card);
        if (index !== -1 && card.position === "back") {
            state.field.spellTrapZones[index]!.position = undefined;
        } else {
            sendCard(state, card, "SpellField", {});
        }
        card.card.effect.onSpell?.effect(state, card, undefined, (state, card) => {
            withDelay(state, card, {}, (state, card) => {
                sendCard(state, card, "Graveyard");
                state.isProcessing = false;
            });
        });
    } else if (card.card.card_type === "モンスター") {
        // Handle monster cards - add to effect queue for user to choose position and zone
        const needRelease = getNeedReleaseCount(state, card);
        withUserSummon(
            state,
            card,
            card,
            {
                canSelectPosition: true,
                optionPosition: ["attack", "back_defense"],
                needRelease: needRelease,
                summonType: "Normal",
            },
            (state) => {
                state.hasNormalSummoned = true;
            }
        );
    }
};

export const getPayLifeCost = (state: GameStore, card: CardInstance, lifeCost: number): number => {
    const fieldCard = new CardSelector(state).allMonster().allFieldSpellTrap().field().getNonNull();
    let payCost = lifeCost;
    for (const target of fieldCard) {
        if (target.card.effect?.onPayLifeCost) {
            payCost = target.card.effect?.onPayLifeCost?.(state, target, card, payCost);
        }
    }
    return payCost;
};
