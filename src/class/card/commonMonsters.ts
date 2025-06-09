import type { CommonMonster } from "../cards";
import {
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSelectCard,
    sendCard,
    monsterFilter,
    hasLevelMonsterFilter,
    banish,
    summon,
    withUserSummon,
    draitronIgnitionCondition,
    getDraitronReleaseTargets,
    withUserConfirm,
} from "../cards";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

interface MagicCardWithType {
    card_type: string;
    magic_type?: string;
}

// Define monsters as literal objects with proper typing
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
        effect: {
            onAnywhereToGraveyard: (gameState: GameStore, _cardInstance: CardInstance) => {
                const exodiaPieces = [
                    "封印されしエクゾディア",
                    "封印されし者の右腕",
                    "封印されし者の左腕",
                    "封印されし者の右足",
                    "封印されし者の左足",
                ];

                const hasAllPieces = exodiaPieces.every((pieceName) =>
                    gameState.hand.some((card) => card.card.card_name === pieceName)
                );

                if (hasAllPieces) {
                    console.log("Exodia win condition met!");
                }
            },
        },
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
        text: "「封印されしエクゾディア」と組み合わせることで真の力を発揮する封印されし右腕。",
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
        text: "「封印されしエクゾディア」と組み合わせることで真の力を発揮する封印されし左腕。",
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
        text: "「封印されしエクゾディア」と組み合わせることで真の力を発揮する封印されし右足。",
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
        text: "「封印されしエクゾディア」と組み合わせることで真の力を発揮する封印されし左足。",
        image: "card100014920_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {},
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
        card_name: "神聖なる魂",
        card_type: "モンスター" as const,
        monster_type: "効果モンスター" as const,
        level: 6,
        element: "光" as const,
        race: "天使" as const,
        attack: 2000,
        defense: 1800,
        text: "このカードは通常召喚できない。\\n自分の墓地から光属性モンスター２体を除外した場合に特殊召喚できる。(1)：このカードがモンスターゾーンに存在する限り、相手フィールドのモンスターの攻撃力は、相手バトルフェイズの間３００ダウンする。",
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
                    const lightMonstersInGrave = gameState.graveyard.filter((card) => {
                        if (!monsterFilter(card.card)) return false;
                        return card.card.element === "光";
                    });
                    return lightMonstersInGrave.length >= 2;
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    const lightMonstersInGrave = gameState.graveyard.filter((card) => {
                        if (!monsterFilter(card.card)) return false;
                        return card.card.element === "光";
                    });

                    withUserSelectCard(
                        gameState,
                        cardInstance,
                        lightMonstersInGrave,
                        {
                            select: "multi",
                            condition: (cards: CardInstance[]) => cards.length === 2,
                        },
                        (state, card, selected) => {
                            selected.forEach((selectedCard) => {
                                banish(state, selectedCard);
                            });
                            withUserSummon(state, card, card, () => {});
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
        text: "このカード名の効果は1ターンに1度しか使用できない。①：このカードがフィールドから墓地へ送られた場合に発動する。デッキから攻撃力1500以下のモンスター1体を手札に加える。このターン、自分はこの効果で手札に加えたカード及びその同名カードの発動ができない。",
        image: "card100350408_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {
            onFieldToGraveyard: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return;

                const availableMonsters = gameState.deck.filter((card) => {
                    if (!monsterFilter(card.card)) return false;
                    return card.card.attack <= 1500;
                });

                if (availableMonsters.length === 0) return;

                withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        availableMonsters,
                        { select: "single" },
                        (state, _card, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    );
                });
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
        text: "このカード名の①②の効果はそれぞれ1ターンに1度しか使用できない。①：このカードが召喚・特殊召喚に成功した場合に発動できる。デッキ・EXデッキから天使族モンスター1体を墓地へ送る。このカードのレベルはターン終了時まで、そのモンスターのレベル分だけ上がる。②：このカードがリリースされた場合に発動できる。手札・デッキから「宣告者の神巫」以外のレベル2以下の天使族モンスター1体を特殊召喚する。",
        image: "card100186167_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: true,
        effect: {
            onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true, "宣告者の神巫_effect1")) return;

                const angels = [...gameState.deck, ...gameState.extraDeck].filter((card) => {
                    if (!monsterFilter(card.card)) return false;
                    return card.card.race === "天使";
                });

                if (angels.length === 0) return;

                withTurnAtOneceEffect(
                    gameState,
                    cardInstance,
                    (state, card) => {
                        withUserSelectCard(state, card, angels, { select: "single" }, (state, card, selected) => {
                            const selectedCard = selected[0];
                            sendCard(state, selectedCard, "Graveyard");

                            if (hasLevelMonsterFilter(selectedCard.card)) {
                                card.buf.level += selectedCard.card.level;
                            }
                        });
                    },
                    "宣告者の神巫_effect1"
                );
            },
            onRelease: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true, "宣告者の神巫_effect2")) return;

                const lowLevelAngels = [...gameState.hand, ...gameState.deck].filter((card) => {
                    if (!monsterFilter(card.card)) return false;
                    if (card.card.card_name === "宣告者の神巫") return false;
                    if (!hasLevelMonsterFilter(card.card)) return false;
                    return card.card.race === "天使" && card.card.level <= 2;
                });

                if (lowLevelAngels.length === 0) return;

                withTurnAtOneceEffect(
                    gameState,
                    cardInstance,
                    (state, card) => {
                        withUserConfirm(state, card, {}, (state, card) => {
                            withUserSelectCard(
                                state,
                                card,
                                lowLevelAngels,
                                { select: "single" },
                                (state, card, selected) => {
                                    withUserSummon(state, card, selected[0], () => {});
                                }
                            );
                        });
                    },
                    "宣告者の神巫_effect2"
                );
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
                condition: draitronIgnitionCondition,
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        const releaseTargets = getDraitronReleaseTargets(state, card);

                        withUserSelectCard(
                            state,
                            card,
                            releaseTargets,
                            { select: "single" },
                            (state, card, selected) => {
                                sendCard(state, selected[0], "Graveyard");
                                const summoned = summon(state, card, 0, "defense");

                                const draitronInGrave = state.graveyard.filter((c) => {
                                    if (!monsterFilter(c.card)) return false;
                                    return (
                                        c.card.card_name.includes("竜輝巧") &&
                                        c.card.card_name !== "竜輝巧－エルγ" &&
                                        c.card.attack === 2000
                                    );
                                });

                                if (draitronInGrave.length > 0) {
                                    withUserConfirm(state, summoned, {}, (state, card) => {
                                        withUserSelectCard(
                                            state,
                                            card,
                                            draitronInGrave,
                                            { select: "single" },
                                            (state, card, selected) => {
                                                withUserSummon(state, card, selected[0], () => {});
                                            }
                                        );
                                    });
                                }
                            }
                        );
                    });
                },
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
                condition: draitronIgnitionCondition,
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        const releaseTargets = getDraitronReleaseTargets(state, card);

                        withUserSelectCard(
                            state,
                            card,
                            releaseTargets,
                            { select: "single" },
                            (state, card, selected) => {
                                sendCard(state, selected[0], "Graveyard");
                                const summoned = summon(state, card, 0, "defense");

                                const ritualSpells = state.deck.filter((c) => {
                                    const magicCard = c.card as MagicCardWithType;
                                    return magicCard.card_type === "魔法" && magicCard.magic_type === "儀式魔法";
                                });

                                if (ritualSpells.length > 0) {
                                    withUserConfirm(state, card, {}, (state) => {
                                        withUserSelectCard(
                                            state,
                                            summoned,
                                            ritualSpells,
                                            { select: "single" },
                                            (state, _card, selected) => {
                                                sendCard(state, selected[0], "Hand");
                                            }
                                        );
                                    });
                                }
                            }
                        );
                    });
                },
            },
        },
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
                condition: draitronIgnitionCondition,
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        const releaseTargets = getDraitronReleaseTargets(state, card);

                        withUserSelectCard(
                            state,
                            card,
                            releaseTargets,
                            { select: "single" },
                            (state, card, selected) => {
                                sendCard(state, selected[0], "Graveyard");
                                const summoned = summon(state, card, 0, "defense");

                                const ritualMonsters = state.deck.filter((c) => {
                                    if (!monsterFilter(c.card)) return false;
                                    return c.card.monster_type === "儀式モンスター";
                                });

                                if (ritualMonsters.length > 0) {
                                    withUserConfirm(state, summoned, {}, (state, card) => {
                                        withUserSelectCard(
                                            state,
                                            card,
                                            ritualMonsters,
                                            { select: "single" },
                                            (state, _card, selected) => {
                                                sendCard(state, selected[0], "Hand");
                                            }
                                        );
                                    });
                                }
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "サイバー・エンジェル－弁天－",
        card_type: "モンスター" as const,
        monster_type: "儀式モンスター" as const,
        level: 6,
        element: "光" as const,
        race: "天使" as const,
        attack: 1800,
        defense: 1500,
        text: "「機械天使の儀式」により降臨。①：このカードが戦闘でモンスターを破壊し墓地へ送った場合に発動する。そのモンスターの元々の守備力分のダメージを相手に与える。②：このカードがリリースされた場合に発動できる。デッキから天使族・光属性モンスター１体を手札に加える。",
        image: "card100035806_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onRelease: (gameState: GameStore, cardInstance: CardInstance) => {
                const lightAngels = gameState.deck.filter((card) => {
                    if (!monsterFilter(card.card)) return false;
                    return card.card.race === "天使" && card.card.element === "光";
                });

                if (lightAngels.length === 0) return;
                withUserConfirm(gameState, cardInstance, {}, (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        lightAngels,
                        { select: "single" },
                        (state, _card, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    );
                });
            },
        },
    },
    {
        card_name: "サイバー・エンジェル－韋駄天－",
        card_type: "モンスター" as const,
        monster_type: "儀式モンスター" as const,
        level: 6,
        element: "光" as const,
        race: "天使" as const,
        attack: 1600,
        defense: 2000,
        text: "「機械天使の儀式」により降臨。①：このカードが儀式召喚に成功した場合に発動できる。自分のデッキ・墓地から儀式魔法カード１枚を選んで手札に加える。②：このカードがリリースされた場合に発動できる。自分フィールドの全ての儀式モンスターの攻撃力・守備力は１０００アップする。",
        image: "card100133121_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasRank: false as const,
        hasLink: false as const,
        canNormalSummon: false,
        effect: {
            onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
                if (cardInstance.summonedBy !== "Special") return;

                const ritualSpells = [...gameState.deck, ...gameState.graveyard].filter((card) => {
                    const magicCard = card.card as MagicCardWithType;
                    return magicCard.card_type === "魔法" && magicCard.magic_type === "儀式魔法";
                });

                if (ritualSpells.length === 0) return;

                withUserConfirm(gameState, cardInstance, {}, (state, card) => {
                    withUserSelectCard(state, card, ritualSpells, { select: "single" }, (state, _card, selected) => {
                        sendCard(state, selected[0], "Hand");
                    });
                });
            },
            onRelease: (gameState: GameStore) => {
                [...gameState.field.monsterZones, ...gameState.field.extraMonsterZones].forEach((zone) => {
                    if (!zone) return;
                    if (!monsterFilter(zone.card)) return;
                    if (zone.card.monster_type === "儀式モンスター") {
                        zone.buf.attack += 1000;
                        zone.buf.defense += 1000;
                    }
                });
            },
        },
    },
] as const satisfies readonly CommonMonster[];

export const CommonMonsterMap = COMMON_MONSTERS.reduce(
    (prev, cur) => ({ ...prev, [cur.card_name]: cur }),
    {}
) as Record<(typeof COMMON_MONSTERS)[number]["card_name"], CommonMonster>;