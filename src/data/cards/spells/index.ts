import type { MagicCard, CardInstance, MonsterCard, LeveledMonsterCard } from "@/types/card";
import { hasLevelMonsterFilter, monsterFilter, isMagicCard, isTrapCard } from "@/utils/cardManagement";
import {
    withDelay,
    withOption,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSelectCard,
    withUserSummon,
} from "@/utils/effectUtils";
import { addBuf, banishFromRandomExtractDeck, sendCard } from "@/utils/cardMovement";
import type { GameStore } from "@/store/gameStore";
import { getLevel, shuffleDeck } from "@/utils/gameUtils";

export const MAGIC_CARDS = [
    {
        card_name: "金満で謙虚な壺",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分はカードの効果でドローできない。①：自分のＥＸデッキのカード３枚または６枚を裏側表示で除外して発動できる。除外した数だけ自分のデッキの上からカードをめくり、その中から１枚を選んで手札に加え、残りのカードを好きな順番でデッキの一番下に戻す。ターン終了時まで相手が受ける全てのダメージは半分になる。",
        image: "card100214871_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(
                        state,
                        card,
                        (state) => state.extraDeck.length >= 3 && state.deck.length >= 3
                    ),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        withOption(
                            state,
                            card,
                            [
                                {
                                    name: "３枚除外",
                                    condition: (state) => state.extraDeck.length >= 3 && state.deck.length >= 3,
                                },
                                {
                                    name: "６枚除外",
                                    condition: (state) => state.extraDeck.length >= 6 && state.deck.length >= 6,
                                },
                            ],
                            (state, card, option) => {
                                const excludeNum = option === "３枚除外" ? 3 : 6;
                                banishFromRandomExtractDeck(state, excludeNum);
                                withUserSelectCard(
                                    state,
                                    card,
                                    (state) => state.deck.slice(0, excludeNum),
                                    { select: "single" as const, message: "手札に加えるカードを選択してください" },
                                    (state, _cardInstance, selected) => {
                                        sendCard(state, selected[0], "Hand" as const);
                                    }
                                );
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "ワン・フォー・ワン",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：手札からモンスター１体を墓地へ送って発動できる。手札・デッキからレベル１モンスター１体を特殊召喚する。",
        image: "card100013349_1.jpg",
        effect: {
            onSpell: {
                condition: (state) => {
                    if (state.hand.filter((e) => monsterFilter(e.card)).length === 0) {
                        return false;
                    }
                    if (
                        [...state.deck, ...state.hand].filter(
                            (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                        ).length === 0
                    ) {
                        return false;
                    }
                    // 手札にレベル1モンスター一体かつ手札コストとして払えるのがそれだけかつデッキに１コスがない場合NG
                    if (
                        state.deck.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 0 &&
                        state.hand.filter((e) => monsterFilter(e.card)).length === 1 &&
                        state.hand.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 1
                    ) {
                        return false;
                    }
                    return true;
                },
                effect: (state, card) =>
                    withUserSelectCard(
                        state,
                        card,
                        (state) => state.hand.filter((e) => monsterFilter(e.card)),
                        {
                            select: "single",
                            message: "手札から墓地に送るモンスターを選択してください",
                            condition: (cardList, state) => {
                                const targetList = [...state.hand, ...state.deck].filter(
                                    (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                                );
                                if (targetList.length >= 2) {
                                    return true;
                                }
                                if (targetList.length === 1) {
                                    return targetList[0].id !== cardList[0].id;
                                } else {
                                    return false;
                                }
                            },
                        },
                        (state, card, select) => {
                            sendCard(state, select[0], "Graveyard");
                            withUserSelectCard(
                                state,
                                card,
                                (state) =>
                                    [...state.hand, ...state.deck].filter(
                                        (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                                    ),
                                {
                                    select: "single",
                                    message: "特殊召喚するレベル1モンスターを選択してください",
                                },
                                (state, card, selected) => {
                                    withUserSummon(state, card, selected[0], {}, () => {});
                                }
                            );
                        }
                    ),
            },
        },
    },
    {
        card_name: "おろかな埋葬",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：デッキからモンスター１体を墓地へ送る。",
        image: "card100024670_1.jpg",
        effect: {
            onSpell: {
                condition: (state) => state.deck.filter((e) => monsterFilter(e.card)).length > 0,
                effect: (state, card) =>
                    withUserSelectCard(
                        state,
                        card,
                        (state) => state.deck.filter((e) => monsterFilter(e.card)),
                        { select: "single", message: "デッキから墓地に送るモンスターを選択してください" },
                        (state, _cardInstance, selected) => {
                            sendCard(state, selected[0], "Graveyard");
                        }
                    ),
            },
        },
    },
    {
        card_name: "ジャック・イン・ザ・ハンド",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは1ターンに1枚しか発動できない。①：デッキからカード名が異なるレベル1モンスター3体を相手に見せ、相手はその中から1体を選んで自身の手札に加える。自分は残りのカードの中から1体を選んで手札に加え、残りをデッキに戻す。",
        image: "card100204881_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(state, card, (state) => {
                        // Get all level 1 monsters from deck
                        const level1Monsters = state.deck.filter(
                            (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                        );
                        // Check if we have at least 3 different card names
                        const uniqueNames = new Set(level1Monsters.map((e) => e.card.card_name));
                        return uniqueNames.size >= 3;
                    }),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        // Player selects from remaining 2 cards
                        withUserSelectCard(
                            state,
                            card,
                            (state) =>
                                state.deck
                                    .filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1)
                                    .reduce<CardInstance[]>(
                                        (prev, cur) =>
                                            prev.find((e) => e.card.card_name === cur.card.card_name)
                                                ? prev
                                                : [...prev, cur],
                                        []
                                    ),
                            {
                                select: "multi",
                                condition: (cards) => cards.length === 3,
                                message: "デッキから異なるレベル1モンスター3体を選択してください",
                            },
                            (state, _cardInstance, selected) => {
                                const rand = Math.floor(Math.random() * 3);
                                const option = selected.filter((_, i) => i !== rand);
                                withUserSelectCard(
                                    state,
                                    _cardInstance,
                                    () => option,
                                    { select: "single", message: "手札に加えるレベル1モンスターを選択してください" },
                                    (state, _cardInstance, selected) => {
                                        sendCard(state, selected[0], "Hand");
                                    }
                                );
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "エマージェンシー・サイバー",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できない。①：デッキから「サイバー・ドラゴン」モンスターまたは通常召喚できない機械族・光属性モンスター１体を手札に加える。②：相手によってこのカードの発動が無効になり、このカードが墓地へ送られた場合、手札を１枚捨てて発動できる。このカードを手札に加える。",
        image: "card100095117_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(
                        state,
                        card,
                        (state) =>
                            !!state.deck.find(
                                (e) =>
                                    monsterFilter(e.card) &&
                                    e.card.race === "機械" &&
                                    e.card.element === "光" &&
                                    e.card.canNormalSummon === false
                            )
                    ),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) =>
                                state.deck.filter(
                                    (e) =>
                                        monsterFilter(e.card) &&
                                        e.card.race === "機械" &&
                                        e.card.element === "光" &&
                                        e.card.canNormalSummon === false
                                ),
                            {
                                select: "single" as const,
                                message: "デッキから手札に加える機械族・光属性モンスターを選択してください",
                            },
                            (state, _cardInstance, selected) => {
                                sendCard(state, selected[0], "Hand" as const);
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "極超の竜輝巧",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない。①：デッキから「ドライトロン」モンスター１体を特殊召喚する。この効果で特殊召喚したモンスターはエンドフェイズに破壊される。",
        image: "card100206552_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(
                        state,
                        card,
                        (state) =>
                            state.deck.filter((e) => monsterFilter(e.card) && e.card.card_name.includes("竜輝巧"))
                                .length > 0
                    ),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) =>
                                state.deck.filter((e) => monsterFilter(e.card) && e.card.card_name.includes("竜輝巧")),
                            {
                                select: "single",
                                message: "デッキから特殊召喚するドライトロンモンスターを選択してください",
                            },
                            (state, _cardInstance, selected) => {
                                withUserSummon(state, _cardInstance, selected[0], {}, () => {});
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "竜輝巧－ファフニール",
        card_type: "魔法" as const,
        magic_type: "フィールド魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できない。①：このカードの発動時の効果処理として、デッキから「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カード１枚を手札に加える事ができる。②：儀式魔法カードの効果の発動及びその発動した効果は無効化されない。③：１ターンに１度、自分フィールドに「ドライトロン」モンスターが存在する状態で、モンスターが表側表示で召喚・特殊召喚された場合に発動できる。このターン、その表側表示モンスターのレベルは、その攻撃力１０００につき１つ下がる（最小１まで）。",
        image: "card100206543_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(state, card, (state) => {
                        const draitronSpellTrap = state.deck.filter(
                            (e) =>
                                (isMagicCard(e.card) || isTrapCard(e.card)) &&
                                e.card.card_name.includes("竜輝巧") &&
                                e.card.card_name !== "竜輝巧－ファフニール"
                        );
                        return draitronSpellTrap.length > 0;
                    }),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        const draitronSpellTrap = (state: GameStore) =>
                            state.deck.filter(
                                (e) =>
                                    (isMagicCard(e.card) || isTrapCard(e.card)) &&
                                    e.card.card_name.includes("竜輝巧") &&
                                    e.card.card_name !== "竜輝巧－ファフニール"
                            );
                        withUserSelectCard(
                            state,
                            card,
                            draitronSpellTrap,
                            {
                                select: "single",
                                message: "デッキから手札に加えるドライトロン魔法・罠カードを選択してください",
                            },
                            (state, _cardInstance, selected) => {
                                sendCard(state, selected[0], "Hand");
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "テラ・フォーミング",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：デッキからフィールド魔法カード１枚を手札に加える。",
        image: "card73707637_1.jpg",
        effect: {
            onSpell: {
                condition: (state) =>
                    state.deck.filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法").length > 0,
                effect: (state, card) =>
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck.filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法"),
                        { select: "single", message: "デッキから手札に加えるフィールド魔法カードを選択してください" },
                        (state, _cardInstance, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    ),
            },
        },
    },
    {
        card_name: "チキンレース",
        card_type: "魔法" as const,
        magic_type: "フィールド魔法" as const,
        text: "①：このカードがフィールドゾーンに存在する限り、相手よりＬＰが少ないプレイヤーが受ける全てのダメージは０になる。②：お互いのプレイヤーは１ターンに１度、自分メインフェイズに１０００ＬＰを払って以下の効果から１つを選択して発動できる。この効果の発動に対して、お互いは魔法・罠・モンスターの効果を発動できない。●デッキから１枚ドローする。●このカードを破壊する。●相手は１０００ＬＰ回復する。",
        image: "card100022942_1.jpg",
        effect: {
            onSpell: {
                condition: () => true,
                effect: () => true,
            },
            onIgnition: {
                condition: (state, card) => {
                    return withTurnAtOneceCondition(
                        state,
                        card,
                        (state, card) =>
                            (state.field.fieldZone?.id === card.id || state.opponentField.fieldZone?.id === card.id) &&
                            state.lifePoints >= 1000
                    );
                    // Check if card is in field zone and player has enough LP
                },
                effect: (state, card) => {
                    withTurnAtOneceEffect(state, card, (state, card) => {
                        // Pay 1000 LP
                        state.lifePoints -= 1000;

                        // Choose one of three effects
                        withOption(
                            state,
                            card,
                            [
                                {
                                    name: "デッキから１枚ドローする",
                                    condition: () => state.deck.length > 0,
                                },
                                {
                                    name: "このカードを破壊する",
                                    condition: () => true,
                                },
                                {
                                    name: "相手は１０００ＬＰ回復する",
                                    condition: () => true,
                                },
                            ],
                            (state, card, option) => {
                                switch (option) {
                                    case "デッキから１枚ドローする":
                                        if (state.deck.length > 0) {
                                            shuffleDeck(state);
                                            const drawnCard = state.deck[0];
                                            sendCard(state, drawnCard, "Hand");
                                        }
                                        break;
                                    case "このカードを破壊する":
                                        sendCard(state, card, "Graveyard");
                                        break;
                                    case "相手は１０００ＬＰ回復する":
                                        // In a 1-turn game, we'll just ignore opponent LP recovery
                                        break;
                                }
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "盆回し",
        card_type: "魔法" as const,
        magic_type: "速攻魔法" as const,
        text: "①：自分のデッキからカード名が異なるフィールド魔法カード2枚を選び、その内の1枚を自分フィールドにセットし、もう1枚を相手フィールドにセットする。この効果でセットしたカードのいずれかがフィールドゾーンにセットされている限り、お互いに他のフィールド魔法カードを発動・セットできない。",
        image: "card100046458_1.jpg",
        effect: {
            onSpell: {
                condition: (state) => {
                    const fieldSpells = state.deck.filter(
                        (e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法"
                    );
                    // Check if we have at least 2 different field spell names
                    const uniqueNames = new Set(fieldSpells.map((e) => e.card.card_name));
                    return uniqueNames.size >= 2;
                },
                effect: (state, card) => {
                    // Group by card name and select up to 2 different names
                    // User selects which field spell to set on their own field zone
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck
                                .filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法")
                                .reduce<CardInstance[]>(
                                    (prev, cur) =>
                                        prev.find((e) => e.card.card_name === cur.card.card_name)
                                            ? prev
                                            : [...prev, cur],
                                    []
                                ),
                        {
                            select: "multi",
                            condition: (cards) => cards.length === 2,
                            message: "デッキから異なるフィールド魔法カード2枚を選択してください",
                        },
                        (state, _cardInstance, selectedList) => {
                            withUserSelectCard(
                                state,
                                _cardInstance,
                                () => selectedList,
                                {
                                    select: "single",
                                    message: "自分のフィールドゾーンにセットするフィールド魔法カードを選択してください",
                                },
                                (state, _, selected) => {
                                    if (state.field.fieldZone !== null) {
                                        sendCard(state, state.field.fieldZone, "Graveyard");
                                    }
                                    const otherCard = selectedList.find((c) => c.id !== selected[0].id)!;
                                    sendCard(state, otherCard, "OpponentField");
                                    withDelay(state, card, { order: 0 }, (state) => {
                                        sendCard(state, selected[0], "FieldZone");
                                        selected[0].card.effect.onSpell?.effect(state, selected[0]);
                                        // Set the other card to opponent's field zone
                                        // Enable field spell prohibition
                                        state.isFieldSpellActivationProhibited = true;
                                    });
                                }
                            );
                        }
                    );
                },
            },
        },
    },
    {
        card_name: "流星輝巧群",
        card_type: "魔法" as const,
        magic_type: "儀式魔法" as const,
        text: "儀式モンスターの降臨に必要。このカード名の②の効果は１ターンに１度しか使用できない。①：攻撃力の合計が儀式召喚するモンスターの攻撃力以上になるように、自分の手札・フィールドの機械族モンスターをリリースし、自分の手札・墓地から儀式モンスター１体を儀式召喚する。②：このカードが墓地に存在する場合、自分フィールドの「ドライトロン」モンスター１体を対象として発動できる。そのモンスターの攻撃力を相手ターン終了時まで１０００ダウンし、このカードを手札に加える。",
        image: "card100206549_1.jpg",
        effect: {
            onSpell: {
                condition: (state) => {
                    {
                        const ritualMonsters = [...state.hand, ...state.graveyard]
                            .filter((e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター")
                            .map((e) => e.card) as MonsterCard[];
                        const minRitualMonstersAttack = ritualMonsters.reduce(
                            (prev, cur) => Math.min(prev, cur.attack),
                            9999999999999
                        );

                        const extraMaterialCandidate = [...state.field.monsterZones, ...state.field.extraMonsterZones]
                            .filter(
                                (e): e is CardInstance =>
                                    e !== null &&
                                    monsterFilter(e.card) &&
                                    e.card.canUseMaterilForRitualSummon === true &&
                                    e.materials !== undefined
                            )
                            .map((e) => e.materials)
                            .flat();
                        const materials = [
                            ...state.hand,
                            ...state.field.monsterZones,
                            ...state.field.extraMonsterZones,
                            ...extraMaterialCandidate,
                        ]
                            .filter(
                                (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.race === "機械"
                            )
                            .map((e) => e.card) as MonsterCard[];
                        const sumOfMaterialsAttack = materials.reduce((prev, cur) => prev + cur.attack, 0);
                        return (
                            ritualMonsters.length > 0 &&
                            materials.length > 0 &&
                            sumOfMaterialsAttack >= minRitualMonstersAttack
                        );
                    }
                },
                effect: (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        (state) => {
                            return [...state.hand, ...state.graveyard].filter(
                                (e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター"
                            );
                        },
                        { select: "single", message: "儀式召喚する儀式モンスターを選択してください" },
                        (state, card, ritual) => {
                            withUserSelectCard(
                                state,
                                card,
                                (state) => {
                                    const extraMaterialCandidate = [
                                        ...state.field.monsterZones,
                                        ...state.field.extraMonsterZones,
                                    ]
                                        .filter(
                                            (e): e is CardInstance =>
                                                e !== null &&
                                                monsterFilter(e.card) &&
                                                e.card.canUseMaterilForRitualSummon === true &&
                                                e.materials !== undefined
                                        )
                                        .map((e) => e.materials)
                                        .flat();
                                    return [
                                        ...state.hand,
                                        ...state.field.monsterZones,
                                        ...state.field.extraMonsterZones,
                                        ...extraMaterialCandidate,
                                    ].filter(
                                        (e): e is CardInstance =>
                                            e !== null && monsterFilter(e.card) && e.card.race === "機械"
                                    );
                                },
                                {
                                    select: "multi",
                                    condition: (cardList) => {
                                        const ritualMonster = ritual[0].card as MonsterCard;
                                        const monsterList = cardList.map((e) => e.card) as MonsterCard[];
                                        const sumOfAttack = monsterList.reduce((prev, cur) => prev + cur.attack, 0);
                                        return (
                                            sumOfAttack >= ritualMonster.attack &&
                                            monsterList.every((e) => sumOfAttack - e.attack < ritualMonster.attack)
                                        );
                                    },
                                    message: "儀式素材として使用する機械族モンスターを選択してください",
                                },
                                (state, card, selected) => {
                                    for (const select of selected) {
                                        sendCard(state, select, "Graveyard");
                                    }
                                    withUserSummon(state, card, ritual[0], {}, () => {});
                                }
                            );
                        }
                    );
                },
            },
            onIgnition: {
                condition: (state, instance) => {
                    return withTurnAtOneceCondition(
                        state,
                        instance,
                        (state, instance) =>
                            instance.location === "Graveyard" &&
                            [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                                (e): e is CardInstance => e !== null && e.card.card_name.includes("竜輝巧")
                            ).length > 0
                    );
                },
                effect: (state, instance) => {
                    withTurnAtOneceEffect(state, instance, (state, instance) => {
                        withUserSelectCard(
                            state,
                            instance,
                            (state) =>
                                [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                                    (e): e is CardInstance => e !== null && e.card.card_name.includes("竜輝巧")
                                ),
                            {
                                select: "single",
                                message: "攻撃力を下げる対象のドライトロンモンスターを選択してください",
                            },
                            (state, instance, selected) => {
                                addBuf(state, selected[0], { attack: -1000, defense: 0, level: 0 });
                                sendCard(state, instance, "Hand");
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "高等儀式術",
        card_type: "魔法" as const,
        magic_type: "儀式魔法" as const,
        text: "儀式モンスターの降臨に必要。①：レベルの合計が儀式召喚するモンスターと同じになるように、デッキから通常モンスターを墓地へ送り、手札から儀式モンスター１体を儀式召喚する。",
        image: "card1001286_1.jpg",
        effect: {
            onSpell: {
                condition: (state, instance) => {
                    return withTurnAtOneceCondition(state, instance, (state) => {
                        const ritualMonsters = [...state.hand]
                            .filter((e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター")
                            .map((e) => e.card) as LeveledMonsterCard[];
                        const materials = [...state.deck]
                            .filter(
                                (e): e is CardInstance =>
                                    e !== null && monsterFilter(e.card) && e.card.monster_type === "通常モンスター"
                            )
                            .map((e) => e.card) as LeveledMonsterCard[];
                        const summonableLevel = materials.reduce(
                            (prev, cur) => {
                                const noAdd = prev;
                                const added = prev.map((e) => e + cur.level);
                                return Array.from(new Set([...noAdd, ...added]));
                            },
                            [0]
                        );
                        const summonableRitualMonster = ritualMonsters.filter((e) => summonableLevel.includes(e.level));
                        return ritualMonsters.length > 0 && materials.length > 0 && summonableRitualMonster.length > 0;
                    });
                },
                effect: (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        (state) => {
                            const ritualMonsters = [...state.hand].filter(
                                (e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター"
                            );
                            const materials = [...state.deck]
                                .filter(
                                    (e): e is CardInstance =>
                                        e !== null && monsterFilter(e.card) && e.card.monster_type === "通常モンスター"
                                )
                                .map((e) => e.card) as LeveledMonsterCard[];
                            const summonableLevel = materials.reduce(
                                (prev, cur) => {
                                    const noAdd = prev;
                                    const added = prev.map((e) => e + cur.level);
                                    return Array.from(new Set([...noAdd, ...added]));
                                },
                                [0]
                            );
                            return ritualMonsters.filter(
                                (e) => hasLevelMonsterFilter(e.card) && summonableLevel.includes(e.card.level)
                            );
                        },
                        { select: "single", message: "儀式召喚する儀式モンスターを選択してください" },
                        (state, card, ritualMonster) => {
                            withUserSelectCard(
                                state,
                                card,
                                (state) =>
                                    [...state.deck].filter(
                                        (e): e is CardInstance =>
                                            e !== null &&
                                            monsterFilter(e.card) &&
                                            e.card.monster_type === "通常モンスター"
                                    ),
                                {
                                    select: "multi",
                                    condition: (cardList) => {
                                        return (
                                            cardList.reduce((prev, cur) => prev + getLevel(cur), 0) ===
                                            getLevel(ritualMonster[0])
                                        );
                                    },
                                    message: "儀式素材として墓地に送る通常モンスターを選択してください",
                                },
                                (state, card, selected) => {
                                    withUserSummon(state, card, ritualMonster[0], {}, (state, card) => {
                                        for (let i = 0; i < selected.length; i++) {
                                            withDelay(state, card, { delay: i * 20 }, (state) => {
                                                sendCard(state, selected[i], "Graveyard");
                                            });
                                        }
                                    });
                                }
                            );
                        }
                    );
                },
            },
        },
    },
    {
        card_name: "儀式の準備",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "デッキからレベル７以下の儀式モンスター１体を手札に加える。その後、自分の墓地から儀式魔法カード１枚を選んで手札に加える事ができる。",
        image: "card100123678_1.jpg",
        effect: {
            onSpell: {
                condition: (state) =>
                    state.deck.filter(
                        (e) =>
                            hasLevelMonsterFilter(e.card) &&
                            e.card.monster_type === "儀式モンスター" &&
                            e.card.level <= 7
                    ).length > 0,
                effect: (state, card) =>
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck.filter(
                                (e) =>
                                    hasLevelMonsterFilter(e.card) &&
                                    e.card.monster_type === "儀式モンスター" &&
                                    e.card.level <= 7
                            ),
                        {
                            select: "single",
                            message: "デッキから手札に加えるレベル7以下の儀式モンスターを選択してください",
                        },
                        (state, _cardInstance, selected) => {
                            sendCard(state, selected[0], "Hand");
                            // Check if there are ritual spell cards in graveyard
                            const ritualSpells = state.graveyard.filter(
                                (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                            );
                            if (ritualSpells.length > 0) {
                                withUserSelectCard(
                                    state,
                                    _cardInstance,
                                    (state) =>
                                        state.graveyard.filter(
                                            (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                                        ),
                                    {
                                        select: "single",
                                        message: "墓地から手札に加える儀式魔法カードを選択してください",
                                    },
                                    (state, _cardInstance, selected) => {
                                        sendCard(state, selected[0], "Hand");
                                    }
                                );
                            }
                        }
                    ),
            },
        },
    },
] as const satisfies readonly MagicCard[];
