import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, GamePhase } from "@/types/game";
import { loadDeckData } from "@/data/cardLoader";
import { createCardInstance, shuffleDeck, drawCards, isMonsterCard, isSpellCard, isTrapCard } from "@/utils/gameUtils";
import {
    canNormalSummon,
    findEmptyMonsterZone,
    canActivateSpell,
    findEmptySpellTrapZone,
    canSetSpellTrap,
    canActivateHokyuYoin,
} from "@/utils/summonUtils";
import type { CardInstance } from "@/types/card";

interface GameStore extends GameState {
    initializeGame: () => void;
    drawCard: (count?: number) => void;
    nextPhase: () => void;
    selectCard: (cardId: string) => void;
    playCard: (cardId: string, zone?: number) => void;
    summonMonster: (cardId: string, position: "attack" | "facedown_defense", zone?: number) => void;
    setCard: (cardId: string, zone?: number) => void;
    activateFieldCard: (cardId: string) => void;
    activateSetCard: (cardId: string) => void;
    activateSpellEffect: (card: CardInstance) => void;
    selectFromDeck: (targetCard: CardInstance) => void;
    selectForJackInHand: (selectedCards: CardInstance[]) => void;
    continueJackInHand: () => void;
    selectPlayerCardFromJack: (selectedCard: CardInstance) => void;
    selectExtravaganceCount: (count: 3 | 6) => void;
    selectCardFromExtravagance: (selectedCard: CardInstance) => void;
    selectCardFromRevealedCards: (selectedCard: CardInstance, remainingCards: CardInstance[]) => void;
    selectRitualMonster: (ritualMonster: CardInstance) => void;
    selectNormalMonstersForRitual: (normalMonsters: CardInstance[]) => void;
    activateChickenRaceEffect: (effectType: "draw" | "destroy" | "heal") => void;
    setPhase: (phase: GamePhase) => void;
    activateTrapCard: (card: CardInstance) => void;
    declineTrapActivation: () => void;
    selectHokyuyoinTargets: (selectedCards: CardInstance[]) => void;
    selectBonmawashiCards: (selectedCards: CardInstance[]) => void;
    selectBonmawashiForPlayer: (card: CardInstance) => void;
    checkBonmawashiRestriction: () => void;
    activateOpponentFieldSpell: () => void;
    activateBanAlpha: (banAlphaCard: CardInstance) => void;
    selectBanAlphaReleaseTarget: (targetCard: CardInstance) => void;
    selectBanAlphaRitualMonster: (ritualMonster: CardInstance) => void;
    checkCritterEffect: (card: CardInstance) => void;
    startLinkSummon: (linkMonster: CardInstance) => void;
    selectLinkMaterials: (materials: CardInstance[]) => void;
    summonLinkMonster: (zone: number) => void;
    selectedCard: string | null;
    searchingEffect: {
        cardName: string;
        availableCards: CardInstance[];
        effectType: string;
    } | null;
    summonSelecting: {
        cardId: string;
    } | null;
    jackInHandState: {
        phase: "select_three" | "opponent_takes" | "player_selects";
        availableCards: CardInstance[];
        selectedThree: CardInstance[];
        opponentCard?: CardInstance;
        remainingCards?: CardInstance[];
    } | null;
    extravaganceState: {
        phase: "select_count" | "select_card_from_deck";
        revealedCards?: CardInstance[];
        banishedCount?: number;
    } | null;
    advancedRitualState: {
        phase: "select_ritual_monster" | "select_normal_monsters";
        selectedRitualMonster?: CardInstance;
        requiredLevel?: number;
        availableNormals?: CardInstance[];
    } | null;
    bonmawashiState: {
        phase: "select_two" | "select_for_player";
        selectedCards?: CardInstance[];
    } | null;
    banAlphaState: {
        phase: "select_release_target" | "select_ritual_monster";
        banAlphaCard?: CardInstance;
        availableTargets?: CardInstance[];
    } | null;
    linkSummonState: {
        phase: "select_materials";
        linkMonster?: CardInstance;
        requiredMaterials?: number;
        selectedMaterials?: CardInstance[];
        availableMaterials?: CardInstance[];
    } | null;
    oneForOneTarget: CardInstance | null;
}

const initialState: GameState = {
    turn: 1,
    phase: "main1",
    lifePoints: 8000,
    deck: [],
    hand: [],
    field: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
        extraMonsterZones: [null, null],
    },
    opponentField: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
        extraMonsterZones: [null, null],
    },
    graveyard: [],
    banished: [],
    extraDeck: [],
    hasNormalSummoned: false,
    hasSpecialSummoned: false,
    hasDrawnByEffect: false,
    hasActivatedExtravagance: false,
    hasActivatedChickenRace: false,
    hasActivatedFafnir: false,
    hasActivatedBanAlpha: false,
    hasActivatedCritter: false,
    isOpponentTurn: false,
    pendingTrapActivation: null,
    bonmawashiRestriction: false,
    currentChain: [],
    canActivateEffects: true,
    gameOver: false,
    winner: null,
    linkSummonState: null,
};

const phaseOrder: GamePhase[] = ["draw", "standby", "main1", "end"];

export const useGameStore = create<GameStore>()(
    immer((set, get) => ({
        ...initialState,
        selectedCard: null,
        searchingEffect: null,
        summonSelecting: null,
        jackInHandState: null,
        extravaganceState: null,
        advancedRitualState: null,
        bonmawashiState: null,
        banAlphaState: null,
        linkSummonState: null,
        oneForOneTarget: null,

        initializeGame: () => {
            const deckData = loadDeckData();

            const mainDeckInstances = deckData.main_deck.flatMap((card) =>
                Array(card.quantity)
                    .fill(null)
                    .map(() => createCardInstance(card, "deck"))
            );

            const extraDeckInstances = deckData.extra_deck.flatMap((card) =>
                Array(card.quantity)
                    .fill(null)
                    .map(() => createCardInstance(card, "extra_deck"))
            );

            set((state) => {
                state.deck = shuffleDeck(mainDeckInstances);
                state.extraDeck = extraDeckInstances;
                state.hand = [];
                state.graveyard = [];
                state.banished = [];
                state.field = {
                    monsterZones: Array(5).fill(null),
                    spellTrapZones: Array(5).fill(null),
                    fieldZone: null,
                    extraMonsterZones: [null, null],
                };
                state.opponentField = {
                    monsterZones: Array(5).fill(null),
                    spellTrapZones: Array(5).fill(null),
                    fieldZone: null,
                    extraMonsterZones: [null, null],
                };
                state.turn = 1;
                state.phase = "main1";
                state.lifePoints = 8000;
                state.hasNormalSummoned = false;
                state.hasSpecialSummoned = false;
                state.hasDrawnByEffect = false;
                state.hasActivatedExtravagance = false;
                state.hasActivatedChickenRace = false;
                state.hasActivatedFafnir = false;
                state.hasActivatedBanAlpha = false;
                state.hasActivatedCritter = false;
                state.isOpponentTurn = false;
                state.pendingTrapActivation = null;
                state.bonmawashiRestriction = false;
                state.gameOver = false;
                state.winner = null;
                state.selectedCard = null;
                state.summonSelecting = null;
                state.jackInHandState = null;
                state.extravaganceState = null;
                state.advancedRitualState = null;
                state.bonmawashiState = null;
                state.banAlphaState = null;
                state.linkSummonState = null;
                state.oneForOneTarget = null;
            });

            // 初期手札15枚をドロー（デバッグ用）
            // まず愚かな埋葬をデッキから手札に移動
            set((state) => {
                console.log("Deck size before foolish burial search:", state.deck.length);
                const foolishBurialIndex = state.deck.findIndex((card) => card.card.card_name === "おろかな埋葬");
                console.log("Foolish burial index:", foolishBurialIndex);
                if (foolishBurialIndex !== -1) {
                    const foolishBurial = state.deck[foolishBurialIndex];
                    foolishBurial.location = "hand";
                    state.hand.push(foolishBurial);
                    state.deck.splice(foolishBurialIndex, 1);
                    console.log("Added おろかな埋葬 to starting hand for debugging");
                    console.log("Hand size after adding foolish burial:", state.hand.length);
                } else {
                    console.log("おろかな埋葬 not found in deck!");
                    // デッキの全カード名をログ出力してデバッグ
                    console.log(
                        "All cards in deck:",
                        state.deck.map((card) => card.card.card_name)
                    );
                }
                
                // クリッターもデッキから手札に移動（デバッグ用）
                const critterIndex = state.deck.findIndex((card) => card.card.card_name === "クリッター");
                if (critterIndex !== -1) {
                    const critter = state.deck[critterIndex];
                    critter.location = "hand";
                    state.hand.push(critter);
                    state.deck.splice(critterIndex, 1);
                    console.log("Added クリッター to starting hand for debugging");
                }
            });

            // 残り14枚をドロー（愚かな埋葬が見つからなかった場合は15枚）
            const currentHandSize = get().hand.length;
            const remainingCards = 15 - currentHandSize;
            console.log("Drawing remaining cards:", remainingCards);
            if (remainingCards > 0) {
                get().drawCard(remainingCards);
            }
        },

        drawCard: (count = 1) => {
            set((state) => {
                const newState = drawCards(state, count);
                Object.assign(state, newState);

                // エクゾディア勝利判定（デバッグ用に一時無効）
                // if (checkExodiaWin(state.hand)) {
                //     state.gameOver = true;
                //     state.winner = "player";
                // }
            });
        },

        nextPhase: () => {
            const currentState = get();

            if (currentState.isOpponentTurn) {
                // 相手ターン中の場合、プレイヤーターンに戻る
                set((state) => {
                    state.isOpponentTurn = false;
                    state.phase = "draw";
                    state.turn += 1;
                    state.hasNormalSummoned = false;
                    state.hasSpecialSummoned = false;
                    state.hasDrawnByEffect = false;
                    state.hasActivatedExtravagance = false;
                    state.hasActivatedChickenRace = false;
                    state.hasActivatedFafnir = false;
                    state.hasActivatedBanAlpha = false;
                });

                // プレイヤーターンのドローフェイズ
                get().drawCard(1);
                return;
            }

            const currentPhaseIndex = phaseOrder.indexOf(currentState.phase);
            const nextPhaseIndex = (currentPhaseIndex + 1) % phaseOrder.length;
            const nextPhase = phaseOrder[nextPhaseIndex];

            if (nextPhase === "draw") {
                // エンドフェーズ後、相手ターンに移行
                set((state) => {
                    state.isOpponentTurn = true;
                    state.phase = "main1"; // 相手のメインフェーズ
                });

                // 補充要員の確認（セットしたターンではない場合のみ、かつ発動条件を満たす場合のみ）
                const hokyuYoin = currentState.field.spellTrapZones.find(
                    (card) =>
                        card &&
                        card.card.card_name === "補充要員" &&
                        card.position === "facedown" &&
                        card.setTurn !== currentState.turn && // セットしたターンではない
                        canActivateHokyuYoin(currentState) // 墓地にモンスター5体以上
                );

                if (hokyuYoin) {
                    set((state) => {
                        state.pendingTrapActivation = hokyuYoin;
                    });
                }
            } else {
                // 通常のフェーズ移行
                set((state) => {
                    state.phase = nextPhase;
                });
            }
        },

        selectCard: (cardId: string) => {
            set((state) => {
                state.selectedCard = state.selectedCard === cardId ? null : cardId;
            });
        },

        playCard: (cardId: string, zone?: number) => {
            console.log("=== playCard START ===");
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                console.log("Card not found:", cardId);
                return;
            }

            console.log("Playing card:", card.card.card_name, "Type:", card.card.card_type);
            console.log("Before playCard - extravaganceState:", get().extravaganceState);

            set((state) => {
                if (isMonsterCard(card.card)) {
                    // モンスターの場合は召喚選択モードに移行
                    if (!canNormalSummon(state, card)) return;

                    state.summonSelecting = {
                        cardId: cardId,
                    };
                    return;
                } else if (isSpellCard(card.card)) {
                    // 魔法カードの発動処理
                    console.log("Attempting to activate spell:", card.card.card_name);
                    console.log("Can activate spell:", canActivateSpell(state, card.card));
                    console.log("Current phase:", state.phase);
                    if (!canActivateSpell(state, card.card)) {
                        console.log("Cannot activate spell card");
                        return;
                    }

                    // 手札から削除
                    console.log("Removing card from hand");
                    state.hand = state.hand.filter((c) => c.id !== cardId);

                    if (card.card.card_type === "フィールド魔法") {
                        console.log("Activating field spell");
                        // 既存のフィールド魔法を墓地へ
                        if (state.field.fieldZone) {
                            const oldFieldCard = { ...state.field.fieldZone, location: "graveyard" as const };
                            state.graveyard.push(oldFieldCard);

                            // 盆回し制限チェック
                            if (oldFieldCard.setByBonmawashi) {
                                setTimeout(() => get().checkBonmawashiRestriction(), 0);
                            }
                        }
                        const updatedCard = { ...card, location: "field_spell_trap" as const };
                        state.field.fieldZone = updatedCard;
                    } else if (
                        card.card.card_type === "通常魔法" ||
                        card.card.card_type === "速攻魔法" ||
                        card.card.card_type === "儀式魔法"
                    ) {
                        // 通常魔法・速攻魔法・儀式魔法は発動後墓地へ
                        console.log("Activating normal/quick-play/ritual spell, sending to graveyard");
                        const updatedCard = { ...card, location: "graveyard" as const };
                        state.graveyard.push(updatedCard);

                        // 効果処理は後で実行するためのフラグを設定
                        console.log("Marking spell for effect processing");
                    } else {
                        // 永続魔法・装備魔法は魔法・罠ゾーンへ
                        const targetZone = zone ?? findEmptySpellTrapZone(state);
                        if (targetZone === -1) return;

                        const updatedCard = {
                            ...card,
                            location: "field_spell_trap" as const,
                            zone: targetZone,
                        };
                        state.field.spellTrapZones[targetZone] = updatedCard;
                    }
                }

                state.selectedCard = null;
                console.log("=== playCard END ===");
            });

            // set()の外で効果処理を実行
            if (
                isSpellCard(card.card) &&
                (card.card.card_type === "通常魔法" ||
                    card.card.card_type === "速攻魔法" ||
                    card.card.card_type === "儀式魔法" ||
                    card.card.card_type === "フィールド魔法")
            ) {
                console.log("Executing spell effect outside set()");
                console.log("extravaganceState before activateSpellEffect:", get().extravaganceState);
                get().activateSpellEffect(card);
                console.log("extravaganceState after activateSpellEffect:", get().extravaganceState);
            }
        },

        setCard: (cardId: string, zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                console.log("Card not found:", cardId);
                return;
            }

            console.log("Setting card:", card.card.card_name, "Type:", card.card.card_type);

            set((state) => {
                if (!canSetSpellTrap(state, card.card)) {
                    console.log("Cannot set card");
                    return;
                }

                // 手札から削除
                console.log("Removing card from hand");
                state.hand = state.hand.filter((c) => c.id !== cardId);

                // 魔法・罠ゾーンにセット（伏せ状態）
                const targetZone = zone ?? findEmptySpellTrapZone(state);
                if (targetZone === -1) return;

                const updatedCard = {
                    ...card,
                    location: "field_spell_trap" as const,
                    zone: targetZone,
                    position: "facedown" as const,
                    setTurn: state.turn, // セットしたターン番号を記録
                };
                state.field.spellTrapZones[targetZone] = updatedCard;
                console.log("Card set facedown in zone:", targetZone);

                state.selectedCard = null;
            });
        },

        summonMonster: (cardId: string, position: "attack" | "facedown_defense", zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                console.log("Card not found:", cardId);
                return;
            }

            console.log("Summoning monster:", card.card.card_name, "Position:", position);

            set((state) => {
                if (!isMonsterCard(card.card)) return;
                if (!canNormalSummon(state, card)) return;

                const targetZone = zone ?? findEmptyMonsterZone(state);
                if (targetZone === -1) return;

                // 手札から削除
                state.hand = state.hand.filter((c) => c.id !== cardId);

                // フィールドに配置
                const updatedCard = {
                    ...card,
                    location: "field_monster" as const,
                    position: position === "attack" ? ("attack" as const) : ("facedown" as const),
                    zone: targetZone,
                };
                state.field.monsterZones[targetZone] = updatedCard;
                state.hasNormalSummoned = true;

                console.log(`Monster summoned in ${position} position in zone ${targetZone}`);

                state.selectedCard = null;
                state.summonSelecting = null;
            });
        },

        activateFieldCard: (cardId: string) => {
            const gameState = get();

            // フィールドにあるカードを探す
            const fieldCard =
                gameState.field.fieldZone?.id === cardId
                    ? gameState.field.fieldZone
                    : gameState.field.spellTrapZones.find((card) => card?.id === cardId) ||
                      gameState.field.monsterZones.find((card) => card?.id === cardId);

            if (!fieldCard) {
                console.log("Field card not found:", cardId);
                return;
            }

            console.log("Activating field card effect:", fieldCard.card.card_name);

            // チキンレースの効果はUI側で選択肢を表示して処理
            if (fieldCard.card.card_name === "チキンレース") {
                console.log("チキンレース clicked - effect selection will be handled by UI");
                // 実際の効果はactivateChickenRaceEffect関数で処理
                return; // UI側で処理するため、ここでは何もしない
            }

            // 他のカードの効果もここに追加可能
        },

        activateSetCard: (cardId: string) => {
            const gameState = get();

            // フィールドにある伏せカードを探す
            let setCard: CardInstance | null = null;
            let zoneIndex = -1;

            // 魔法・罠ゾーンから伏せカードを探す
            for (let i = 0; i < gameState.field.spellTrapZones.length; i++) {
                const card = gameState.field.spellTrapZones[i];
                if (card?.id === cardId && card.position === "facedown") {
                    setCard = card;
                    zoneIndex = i;
                    break;
                }
            }

            if (!setCard) {
                console.log("Set card not found or not facedown:", cardId);
                return;
            }

            console.log("Activating set card:", setCard.card.card_name);

            set((state) => {
                if (!setCard) return;

                // 魔法カードの場合
                if (isSpellCard(setCard.card)) {
                    // メインフェイズでのみ発動可能（速攻魔法は例外）
                    if (setCard.card.card_type !== "速攻魔法" && state.phase !== "main1" && state.phase !== "main2") {
                        console.log("Cannot activate spell card outside main phase");
                        return;
                    }

                    console.log("Activating set spell card:", setCard.card.card_name);

                    // 永続魔法・装備魔法以外は墓地へ
                    if (setCard.card.card_type === "通常魔法" || setCard.card.card_type === "速攻魔法") {
                        // ゾーンから削除
                        state.field.spellTrapZones[zoneIndex] = null;

                        // 墓地へ送る
                        const updatedCard = { ...setCard, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(updatedCard);

                        console.log("Set spell card activated and sent to graveyard");

                        // 効果処理を実行
                        get().activateSpellEffect(setCard);
                    } else {
                        // 永続魔法・装備魔法は表向きにする
                        const updatedCard = { ...setCard, position: undefined };
                        state.field.spellTrapZones[zoneIndex] = updatedCard;

                        console.log("Set continuous spell card flipped face-up");
                    }

                    // TODO: カード固有の効果処理をここに追加
                } else if (isTrapCard(setCard.card)) {
                    console.log("Activating set trap card:", setCard.card.card_name);

                    // 罠カードはセットしたターンには発動できない
                    if (setCard.setTurn === state.turn) {
                        console.log("Cannot activate trap card: set this turn");
                        return;
                    }

                    // 補充要員の特別な発動条件チェック
                    if (setCard.card.card_name === "補充要員" && !canActivateHokyuYoin(state)) {
                        console.log("Cannot activate 補充要員: need 5 or more monsters in graveyard");
                        return;
                    }

                    // 通常罠は墓地へ、永続罠は表向きに
                    if (setCard.card.card_type === "通常罠カード") {
                        // ゾーンから削除
                        state.field.spellTrapZones[zoneIndex] = null;

                        // 墓地へ送る
                        const updatedCard = { ...setCard, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(updatedCard);

                        console.log("Set trap card activated and sent to graveyard");
                    } else {
                        // 永続罠・カウンター罠は表向きにする
                        const updatedCard = { ...setCard, position: undefined };
                        state.field.spellTrapZones[zoneIndex] = updatedCard;

                        console.log("Set continuous trap card flipped face-up");
                    }

                    // TODO: カード固有の効果処理をここに追加
                }
            });
        },

        activateSpellEffect: (card: CardInstance) => {
            console.log("Executing spell effect for:", card.card.card_name);

            set((state) => {
                switch (card.card.card_name) {
                    case "金満で謙虚な壺": {
                        console.log("Activating 金満で謙虚な壺 effect");

                        // EXデッキから3枚または6枚除外を選択
                        if (state.extraDeck.length >= 3) {
                            state.extravaganceState = {
                                phase: "select_count",
                            };
                            state.hasActivatedExtravagance = true; // 金満で謙虚な壺を発動したフラグを立てる
                            console.log("金満で謙虚な壺: Choose number of cards to banish");
                            console.log("Set extravaganceState:", state.extravaganceState);
                            console.log("Current searchingEffect:", state.searchingEffect);

                            // 状態設定後に即座に確認
                            setTimeout(() => {
                                const currentState = get();
                                console.log("After set - extravaganceState:", currentState.extravaganceState);
                                console.log("After set - searchingEffect:", currentState.searchingEffect);
                            }, 0);
                        } else {
                            console.log("Not enough cards in EX deck for 金満で謙虚な壺");
                        }
                        break;
                    }

                    case "ワン・フォー・ワン": {
                        console.log("Activating ワン・フォー・ワン effect");

                        // まず手札のモンスターを1体墓地に送る
                        const handMonsters = state.hand.filter((c) => isMonsterCard(c.card));
                        if (handMonsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "ワン・フォー・ワン（手札のモンスターを墓地へ）",
                                availableCards: handMonsters,
                                effectType: "one_for_one_discard_hand",
                            };
                        }
                        break;
                    }

                    case "おろかな埋葬": {
                        console.log("Activating おろかな埋葬 effect");

                        // デッキからモンスター1体をユーザーに選択させる（全モンスターを表示）
                        const deckMonsters = state.deck.filter((c) => isMonsterCard(c.card));
                        if (deckMonsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "おろかな埋葬",
                                availableCards: deckMonsters,
                                effectType: "foolish_burial_select",
                            };
                            console.log(state.searchingEffect);
                        }
                        break;
                    }

                    case "ジャック・イン・ザ・ハンド": {
                        console.log("Activating ジャック・イン・ザ・ハンド effect");

                        // デッキから異なるレベル1モンスター3体を探す
                        const level1Monsters = state.deck.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as { level?: number };
                            return monster.level === 1;
                        });

                        // 異なるカード名のモンスターを最大3体まで取得
                        const uniqueMonsters: CardInstance[] = [];
                        const seenNames = new Set<string>();

                        for (const monster of level1Monsters) {
                            if (!seenNames.has(monster.card.card_name) && uniqueMonsters.length < 3) {
                                uniqueMonsters.push(monster);
                                seenNames.add(monster.card.card_name);
                            }
                        }

                        if (uniqueMonsters.length >= 3) {
                            // 3体選択できる場合のみ発動
                            state.jackInHandState = {
                                phase: "select_three",
                                availableCards: level1Monsters,
                                selectedThree: [],
                            };

                            state.searchingEffect = {
                                cardName: "ジャック・イン・ザ・ハンド（3体選択）",
                                availableCards: level1Monsters,
                                effectType: "jack_in_hand_select_three",
                            };
                        } else {
                            console.log("Not enough different Level 1 monsters for ジャック・イン・ザ・ハンド");
                        }
                        break;
                    }

                    case "エマージェンシー・サイバー": {
                        console.log("Activating エマージェンシー・サイバー effect");

                        // 対象：「サイバー・ドラゴン」モンスターまたは通常召喚できない機械族・光属性モンスター
                        const targetMonsters = state.deck.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as {
                                card_name?: string;
                                race?: string;
                                attribute?: string;
                                card_type?: string;
                            };

                            // サイバー・ドラゴンモンスター
                            if (monster.card_name?.includes("サイバー・ドラゴン")) return true;

                            // 通常召喚できない機械族・光属性モンスター
                            if (
                                monster.race === "機械族" &&
                                monster.attribute === "光属性" &&
                                monster.card_type === "特殊召喚・効果モンスター"
                            ) {
                                return true;
                            }

                            return false;
                        });

                        if (targetMonsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "エマージェンシー・サイバー",
                                availableCards: targetMonsters,
                                effectType: "select_one",
                            };
                        }
                        break;
                    }

                    case "極超の竜輝巧": {
                        console.log("Activating 極超の竜輝巧 effect");

                        // デッキから「ドライトロン」モンスター1体を特殊召喚
                        const drytronMonsters = state.deck.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            return c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                        });

                        if (drytronMonsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "極超の竜輝巧",
                                availableCards: drytronMonsters,
                                effectType: "special_summon",
                            };
                        }
                        break;
                    }

                    case "テラ・フォーミング": {
                        console.log("Activating テラ・フォーミング effect");

                        // デッキからフィールド魔法カード1枚を手札に加える
                        const fieldSpells = state.deck.filter((c) => c.card.card_type === "フィールド魔法");
                        if (fieldSpells.length > 0) {
                            state.searchingEffect = {
                                cardName: "テラ・フォーミング",
                                availableCards: fieldSpells,
                                effectType: "select_one",
                            };
                        }
                        break;
                    }

                    case "盆回し": {
                        console.log("Activating 盆回し effect");

                        // デッキから異なるフィールド魔法を取得
                        const fieldSpells = state.deck.filter((c) => c.card.card_type === "フィールド魔法");

                        // 異なるカード名のフィールド魔法を取得
                        const uniqueFieldSpells: CardInstance[] = [];
                        const seenNames = new Set<string>();

                        for (const spell of fieldSpells) {
                            if (!seenNames.has(spell.card.card_name)) {
                                uniqueFieldSpells.push(spell);
                                seenNames.add(spell.card.card_name);
                            }
                        }

                        if (uniqueFieldSpells.length >= 2) {
                            // 2枚のフィールド魔法を選択するUIを表示
                            state.searchingEffect = {
                                cardName: "盆回し（フィールド魔法2枚選択）",
                                availableCards: uniqueFieldSpells,
                                effectType: "bonmawashi_select",
                            };
                        } else {
                            console.log("Not enough different field spells for 盆回し");
                        }
                        break;
                    }

                    case "竜輝巧－ファフニール": {
                        console.log("Activating 竜輝巧－ファフニール effect");

                        // ターンに1回制限フラグを設定
                        state.hasActivatedFafnir = true;

                        // 発動時効果：デッキから「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カードを手札に加える
                        console.log("=== Fafnir Debug ===");
                        console.log("Total deck size:", state.deck.length);

                        // デッキの全カードをチェック
                        const allDrytronCards = state.deck.filter((c) => {
                            const isDrytron =
                                c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                            return isDrytron;
                        });
                        console.log(
                            "All Drytron cards in deck:",
                            allDrytronCards.map((c) => c.card.card_name)
                        );

                        const drytronSpellTraps = state.deck.filter((c) => {
                            const isSpellOrTrap = c.card.card_type.includes("魔法") || c.card.card_type.includes("罠");
                            const isDrytron =
                                c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                            const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";

                            console.log(
                                `Card: ${c.card.card_name}, Type: ${c.card.card_type}, IsSpellTrap: ${isSpellOrTrap}, IsDrytron: ${isDrytron}, IsNotFafnir: ${isNotFafnir}`
                            );

                            return isSpellOrTrap && isDrytron && isNotFafnir;
                        });

                        console.log(
                            "Valid Drytron spell/trap cards:",
                            drytronSpellTraps.map((c) => c.card.card_name)
                        );
                        console.log("Count:", drytronSpellTraps.length);
                        console.log("==================");

                        if (drytronSpellTraps.length > 0) {
                            state.searchingEffect = {
                                cardName: "竜輝巧－ファフニール（ドライトロン魔法・罠カード選択）",
                                availableCards: drytronSpellTraps,
                                effectType: "select_one",
                            };
                            console.log("Set searchingEffect for Fafnir:", state.searchingEffect);
                        } else {
                            console.log("No Drytron spell/trap cards available for 竜輝巧－ファフニール");
                        }
                        break;
                    }

                    case "儀式の準備": {
                        console.log("Activating 儀式の準備 effect");

                        // デッキから儀式魔法カード1枚をユーザーに選択させる
                        const ritualSpells = state.deck.filter((c) => c.card.card_type === "儀式魔法");
                        if (ritualSpells.length > 0) {
                            state.searchingEffect = {
                                cardName: "儀式の準備（儀式魔法選択）",
                                availableCards: ritualSpells,
                                effectType: "ritual_preparation_spell",
                            };
                        }
                        break;
                    }

                    case "高等儀式術": {
                        console.log("Activating 高等儀式術 effect");

                        // 手札から儀式モンスターを選択させる
                        const ritualMonsters = state.hand.filter(
                            (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                        );
                        console.log(
                            "Found ritual monsters in hand:",
                            ritualMonsters.map((c) => c.card.card_name)
                        );
                        console.log(
                            "All hand cards:",
                            state.hand.map((c) => `${c.card.card_name} (${c.card.card_type})`)
                        );

                        if (ritualMonsters.length > 0) {
                            state.advancedRitualState = {
                                phase: "select_ritual_monster",
                            };
                            state.searchingEffect = {
                                cardName: "高等儀式術（儀式モンスター選択）",
                                availableCards: ritualMonsters,
                                effectType: "advanced_ritual_select_monster",
                            };
                            console.log("Set searchingEffect for 高等儀式術:", state.searchingEffect);
                        } else {
                            console.log("No ritual monsters found in hand for 高等儀式術");
                        }
                        break;
                    }

                    default:
                        console.log("No specific effect implemented for:", card.card.card_name);
                        break;
                }
                // Immerでは明示的なreturnは不要（問題の原因かもしれない）
                // return state;
            });
        },

        selectFromDeck: (targetCard: CardInstance) => {
            console.log("=== selectFromDeck called ===");
            console.log("Target card:", targetCard.card.card_name);

            set((state) => {
                if (!state.searchingEffect) {
                    console.log("No searchingEffect found");
                    return;
                }

                const effectType = state.searchingEffect.effectType;
                const cardName = state.searchingEffect.cardName;

                console.log("Effect type:", effectType);
                console.log("Card name:", cardName);

                switch (effectType) {
                    case "select_one": {
                        // 金満で謙虚な壺を発動したターンは効果で手札に加えられない
                        if (state.hasActivatedExtravagance) {
                            console.log(`Cannot add to hand by effect: 金満で謙虚な壺 was activated this turn`);
                            break;
                        }

                        // デッキから選択されたカードを削除
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        // 手札に加える
                        const updatedCard = { ...targetCard, location: "hand" as const };
                        state.hand.push(updatedCard);
                        state.hasDrawnByEffect = true; // カードの効果で手札に加えたフラグを立てる
                        console.log(`Added to hand via ${cardName}:`, targetCard.card.card_name);
                        break;
                    }

                    case "special_summon": {
                        // デッキから選択されたカードを削除
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        // 特殊召喚
                        const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);
                        if (emptyZone !== -1) {
                            const summonedMonster = {
                                ...targetCard,
                                location: "field_monster" as const,
                                position: "defense" as const,
                                zone: emptyZone,
                            };
                            state.field.monsterZones[emptyZone] = summonedMonster;
                            console.log(`Special summoned via ${cardName}:`, targetCard.card.card_name);
                        }
                        break;
                    }

                    case "send_to_graveyard": {
                        // おろかな埋葬: デッキから墓地へ送る
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        const updatedCard = { ...targetCard, location: "graveyard" as const };
                        state.graveyard.push(updatedCard);
                        console.log(`Sent to graveyard via ${cardName}:`, targetCard.card.card_name);
                        break;
                    }

                    case "foolish_burial_select": {
                        // おろかな埋葬: デッキから墓地へ送る（全モンスター表示版）
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        const updatedCard = { ...targetCard, location: "graveyard" as const };
                        state.graveyard.push(updatedCard);
                        console.log(`Sent to graveyard via ${cardName}:`, targetCard.card.card_name);
                        break;
                    }

                    case "ritual_preparation_spell": {
                        // 金満で謙虚な壺を発動したターンは効果で手札に加えられない
                        if (state.hasActivatedExtravagance) {
                            console.log(`Cannot add to hand by effect: 金満で謙虚な壺 was activated this turn`);
                            break;
                        }

                        // 儀式の準備: 儀式魔法を手札に加え、対応する儀式モンスターを選択
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        const updatedSpell = { ...targetCard, location: "hand" as const };
                        state.hand.push(updatedSpell);
                        state.hasDrawnByEffect = true; // カードの効果で手札に加えたフラグを立てる
                        console.log(`Added ritual spell to hand via ${cardName}:`, targetCard.card.card_name);

                        // 対応する儀式モンスターを選択
                        const ritualMonsters = state.deck.filter((c) => c.card.card_type === "儀式・効果モンスター");
                        if (ritualMonsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "儀式の準備（儀式モンスター選択）",
                                availableCards: ritualMonsters,
                                effectType: "select_one",
                            };
                            return; // サーチ効果を継続
                        }
                        break;
                    }

                    case "jack_in_hand_select_three": {
                        // この場合はselectFromDeckではなく、専用の関数を使用するため何もしない
                        // 実際の処理はMultiCardSelectorで行われる
                        break;
                    }

                    case "one_for_one_discard_hand": {
                        // ワン・フォー・ワン: 手札のモンスターを墓地に送る
                        state.hand = state.hand.filter((c) => c.id !== targetCard.id);
                        const discardedCard = { ...targetCard, location: "graveyard" as const };
                        state.graveyard.push(discardedCard);
                        console.log(`Discarded via ${cardName}:`, targetCard.card.card_name);

                        // 次に手札・デッキからレベル1モンスターを選択
                        const handLevel1 = state.hand.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as { level?: number };
                            return monster.level === 1;
                        });

                        const deckLevel1 = state.deck.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as { level?: number };
                            return monster.level === 1;
                        });

                        // 手札とデッキのレベル1モンスターを統合
                        const allLevel1 = [...handLevel1, ...deckLevel1];

                        if (allLevel1.length > 0) {
                            state.searchingEffect = {
                                cardName: "ワン・フォー・ワン（レベル1モンスターを特殊召喚）",
                                availableCards: allLevel1,
                                effectType: "one_for_one_summon",
                            };
                            return; // サーチ効果を継続
                        }
                        break;
                    }

                    case "one_for_one_summon": {
                        // ワン・フォー・ワン: レベル1モンスターを特殊召喚
                        const isFromHand = state.hand.some((c) => c.id === targetCard.id);

                        if (isFromHand) {
                            // 手札から
                            state.hand = state.hand.filter((c) => c.id !== targetCard.id);
                        } else {
                            // デッキから
                            state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        }

                        // 特殊召喚
                        const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);
                        if (emptyZone !== -1) {
                            const summonedMonster = {
                                ...targetCard,
                                location: "field_monster" as const,
                                position: "attack" as const,
                                zone: emptyZone,
                            };
                            state.field.monsterZones[emptyZone] = summonedMonster;
                            console.log(`Special summoned via ${cardName}:`, targetCard.card.card_name);
                        }
                        break;
                    }

                    case "advanced_ritual_select_monster": {
                        // 高等儀式術: 儀式モンスター選択
                        const monster = targetCard.card as { level?: number };
                        const requiredLevel = monster.level || 0;

                        // デッキの通常モンスターを取得
                        const normalMonsters = state.deck.filter(
                            (c) => isMonsterCard(c.card) && c.card.card_type === "通常モンスター"
                        );

                        state.advancedRitualState = {
                            phase: "select_normal_monsters",
                            selectedRitualMonster: targetCard,
                            requiredLevel: requiredLevel,
                            availableNormals: normalMonsters,
                        };

                        console.log(`Selected ritual monster: ${targetCard.card.card_name} (Level ${requiredLevel})`);
                        console.log(`Available normal monsters: ${normalMonsters.length}`);

                        // サーチ効果を継続しない（専用UIで処理）
                        state.searchingEffect = null;
                        return;
                    }

                    case "hokyuyoin_multi_select": {
                        // この場合はselectFromDeckではなく、専用の関数を使用するため何もしない
                        // 実際の処理はMultiCardSelectorで行われる
                        break;
                    }

                    case "bonmawashi_select": {
                        // この場合はselectFromDeckではなく、専用の関数を使用するため何もしない
                        // 実際の処理はMultiCardSelectorで行われる
                        break;
                    }

                    case "bonmawashi_player_select": {
                        // 盆回し: プレイヤーが自分のフィールドにセットするカードを選択
                        console.log("bonmawashi_player_select: 選択されたカード", targetCard.card.card_name);

                        // 直接状態を更新する
                        if (!state.bonmawashiState || state.bonmawashiState.phase !== "select_for_player") {
                            console.log("bonmawashiState is invalid");
                            return;
                        }
                        if (!state.bonmawashiState.selectedCards || state.bonmawashiState.selectedCards.length !== 2) {
                            console.log("selectedCards is invalid");
                            return;
                        }

                        const otherCard = state.bonmawashiState.selectedCards.find((c) => c.id !== targetCard.id);
                        if (!otherCard) {
                            console.log("otherCard not found");
                            return;
                        }

                        console.log(`盆回し: 自分のフィールドに「${targetCard.card.card_name}」をセット`);
                        console.log(`盆回し: 相手のフィールドに「${otherCard.card.card_name}」をセット`);

                        // 既存のフィールド魔法を墓地へ
                        if (state.field.fieldZone) {
                            const oldFieldCard = { ...state.field.fieldZone, location: "graveyard" as const };
                            state.graveyard.push(oldFieldCard);

                            // 盆回し制限チェック
                            if (oldFieldCard.setByBonmawashi) {
                                setTimeout(() => get().checkBonmawashiRestriction(), 0);
                            }
                        }

                        // 選択したカードを自分のフィールドに表側で発動
                        const setSpell = {
                            ...targetCard,
                            location: "field_spell_trap" as const,
                            setByBonmawashi: true,
                        };
                        state.field.fieldZone = setSpell;

                        // 自分のフィールドに配置されたカードの発動時効果を処理
                        if (targetCard.card.card_name === "竜輝巧－ファフニール") {
                            console.log("盆回しで竜輝巧－ファフニールが配置されました - 発動時効果を処理します");
                            // ファフニールの発動時効果を後で実行
                            setTimeout(() => {
                                const currentState = get();
                                if (!currentState.hasActivatedFafnir) {
                                    get().activateSpellEffect(targetCard);
                                }
                            }, 0);
                        }

                        // 相手のフィールドにもう1枚を表側で発動
                        const opponentSetSpell = {
                            ...otherCard,
                            location: "field_spell_trap" as const,
                            setByBonmawashi: true,
                        };
                        state.opponentField.fieldZone = opponentSetSpell;

                        // 盆回し制限を適用
                        state.bonmawashiRestriction = true;

                        console.log("盆回し制限を適用: 他のフィールド魔法を発動・セットできません");

                        // 状態をクリア
                        state.bonmawashiState = null;
                        state.searchingEffect = null;
                        return;
                    }

                    case "ban_alpha_release_select": {
                        // 竜輝巧－バンα: リリース対象選択
                        console.log("=== ban_alpha_release_select case triggered ===");
                        console.log("Calling selectBanAlphaReleaseTarget with:", targetCard.card.card_name);
                        get().selectBanAlphaReleaseTarget(targetCard);
                        return;
                    }

                    case "ban_alpha_ritual_select": {
                        // 竜輝巧－バンα: 儀式モンスター選択
                        console.log("=== ban_alpha_ritual_select case triggered ===");
                        console.log("Calling selectBanAlphaRitualMonster with:", targetCard.card.card_name);
                        get().selectBanAlphaRitualMonster(targetCard);
                        return;
                    }

                    case "critter_search": {
                        // クリッター: 攻撃力1500以下のモンスターをサーチ
                        console.log("=== critter_search case triggered ===");
                        
                        // 金満で謙虚な壺を発動したターンは効果で手札に加えられない
                        if (state.hasActivatedExtravagance) {
                            console.log("Cannot add to hand by effect: 金満で謙虚な壺 was activated this turn");
                            break;
                        }

                        // デッキから選択されたカードを削除
                        state.deck = state.deck.filter((c) => c.id !== targetCard.id);
                        // 手札に加える
                        const updatedCard = { ...targetCard, location: "hand" as const };
                        state.hand.push(updatedCard);
                        state.hasDrawnByEffect = true;
                        console.log("Added to hand via クリッター:", targetCard.card.card_name);
                        break;
                    }
                }

                // サーチ効果を終了
                state.searchingEffect = null;
            });
        },

        selectForJackInHand: (selectedCards: CardInstance[]) => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "select_three") return;

                console.log(
                    "Selected 3 cards for ジャック・イン・ザ・ハンド:",
                    selectedCards.map((c) => c.card.card_name)
                );

                // 相手がランダムに1枚選択
                const randomIndex = Math.floor(Math.random() * selectedCards.length);
                const opponentCard = selectedCards[randomIndex];
                const remainingCards = selectedCards.filter((_, index) => index !== randomIndex);

                console.log("Opponent randomly took:", opponentCard.card.card_name);
                console.log(
                    "Remaining cards:",
                    remainingCards.map((c) => c.card.card_name)
                );

                // 選択されたカードをデッキから除外
                selectedCards.forEach((card) => {
                    state.deck = state.deck.filter((c) => c.id !== card.id);
                });

                state.jackInHandState = {
                    phase: "player_selects",
                    availableCards: selectedCards,
                    selectedThree: selectedCards,
                    opponentCard: opponentCard,
                    remainingCards: remainingCards,
                };

                state.searchingEffect = null;
            });
        },

        continueJackInHand: () => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "opponent_takes") return;

                state.jackInHandState.phase = "player_selects";
            });
        },

        selectPlayerCardFromJack: (selectedCard: CardInstance) => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "player_selects") return;

                console.log("Player selected:", selectedCard.card.card_name);

                // 金満で謙虚な壺を発動したターンは効果で手札に加えられない
                if (state.hasActivatedExtravagance) {
                    console.log(`Cannot add to hand by effect: 金満で謙虚な壺 was activated this turn`);
                    // カードをデッキに戻す
                    state.jackInHandState.remainingCards?.forEach((card) => {
                        state.deck.push(card);
                    });
                    state.deck.push(selectedCard);
                    // デッキをシャッフル
                    for (let i = state.deck.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
                    }
                    state.jackInHandState = null;
                    return;
                }

                // プレイヤーが選択したカードを手札に加える
                const updatedCard = { ...selectedCard, location: "hand" as const };
                state.hand.push(updatedCard);
                state.hasDrawnByEffect = true; // カードの効果で手札に加えたフラグを立てる

                // 残りのカードをデッキに戻してシャッフル
                const remainingCards =
                    state.jackInHandState.remainingCards?.filter((c) => c.id !== selectedCard.id) || [];
                remainingCards.forEach((card) => {
                    state.deck.push(card);
                });

                // デッキをシャッフル
                for (let i = state.deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
                }

                console.log("ジャック・イン・ザ・ハンド effect completed");
                console.log("Remaining cards returned to deck and shuffled");

                state.jackInHandState = null;
            });
        },

        selectExtravaganceCount: (count: 3 | 6) => {
            set((state) => {
                if (!state.extravaganceState || state.extravaganceState.phase !== "select_count") return;

                console.log(`Selected to banish ${count} cards from EX deck`);

                // EXデッキからカードを除外
                const actualCount = Math.min(count, state.extraDeck.length);
                for (let i = 0; i < actualCount; i++) {
                    const excludedCard = state.extraDeck.shift();
                    if (excludedCard) {
                        const updatedCard = { ...excludedCard, location: "banished" as const };
                        state.banished.push(updatedCard);
                    }
                }

                // 除外した数だけデッキの上からカードをめくる
                const revealedCards: CardInstance[] = [];
                const cardsToReveal = Math.min(actualCount, state.deck.length);

                for (let i = 0; i < cardsToReveal; i++) {
                    const revealedCard = state.deck.shift();
                    if (revealedCard) {
                        revealedCards.push(revealedCard);
                    }
                }

                if (revealedCards.length > 0) {
                    // カード選択フェーズに移行
                    state.extravaganceState = {
                        phase: "select_card_from_deck",
                        revealedCards: revealedCards,
                        banishedCount: actualCount,
                    };
                    console.log(`金満で謙虚な壺: revealed ${revealedCards.length} cards from deck for selection`);
                } else {
                    // めくるカードがない場合は終了
                    state.extravaganceState = null;
                    console.log("金満で謙虚な壺: no cards to reveal from deck");
                }

                // TODO: ターン終了時まで相手が受ける全てのダメージは半分になる（実装省略）
            });
        },

        selectCardFromExtravagance: () => {
            // この関数は使用されなくなったが、互換性のため残しておく
            set((state) => {
                console.log("selectCardFromExtravagance called but not used in new implementation");
                state.extravaganceState = null;
            });
        },

        selectCardFromRevealedCards: (selectedCard: CardInstance, remainingCards: CardInstance[]) => {
            set((state) => {
                if (!state.extravaganceState || state.extravaganceState.phase !== "select_card_from_deck") return;

                console.log("Selected card from revealed cards:", selectedCard.card.card_name);

                // 選択されたカードを手札に加える
                const cardToHand = { ...selectedCard, location: "hand" as const };
                state.hand.push(cardToHand);
                state.hasDrawnByEffect = true; // カードの効果で手札に加えたフラグを立てる

                // 残りのカードをデッキの一番下に戻す
                remainingCards.forEach((card) => {
                    state.deck.push(card);
                });

                console.log(
                    `金満で謙虚な壺 effect completed: added 1 card to hand, returned ${remainingCards.length} cards to bottom of deck`
                );

                // 効果終了
                state.extravaganceState = null;

                // エクゾディア勝利判定（デバッグ用に一時無効）
                // if (checkExodiaWin(state.hand)) {
                //     state.gameOver = true;
                //     state.winner = "player";
                // }
            });
        },

        selectRitualMonster: () => {
            // この関数は現在selectFromDeckで処理されているため使用しない
        },

        selectNormalMonstersForRitual: (normalMonsters: CardInstance[]) => {
            set((state) => {
                if (!state.advancedRitualState || state.advancedRitualState.phase !== "select_normal_monsters") return;

                const ritualMonster = state.advancedRitualState.selectedRitualMonster!;

                console.log(
                    `Performing ritual summon with normal monsters:`,
                    normalMonsters.map((m) => m.card.card_name)
                );

                // 選択された通常モンスターをデッキから削除して墓地へ
                normalMonsters.forEach((monster) => {
                    state.deck = state.deck.filter((c) => c.id !== monster.id);
                    const graveyardCard = { ...monster, location: "graveyard" as const };
                    state.graveyard.push(graveyardCard);
                });

                // 儀式モンスターを手札から削除
                state.hand = state.hand.filter((c) => c.id !== ritualMonster.id);

                // 儀式モンスターを特殊召喚
                const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);
                if (emptyZone !== -1) {
                    const summonedMonster = {
                        ...ritualMonster,
                        location: "field_monster" as const,
                        position: "attack" as const,
                        zone: emptyZone,
                    };
                    state.field.monsterZones[emptyZone] = summonedMonster;
                    console.log(`Ritual summoned: ${ritualMonster.card.card_name}`);
                }

                // 高等儀式術の状態をクリア
                state.advancedRitualState = null;
            });
        },

        activateChickenRaceEffect: (effectType: "draw" | "destroy" | "heal") => {
            set((state) => {
                console.log("Activating チキンレース effect:", effectType);

                // このターンに既に効果を使用している場合は実行できない
                if (state.hasActivatedChickenRace) {
                    console.log("Cannot activate チキンレース: already activated this turn");
                    return;
                }

                // 1000LP支払い（ライフポイントが1000以下になる場合は支払えない）
                if (state.lifePoints > 1000) {
                    state.lifePoints -= 1000;
                    state.hasActivatedChickenRace = true; // フラグを設定

                    switch (effectType) {
                        case "draw":
                            // 金満で謙虚な壺を発動したターンは効果でドローできない
                            if (state.hasActivatedExtravagance) {
                                console.log("Cannot draw by effect: 金満で謙虚な壺 was activated this turn");
                                break;
                            }

                            // 1枚ドロー
                            if (state.deck.length > 0) {
                                const drawnCard = state.deck.shift();
                                if (drawnCard) {
                                    drawnCard.location = "hand";
                                    state.hand.push(drawnCard);
                                    state.hasDrawnByEffect = true; // カードの効果でドローしたフラグを立てる
                                    console.log("Drew card from チキンレース effect:", drawnCard.card.card_name);
                                }
                            }
                            break;

                        case "destroy":
                            // チキンレースを破壊（自分のフィールドまたは相手のフィールドから）
                            if (state.field.fieldZone && state.field.fieldZone.card.card_name === "チキンレース") {
                                const destroyedCard = { ...state.field.fieldZone, location: "graveyard" as const };
                                state.graveyard.push(destroyedCard);

                                // 盆回し制限チェック
                                if (destroyedCard.setByBonmawashi) {
                                    setTimeout(() => get().checkBonmawashiRestriction(), 0);
                                }

                                state.field.fieldZone = null;
                                console.log("Destroyed チキンレース (player field)");
                            } else if (
                                state.opponentField.fieldZone &&
                                state.opponentField.fieldZone.card.card_name === "チキンレース"
                            ) {
                                const destroyedCard = {
                                    ...state.opponentField.fieldZone,
                                    location: "graveyard" as const,
                                };
                                state.graveyard.push(destroyedCard);

                                // 盆回し制限チェック
                                if (destroyedCard.setByBonmawashi) {
                                    setTimeout(() => get().checkBonmawashiRestriction(), 0);
                                }

                                state.opponentField.fieldZone = null;
                                console.log("Destroyed チキンレース (opponent field)");
                            }
                            break;

                        case "heal":
                            // 相手は1000LP回復（簡易実装では何もしない）
                            console.log("Opponent heals 1000 LP (not implemented)");
                            break;
                    }

                    console.log("チキンレース effect activated: -1000 LP, effect:", effectType);
                    console.log("Remaining LP:", state.lifePoints);

                    // ライフポイントが0以下になったらゲーム終了
                    if (state.lifePoints <= 0) {
                        state.gameOver = true;
                        state.winner = null; // 自滅
                        console.log("Game Over: Life Points reached 0");
                    }
                } else {
                    console.log(
                        "Cannot activate チキンレース: would reduce LP to 0 or below (current LP:",
                        state.lifePoints,
                        ")"
                    );
                }
            });
        },

        setPhase: (phase: GamePhase) => {
            set((state) => {
                state.phase = phase;
            });
        },

        activateTrapCard: (card: CardInstance) => {
            set((state) => {
                if (card.card.card_name === "補充要員") {
                    // 発動条件の再チェック
                    if (!canActivateHokyuYoin(state)) {
                        console.log("Cannot activate 補充要員: condition not met");
                        state.pendingTrapActivation = null;
                        return;
                    }

                    // 補充要員の効果: 墓地から効果モンスター以外の攻撃力1500以下のモンスターを3体まで選択
                    const targetMonsters = state.graveyard.filter((c) => {
                        if (!isMonsterCard(c.card)) return false;
                        const monster = c.card as { card_type?: string; attack?: number };
                        return monster.card_type !== "効果モンスター" && (monster.attack || 0) <= 1500;
                    });

                    if (targetMonsters.length > 0) {
                        // 補充要員の選択状態を設定
                        state.searchingEffect = {
                            cardName: "補充要員",
                            availableCards: targetMonsters,
                            effectType: "hokyuyoin_multi_select",
                        };
                    }

                    // カードをフィールドから墓地へ
                    const cardIndex = state.field.spellTrapZones.findIndex((c) => c?.id === card.id);
                    if (cardIndex !== -1) {
                        state.field.spellTrapZones[cardIndex] = null;
                        const graveyardCard = { ...card, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(graveyardCard);
                    }
                }

                state.pendingTrapActivation = null;
            });
        },

        declineTrapActivation: () => {
            set((state) => {
                state.pendingTrapActivation = null;
            });
        },

        selectHokyuyoinTargets: (selectedCards: CardInstance[]) => {
            set((state) => {
                console.log(
                    "補充要員の効果で選択されたカード:",
                    selectedCards.map((c) => c.card.card_name)
                );

                // 選択されたカードを墓地から手札に移動
                selectedCards.forEach((card) => {
                    state.graveyard = state.graveyard.filter((c) => c.id !== card.id);
                    const updatedCard = { ...card, location: "hand" as const };
                    state.hand.push(updatedCard);
                });

                console.log(`補充要員の効果で${selectedCards.length}体のモンスターを手札に加えました`);

                // サーチ効果を終了
                state.searchingEffect = null;
            });
        },

        selectBonmawashiCards: (selectedCards: CardInstance[]) => {
            set((state) => {
                if (selectedCards.length !== 2) {
                    console.log("盆回し: 2枚選択する必要があります");
                    return;
                }

                console.log(
                    "盆回し: 選択されたフィールド魔法:",
                    selectedCards.map((c) => c.card.card_name)
                );

                // 選択された2枚をデッキから削除
                selectedCards.forEach((card) => {
                    state.deck = state.deck.filter((c) => c.id !== card.id);
                });

                // 盆回しの状態を更新し、プレイヤーに自分用を選択させる
                state.bonmawashiState = {
                    phase: "select_for_player",
                    selectedCards: selectedCards,
                };

                // 選択UIを表示
                state.searchingEffect = {
                    cardName: "盆回し（自分のフィールドにセットするカードを選択）",
                    availableCards: selectedCards,
                    effectType: "bonmawashi_player_select",
                };
            });
        },

        selectBonmawashiForPlayer: (card: CardInstance) => {
            set((state) => {
                if (!state.bonmawashiState || state.bonmawashiState.phase !== "select_for_player") return;
                if (!state.bonmawashiState.selectedCards || state.bonmawashiState.selectedCards.length !== 2) return;

                const otherCard = state.bonmawashiState.selectedCards.find((c) => c.id !== card.id);
                if (!otherCard) return;

                console.log(`盆回し: 自分のフィールドに「${card.card.card_name}」をセット`);
                console.log(`盆回し: 相手のフィールドに「${otherCard.card.card_name}」をセット（簡易実装では省略）`);

                // 既存のフィールド魔法を墓地へ
                if (state.field.fieldZone) {
                    const oldFieldCard = { ...state.field.fieldZone, location: "graveyard" as const };
                    state.graveyard.push(oldFieldCard);
                }

                // 選択したカードを自分のフィールドに表側で発動
                const setSpell = {
                    ...card,
                    location: "field_spell_trap" as const,
                    setByBonmawashi: true, // 盆回しでセットされたことを記録
                };
                state.field.fieldZone = setSpell;

                // 自分のフィールドに配置されたカードの発動時効果を処理
                if (card.card.card_name === "竜輝巧－ファフニール") {
                    console.log("盆回しで竜輝巧－ファフニールが配置されました - 発動時効果を処理します");
                    // ファフニールの発動時効果を後で実行
                    setTimeout(() => {
                        const currentState = get();
                        if (!currentState.hasActivatedFafnir) {
                            get().activateSpellEffect(card);
                        }
                    }, 0);
                }

                // 相手のフィールドにもう1枚を表側で発動
                const opponentSetSpell = {
                    ...otherCard,
                    location: "field_spell_trap" as const,
                    setByBonmawashi: true, // 盆回しでセットされたことを記録
                };
                state.opponentField.fieldZone = opponentSetSpell;

                // 盆回し制限を適用
                state.bonmawashiRestriction = true;

                console.log("盆回し制限を適用: 他のフィールド魔法を発動・セットできません");

                // 状態をクリア
                state.bonmawashiState = null;
                state.searchingEffect = null;
            });
        },

        checkBonmawashiRestriction: () => {
            set((state) => {
                // 盆回しでセットされたフィールド魔法がまだフィールドに存在するかチェック
                const playerFieldHasBonmawashi = state.field.fieldZone?.setByBonmawashi || false;
                const opponentFieldHasBonmawashi = state.opponentField.fieldZone?.setByBonmawashi || false;

                // どちらもフィールドにない場合、制限を解除
                if (!playerFieldHasBonmawashi && !opponentFieldHasBonmawashi) {
                    state.bonmawashiRestriction = false;
                    console.log("盆回し制限を解除しました");
                }
            });
        },

        activateOpponentFieldSpell: () => {
            set((state) => {
                if (!state.opponentField.fieldZone || state.opponentField.fieldZone.position !== "facedown") {
                    return;
                }

                console.log("相手フィールド魔法を表側にします:", state.opponentField.fieldZone.card.card_name);

                // 表側にする
                state.opponentField.fieldZone.position = undefined;

                // TODO: フィールド魔法の効果処理（チキンレースなど）
            });
        },

        activateBanAlpha: (banAlphaCard: CardInstance) => {
            console.log("Activating 竜輝巧－バンα effect from:", banAlphaCard.location);

            // このターンに既に発動済みの場合は発動不可
            const currentState = get();
            if (currentState.hasActivatedBanAlpha) {
                console.log("Cannot activate 竜輝巧－バンα: already activated this turn");
                return;
            }

            set((state) => {
                // バンαの効果を発動済みとしてマーク（UIが表示される前に設定）
                state.hasActivatedBanAlpha = true;
                console.log("Marked 竜輝巧－バンα as activated this turn");

                // リリース対象を取得（手札・フィールドのドライトロンモンスターまたは儀式モンスター）
                const releaseTargets: CardInstance[] = [];

                // 手札のドライトロンモンスターまたは儀式モンスター
                const handTargets = state.hand.filter((c) => {
                    if (!isMonsterCard(c.card)) return false;
                    if (c.id === banAlphaCard.id) return false; // 自分自身は除外

                    const isDrytron = c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                    const isRitual = c.card.card_type === "儀式・効果モンスター";

                    return isDrytron || isRitual;
                });

                // フィールドのドライトロンモンスターまたは儀式モンスター
                const fieldTargets = state.field.monsterZones.filter((c): c is CardInstance => {
                    if (!c || !isMonsterCard(c.card)) return false;

                    const isDrytron = c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                    const isRitual = c.card.card_type === "儀式・効果モンスター";

                    return isDrytron || isRitual;
                });

                releaseTargets.push(...handTargets, ...fieldTargets);

                if (releaseTargets.length === 0) {
                    console.log("No valid release targets for 竜輝巧－バンα");
                    return;
                }

                console.log(
                    "Found release targets:",
                    releaseTargets.map((c) => c.card.card_name)
                );

                // バンαの効果状態を設定
                state.banAlphaState = {
                    phase: "select_release_target",
                    banAlphaCard: banAlphaCard,
                    availableTargets: releaseTargets,
                };

                // 選択UIを表示
                state.searchingEffect = {
                    cardName: "竜輝巧－バンα（リリース対象選択）",
                    availableCards: releaseTargets,
                    effectType: "ban_alpha_release_select",
                };
            });
        },

        selectBanAlphaReleaseTarget: (targetCard: CardInstance) => {
            console.log("=== selectBanAlphaReleaseTarget START ===");
            console.log("Target card:", targetCard.card.card_name, "Location:", targetCard.location);

            // Get the current state to verify we have valid banAlphaState
            const currentState = get();
            if (!currentState.banAlphaState || currentState.banAlphaState.phase !== "select_release_target") {
                console.log("Invalid banAlphaState or wrong phase");
                return;
            }

            const banAlphaCard = currentState.banAlphaState.banAlphaCard!;
            console.log("竜輝巧－バンα: リリース対象「" + targetCard.card.card_name + "」を選択");

            // Try multiple separate state updates to isolate the issue
            console.log("=== Step 1: Remove release target ===");
            set((state) => {
                if (targetCard.location === "hand") {
                    console.log("Removing target from hand:", targetCard.card.card_name);
                    state.hand = state.hand.filter((c) => c.id !== targetCard.id);
                } else if (targetCard.location === "field_monster") {
                    const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === targetCard.id);
                    if (zoneIndex !== -1) {
                        console.log("Removing target from field zone:", zoneIndex);
                        state.field.monsterZones[zoneIndex] = null;
                    }
                }
                
                const releasedCard = { ...targetCard, location: "graveyard" as const };
                state.graveyard.push(releasedCard);
                console.log("Added to graveyard:", releasedCard.card.card_name);
                
                // クリッター効果をチェック
                if (targetCard.location === "field_monster") {
                    setTimeout(() => get().checkCritterEffect(targetCard), 100);
                }
            });

            setTimeout(() => {
                console.log("=== Step 2: Remove Ban Alpha from original location ===");
                set((state) => {
                    if (banAlphaCard.location === "hand") {
                        console.log("Removing バンα from hand");
                        const handBefore = state.hand.length;
                        state.hand = state.hand.filter((c) => c.id !== banAlphaCard.id);
                        console.log("Hand count: " + handBefore + " -> " + state.hand.length);
                    } else if (banAlphaCard.location === "graveyard") {
                        console.log("Removing バンα from graveyard");
                        const graveyardBefore = state.graveyard.length;
                        state.graveyard = state.graveyard.filter((c) => c.id !== banAlphaCard.id);
                        console.log("Graveyard count: " + graveyardBefore + " -> " + state.graveyard.length);
                    }
                });

                setTimeout(() => {
                    console.log("=== Step 3: Special summon Ban Alpha ===");
                    set((state) => {
                        console.log("Before summon - monster zones:", state.field.monsterZones.map((zone, i) => "Zone " + i + ": " + (zone ? zone.card.card_name : "empty")));
                        
                        const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);
                        console.log("Found empty zone:", emptyZone);
                        
                        if (emptyZone !== -1) {
                            // Create new summoned monster object
                            const summonedMonster = {
                                id: banAlphaCard.id,
                                card: banAlphaCard.card,
                                location: "field_monster" as const,
                                position: "defense" as const,
                                zone: emptyZone,
                            };
                            
                            // Force array update
                            const newMonsterZones = [...state.field.monsterZones];
                            newMonsterZones[emptyZone] = summonedMonster;
                            state.field.monsterZones = newMonsterZones;
                            
                            console.log("After summon - monster zones:", state.field.monsterZones.map((zone, i) => "Zone " + i + ": " + (zone ? zone.card.card_name : "empty")));
                            console.log("竜輝巧－バンα を守備表示で特殊召喚しました - Zone " + emptyZone);
                            
                            state.hasSpecialSummoned = true;
                            state.searchingEffect = null;
                        } else {
                            console.log("No empty monster zone found!");
                        }
                    });

                    setTimeout(() => {
                        console.log("=== Step 4: Verify summon and setup ritual selection ===");
                        const postSummonState = get();
                        console.log("Final verification - monster zones:", postSummonState.field.monsterZones.map((zone, i) => "Zone " + i + ": " + (zone ? zone.card.card_name : "empty")));
                        
                        // デッキから儀式モンスターを選択
                        const ritualMonsters = postSummonState.deck.filter(
                            (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                        );

                        console.log("Found ritual monsters in deck:", ritualMonsters.length);

                        if (ritualMonsters.length > 0) {
                            set((state) => {
                                state.banAlphaState = {
                                    phase: "select_ritual_monster",
                                    banAlphaCard: banAlphaCard,
                                };

                                state.searchingEffect = {
                                    cardName: "竜輝巧－バンα（儀式モンスター選択）",
                                    availableCards: ritualMonsters,
                                    effectType: "ban_alpha_ritual_select",
                                };
                                console.log("Set new searchingEffect for ritual monster selection");
                            });
                        } else {
                            console.log("山札に儀式モンスターがありません - バンαの効果はここで終了します");
                            set((state) => {
                                state.banAlphaState = null;
                                state.searchingEffect = null;
                            });
                        }
                    }, 100);
                }, 50);
            }, 50);
        },

        selectBanAlphaRitualMonster: (ritualMonster: CardInstance) => {
            console.log("=== selectBanAlphaRitualMonster START ===");
            console.log("Ritual monster:", ritualMonster.card.card_name);

            set((state) => {
                console.log("Current banAlphaState:", state.banAlphaState);

                if (!state.banAlphaState || state.banAlphaState.phase !== "select_ritual_monster") {
                    console.log("Invalid banAlphaState or wrong phase");
                    return;
                }

                console.log("竜輝巧－バンα: 儀式モンスター「" + ritualMonster.card.card_name + "」を手札に加える");

                // 金満で謙虚な壺を発動したターンは効果で手札に加えられない
                if (state.hasActivatedExtravagance) {
                    console.log("Cannot add to hand by effect: 金満で謙虚な壺 was activated this turn");
                    state.banAlphaState = null;
                    state.searchingEffect = null;
                    return;
                }

                // 儀式モンスターをデッキから手札に加える
                state.deck = state.deck.filter((c) => c.id !== ritualMonster.id);
                const cardToHand = { ...ritualMonster, location: "hand" as const };
                state.hand.push(cardToHand);
                state.hasDrawnByEffect = true;

                console.log("竜輝巧－バンα の効果が完了しました - 儀式モンスターを手札に加えました");
            });

            // Clear the effect states in a separate update to ensure UI refresh
            setTimeout(() => {
                set((state) => {
                    console.log("Clearing Ban Alpha effect states...");
                    state.banAlphaState = null;
                    state.searchingEffect = null;
                });
            }, 0);
        },

        checkCritterEffect: (card: CardInstance) => {
            console.log("=== Checking Critter effect ===");
            console.log("Card name:", card.card.card_name);
            console.log("Previous location:", card.location);
            
            const currentState = get();
            
            // クリッターかどうかチェック
            if (card.card.card_name !== "クリッター") {
                console.log("Not Critter, skipping effect check");
                return;
            }

            // フィールドから墓地へ送られたかチェック
            if (card.location !== "field_monster") {
                console.log("Not sent from field, skipping Critter effect");
                return;
            }

            // このターンに既に発動済みかチェック
            if (currentState.hasActivatedCritter) {
                console.log("Cannot activate クリッター: already activated this turn");
                return;
            }

            console.log("クリッター effect triggered!");

            // 攻撃力1500以下のモンスターを探す
            const targetMonsters = currentState.deck.filter((c) => {
                if (!isMonsterCard(c.card)) return false;
                const monster = c.card as { attack?: number };
                return (monster.attack || 0) <= 1500;
            });

            console.log("Found", targetMonsters.length, "monsters with ATK 1500 or less");

            if (targetMonsters.length > 0) {
                set((state) => {
                    state.hasActivatedCritter = true;
                    state.searchingEffect = {
                        cardName: "クリッター",
                        availableCards: targetMonsters,
                        effectType: "critter_search",
                    };
                    console.log("Set up Critter search effect");
                });
            } else {
                console.log("No valid targets for Critter effect");
            }
        },

        startLinkSummon: (linkMonster: CardInstance) => {
            console.log("=== startLinkSummon ===");
            console.log("Link monster:", linkMonster.card.card_name);
            
            const currentState = get();
            
            // リンクモンスターの要求素材数を取得
            const linkCard = linkMonster.card as { link?: number; material?: string };
            const requiredMaterials = linkCard.link || 1;
            
            console.log("Required materials:", requiredMaterials);
            
            // 利用可能な素材を取得（フィールドのモンスター）
            const availableMaterials = currentState.field.monsterZones.filter((c): c is CardInstance => c !== null);
            
            console.log("Available materials:", availableMaterials.map(c => c.card.card_name));
            
            if (availableMaterials.length < requiredMaterials) {
                console.log("Not enough materials for Link summon");
                return;
            }
            
            set((state) => {
                state.linkSummonState = {
                    phase: "select_materials",
                    linkMonster: linkMonster,
                    requiredMaterials: requiredMaterials,
                    selectedMaterials: [],
                    availableMaterials: availableMaterials,
                };
                
                // 素材選択UIを表示
                state.searchingEffect = {
                    cardName: `${linkMonster.card.card_name}（リンク素材選択）`,
                    availableCards: availableMaterials,
                    effectType: "link_summon_select_materials",
                };
            });
        },

        selectLinkMaterials: (materials: CardInstance[]) => {
            console.log("=== selectLinkMaterials ===");
            console.log("Selected materials:", materials.map(c => c.card.card_name));
            
            const currentState = get();
            
            if (!currentState.linkSummonState || currentState.linkSummonState.phase !== "select_materials") {
                console.log("Invalid Link summon state");
                return;
            }
            
            const { linkMonster, requiredMaterials } = currentState.linkSummonState;
            
            if (!linkMonster || materials.length !== requiredMaterials) {
                console.log("Invalid material selection");
                return;
            }
            
            // 素材をフィールドから墓地へ送る
            set((state) => {
                materials.forEach((material) => {
                    const zoneIndex = state.field.monsterZones.findIndex(c => c?.id === material.id);
                    if (zoneIndex !== -1) {
                        state.field.monsterZones[zoneIndex] = null;
                        const graveyardCard = { ...material, location: "graveyard" as const };
                        state.graveyard.push(graveyardCard);
                    }
                });
                
                // エクストラデッキからリンクモンスターを削除
                state.extraDeck = state.extraDeck.filter(c => c.id !== linkMonster.id);
                
                // エクストラモンスターゾーン選択フェーズに移行
                state.linkSummonState = {
                    phase: "select_materials", // 実際にはゾーン選択だが、既存の型定義を使用
                    linkMonster: linkMonster,
                    requiredMaterials: requiredMaterials,
                    selectedMaterials: materials,
                    availableMaterials: [],
                };
                
                // サーチ効果をクリア（UI側でゾーン選択を処理）
                state.searchingEffect = null;
                
                console.log("Materials sent to graveyard, ready for zone selection");
            });
        },

        summonLinkMonster: (zone: number) => {
            console.log("=== summonLinkMonster ===");
            console.log("Target zone:", zone);
            
            const currentState = get();
            
            if (!currentState.linkSummonState) {
                console.log("No Link summon state");
                return;
            }
            
            const { linkMonster } = currentState.linkSummonState;
            
            if (!linkMonster) {
                console.log("No Link monster selected");
                return;
            }
            
            // エクストラモンスターゾーンに配置（zone 5 = 左、zone 6 = 右）
            const extraZoneIndex = zone === 5 ? 0 : 1;
            
            if (currentState.field.extraMonsterZones[extraZoneIndex] !== null) {
                console.log("Extra monster zone occupied");
                return;
            }
            
            set((state) => {
                const summonedMonster = {
                    ...linkMonster,
                    location: "field_monster" as const,
                    position: "attack" as const,
                    zone: zone,
                };
                
                // エクストラモンスターゾーンに配置
                const newExtraZones = [...state.field.extraMonsterZones];
                newExtraZones[extraZoneIndex] = summonedMonster;
                state.field.extraMonsterZones = newExtraZones;
                
                // リンク召喚状態をクリア
                state.linkSummonState = null;
                state.hasSpecialSummoned = true;
                
                console.log(`Link summoned ${linkMonster.card.card_name} to extra zone ${extraZoneIndex}`);
            });
        },
    }))
);
