import type { CommonMonster, LeveledMonsterCard } from "@/types/card";
import { isMagicCard, monsterFilter } from "@/utils/cardManagement";
import { withTurnAtOneceEffect, withUserSelectCard, withUserSummon, withDelay } from "@/utils/effectUtils";
import { sendCard, banish, releaseCard, addBuf } from "@/utils/cardMovement";
import { draitronIgnitionCondition, getDraitronReleaseTargets } from "@/utils/draitronUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export const COMMON_MONSTERS = [
    {
        card_name: "封印されしエクゾディア",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 3,
        element: "闇" as const,
        race: "魔法使い" as const,
        attack: 1000,
        defense: 1000,
        text: "このカードと「封印されし者の右腕」「封印されし者の左腕」「封印されし者の右足」「封印されし者の左足」が手札に全て揃った時、自分はデュエルに勝利する。",
        image: "card100224614_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "封印されし者の右腕",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 1,
        element: "闇" as const,
        race: "魔法使い" as const,
        attack: 200,
        defense: 300,
        text: "封印されしエクゾディアの右腕。封印されているため、その力は計り知れない。",
        image: "card100220676_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "封印されし者の左腕",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 1,
        element: "闇" as const,
        race: "魔法使い" as const,
        attack: 200,
        defense: 300,
        text: "封印されしエクゾディアの左腕。封印されているため、その力は計り知れない。",
        image: "card100220667_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "封印されし者の右足",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 1,
        element: "闇" as const,
        race: "魔法使い" as const,
        attack: 200,
        defense: 300,
        text: "封印されしエクゾディアの右足。封印されているため、その力は計り知れない。",
        image: "card100014919_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "封印されし者の左足",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 1,
        element: "闇" as const,
        race: "魔法使い" as const,
        attack: 200,
        defense: 300,
        text: "封印されしエクゾディアの左足。封印されているため、その力は計り知れない。",
        image: "card100014920_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "サイバー・エンジェル－弁天－",
        monster_type: "儀式モンスター",
        level: 6,
        element: "光",
        race: "天使",
        attack: 1800,
        defense: 1500,
        text: "「機械天使の儀式」により降臨。①：このカードが戦闘でモンスターを破壊し墓地へ送った場合に発動する。そのモンスターの元々の守備力分のダメージを相手に与える。②：このカードがリリースされた場合に発動できる。デッキから天使族・光属性モンスター１体を手札に加える。",
        image: "card100035806_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        card_type: "モンスター",
        effect: {
            onRelease: (state, card) => {
                const target = (state: GameStore) =>
                    state.deck.filter((e) => monsterFilter(e.card) && e.card.race === "天使");
                if (target.length === 0) {
                    return;
                }
                withUserSelectCard(
                    state,
                    card,
                    target,
                    { select: "single", order: 999, message: "天使族・光属性モンスターを選択してください" },
                    (state, _card, selected) => {
                        sendCard(state, selected[0], "Hand");
                    }
                );
            },
        },
    },
    {
        card_name: "サイバー・エンジェル－韋駄天－",
        monster_type: "儀式モンスター",
        level: 6,
        element: "光",
        race: "天使",
        attack: 1600,
        defense: 2000,
        text: "「機械天使の儀式」により降臨。①：このカードが儀式召喚に成功した場合に発動できる。自分のデッキ・墓地から儀式魔法カード１枚を選んで手札に加える。②：このカードがリリースされた場合に発動できる。自分フィールドの全ての儀式モンスターの攻撃力・守備力は１０００アップする。",
        image: "card100133121_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        card_type: "モンスター",
        effect: {
            onSummon: (state, card) => {
                const target = (state: GameStore) =>
                    [...state.deck, ...state.graveyard].filter(
                        (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                    );
                if (target(state).length === 0) {
                    return;
                }
                withUserSelectCard(
                    state,
                    card,
                    target,
                    { select: "single", order: 999, message: "儀式魔法カードを選択してください" },
                    (state, _, selected) => {
                        sendCard(state, selected[0], "Hand");
                    }
                );
            },
        },
    },
    {
        card_name: "ジェネクス・コントローラー",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 3,
        element: "闇" as const,
        race: "機械" as const,
        attack: 1400,
        defense: 1200,
        text: "仲間達と心を通わせる事ができる、数少ないジェネクスのひとり。様々なエレメントの力をコントロールできるぞ。",
        image: "card100004619_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
        hasTuner: true,
    },
    {
        card_name: "大砲だるま",
        card_type: "モンスター" as const,
        monster_type: "通常モンスター" as const,
        level: 2,
        element: "闇" as const,
        race: "機械" as const,
        attack: 900,
        defense: 500,
        text: "大砲で埋め尽くされているメカだるま。ねらいは外さない。",
        image: "card100224572_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
    },
    {
        card_name: "竜輝巧－バンα",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 1,
        element: "光" as const,
        race: "機械" as const,
        attack: 2000,
        defense: 0,
        text: "このカードは通常召喚できず、「ドライトロン」カードの効果でのみ特殊召喚できる。このカード名の効果は1ターンに1度しか使用できない。①：このカード以外の自分の手札・フィールドの、「ドライトロン」モンスターか儀式モンスター1体をリリースして発動できる（この効果を発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない）。このカードを手札・墓地から守備表示で特殊召喚する。その後、デッキから儀式モンスター1枚を手札に加えることができる。",
        image: "card100206504_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    return draitronIgnitionCondition("竜輝巧－バンα")(gameState, cardInstance);
                },
                effect: (state: GameStore, cardInstance: CardInstance) =>
                    withTurnAtOneceEffect(state, cardInstance, (state, cardInstance) => {
                        withUserSelectCard(
                            state,
                            cardInstance,
                            getDraitronReleaseTargets("竜輝巧－バンα"),
                            { select: "single", message: "リリースするモンスターを選択してください" },
                            (state, cardInstance, selected) => {
                                const targetCard = selected[0];
                                releaseCard(state, targetCard);

                                withUserSummon(
                                    state,
                                    cardInstance,
                                    cardInstance,
                                    { canSelectPosition: false, optionPosition: ["defense"] },
                                    (state, cardInstance) => {
                                        const target = (state: GameStore) =>
                                            state.deck.filter(
                                                (card) =>
                                                    monsterFilter(card.card) &&
                                                    card.card.monster_type === "儀式モンスター"
                                            );

                                        if (target(state).length > 0) {
                                            withUserSelectCard(
                                                state,
                                                cardInstance,
                                                target,
                                                {
                                                    select: "single",
                                                    message: "手札に加える儀式モンスターを選択してください",
                                                },
                                                (state, _, target) => {
                                                    sendCard(state, target[0], "Hand");
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "竜輝巧－アルζ",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 1,
        element: "光" as const,
        race: "機械" as const,
        attack: 2000,
        defense: 0,
        text: "このカードは通常召喚できず、「ドライトロン」カードの効果でのみ特殊召喚できる。このカード名の効果は1ターンに1度しか使用できない。①：このカード以外の自分の手札・フィールドの、「ドライトロン」モンスターか儀式モンスター1体をリリースして発動できる（この効果を発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない）。このカードを手札・墓地から守備表示で特殊召喚する。その後、デッキから儀式魔法カード1枚を手札に加えることができる。",
        image: "card100206525_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    return draitronIgnitionCondition("竜輝巧－アルζ")(gameState, cardInstance);
                },
                effect: (state: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(state, cardInstance, (state, cardInstance) => {
                        withUserSelectCard(
                            state,
                            cardInstance,
                            getDraitronReleaseTargets("竜輝巧－アルζ"),
                            { select: "single", message: "リリースするモンスターを選択してください" },
                            (state, card, selected) => {
                                // Release selected card and summon this card
                                const targetCard = selected[0];
                                releaseCard(state, targetCard);
                                // Remove this card from hand or graveyard and summon it
                                withUserSummon(
                                    state,
                                    card,
                                    card,
                                    { canSelectPosition: false, optionPosition: ["defense"] },
                                    (state, cardInstance) => {
                                        const target = (state: GameStore) => {
                                            return state.deck.filter(
                                                (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                                            );
                                        };
                                        if (target(state).length === 0) {
                                            return;
                                        }
                                        // Search for a Draitron monster
                                        withUserSelectCard(
                                            state,
                                            cardInstance,
                                            target,
                                            {
                                                select: "single",
                                                message: "手札に加える儀式魔法カードを選択してください",
                                            },
                                            (state, _card, selected) => {
                                                sendCard(state, selected[0], "Hand");
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "竜輝巧－エルγ",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 1,
        element: "光" as const,
        race: "機械" as const,
        attack: 2000,
        defense: 0,
        text: "このカードは通常召喚できず、「ドライトロン」カードの効果でのみ特殊召喚できる。このカード名の効果は1ターンに1度しか使用できない。①：自分の手札・フィールドから、このカード以外の「ドライトロン」モンスターまたは儀式モンスター1体をリリースして発動できる。このカードを手札・墓地から守備表示で特殊召喚する。その後、自分の墓地から「竜輝巧－エルγ」以外の攻撃力2000の「ドライトロン」モンスター1体を選んで特殊召喚できる。この効果を発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない。",
        image: "card100206513_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (state: GameStore, cardInstance: CardInstance) => {
                    return draitronIgnitionCondition("竜輝巧－エルγ")(state, cardInstance);
                },
                effect: (state: GameStore, cardInstance: CardInstance) =>
                    withTurnAtOneceEffect(state, cardInstance, (state, cardInstance) => {
                        withUserSelectCard(
                            state,
                            cardInstance,
                            getDraitronReleaseTargets("竜輝巧－エルγ"),
                            { select: "single", message: "リリースするモンスターを選択してください" },
                            (state, card, selected) => {
                                // Release selected card and summon this card
                                const targetCard = selected[0];
                                releaseCard(state, targetCard);

                                // Remove this card from hand or graveyard and summon it
                                withUserSummon(
                                    state,
                                    card,
                                    card,
                                    { canSelectPosition: false, optionPosition: ["defense"] },
                                    (state, cardInstance) => {
                                        // Search for a Draitron monster
                                        const draitronMonsters = state.graveyard.filter(
                                            (card) =>
                                                monsterFilter(card.card) &&
                                                card.card.card_name.includes("竜輝巧") &&
                                                card.card.attack === 2000
                                        );
                                        if (draitronMonsters.length === 0) {
                                            return;
                                        }
                                        if (!hasEmptyMonsterZone(state)) {
                                            return;
                                        }
                                        withUserSelectCard(
                                            state,
                                            cardInstance,
                                            (state: GameStore) => {
                                                return state.graveyard.filter(
                                                    (card) =>
                                                        monsterFilter(card.card) &&
                                                        card.card.card_name.includes("竜輝巧") &&
                                                        card.card.attack === 2000
                                                );
                                            },
                                            {
                                                select: "single",
                                                message: "墓地から特殊召喚するドライトロンモンスターを選択してください",
                                            },
                                            (state, cardInstance, selected) => {
                                                const targetCard = selected[0];
                                                withUserSummon(
                                                    state,
                                                    cardInstance,
                                                    targetCard,
                                                    { canSelectPosition: false, optionPosition: ["defense"] },
                                                    () => {}
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "宣告者の神巫",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 2,
        element: "光" as const,
        race: "天使" as const,
        attack: 500,
        defense: 300,
        text: "このカード名の(1)(2)の効果はそれぞれ１ターンに１度しか使用できない。\n(1)：このカードが召喚・特殊召喚に成功した場合に発動できる。デッキ・ＥＸデッキから天使族モンスター１体を墓地へ送る。このカードのレベルはターン終了時まで、そのモンスターのレベル分だけ上がる。(2)：このカードがリリースされた場合に発動できる。手札・デッキから「宣告者の神巫」以外のレベル２以下の天使族モンスター１体を特殊召喚する。",
        image: "card100186167_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {
            onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
                // Search for a ritual monster
                const ritualMonsters = (state: GameStore) => {
                    return [...state.extraDeck, ...state.deck].filter(
                        (card) => monsterFilter(card.card) && card.card.race === "天使"
                    );
                };

                if (ritualMonsters(gameState).length > 0) {
                    withUserSelectCard(
                        gameState,
                        cardInstance,
                        ritualMonsters,
                        { select: "single", message: "墓地に送る天使族モンスターを選択してください" },
                        (state, card, selected) => {
                            const targetCard = selected[0].card as LeveledMonsterCard;
                            sendCard(state, selected[0], "Graveyard");
                            addBuf(state, card, { attack: 0, defense: 0, level: targetCard.level });
                        }
                    );
                }
            },
        },
    },
    {
        card_name: "神聖なる魂",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 6,
        element: "光" as const,
        race: "天使" as const,
        attack: 2000,
        defense: 1800,
        text: "このカードは通常召喚できない。自分の墓地から光属性モンスター２体を除外した場合に特殊召喚できる。(1)：このカードがモンスターゾーンに存在する限り、相手フィールドのモンスターの攻撃力は、相手バトルフェイズの間３００ダウンする。",
        image: "card100177659_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    if (cardInstance.location !== "Hand") return false;

                    // Check if there are at least 2 light attribute monsters in graveyard
                    const lightMonsters = gameState.graveyard.filter((card) => {
                        if (!monsterFilter(card.card)) return false;
                        return card.card.element === "光";
                    });

                    const hasEmptyZone = gameState.field.monsterZones.some((zone) => zone === null);

                    return lightMonsters.length >= 2 && hasEmptyZone;
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    const lightMonsters = (gameState: GameStore) =>
                        gameState.graveyard.filter((card) => {
                            if (!monsterFilter(card.card)) return false;
                            return card.card.element === "光";
                        });

                    withUserSelectCard(
                        gameState,
                        cardInstance,
                        lightMonsters,
                        {
                            select: "multi",
                            condition: (cards) => cards.length === 2,
                            message: "除外する光属性モンスター2体を選択してください",
                        },
                        (state, card, selected) => {
                            // Sequential banishing with delay for proper animation
                            selected.forEach((monster, index) => {
                                withDelay(state, card, { order: index + 1 }, (delayState) => {
                                    banish(delayState, monster);
                                });
                            });
                            // Special summon this card
                            withUserSummon(state, card, card, {}, () => {
                                // Card is summoned
                            });
                        }
                    );
                },
            },
        },
    },
    {
        card_name: "クリッター",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 3,
        element: "闇" as const,
        race: "悪魔" as const,
        attack: 1000,
        defense: 600,
        text: "このカード名の効果は１ターンに１度しか使用できない。(1)：このカードがフィールドから墓地へ送られた場合に発動する。デッキから攻撃力１５００以下のモンスター１体を手札に加える。このターン、自分はこの効果で手札に加えたカード及びその同名カードの効果を発動できない。",
        image: "card100350408_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {
            onFieldToGraveyard: (state, card) =>
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const targets = (state: GameStore) =>
                        state.deck.filter((c) => monsterFilter(c.card) && c.card.attack <= 1500);

                    if (targets(state).length === 0) {
                        return;
                    }

                    withUserSelectCard(
                        state,
                        card,
                        targets,
                        {
                            select: "single",
                            order: 999,
                            message: "手札に加える攻撃力1500以下のモンスターを選択してください",
                        },
                        (state, _, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    );
                }),
        },
    },
] as const satisfies CommonMonster[];

// Create a map for easy lookup
export const CommonMonsterMap = COMMON_MONSTERS.reduce(
    (prev, cur) => ({ ...prev, [cur.card_name]: cur }),
    {}
) as Record<(typeof COMMON_MONSTERS)[number]["card_name"], (typeof COMMON_MONSTERS)[number]>;
