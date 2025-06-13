import type { ExtraMonster, MonsterCard } from "@/types/card";
import { sumLink, monsterFilter } from "@/utils/cardManagement";
import { withTurnAtOneceCondition, withTurnAtOneceEffect, withUserSelectCard } from "@/utils/effectUtils";
import { sendCard, equipCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

const card = {
    card_name: "ユニオン・キャリアー",
    card_type: "モンスター" as const,
    monster_type: "リンクモンスター" as const,
    link: 2,
    linkDirection: ["下", "右"] as const,
    element: "光" as const,
    race: "機械" as const,
    attack: 1000,
    filterAvailableMaterials: () => true,
    materialCondition: (card: CardInstance[]) => {
        if (card.length !== 2 || sumLink(card) !== 2) return false;
        const [card1, card2] = card;
        // Check if they have the same race or same element
        if (!monsterFilter(card1.card) || !monsterFilter(card2.card)) {
            return false;
        }

        const sameRace = card1.card.race === card2.card.race;
        const sameElement = card1.card.element === card2.card.element;

        return sameRace || sameElement;
    },
    text: "種族または属性が同じモンスター2体\nこのカード名の効果は１ターンに１度しか使用できない。このカードはリンク召喚されたターンにはリンク素材にできない。①：自分フィールドの表側表示モンスター１体を対象として発動できる。元々の種族または元々の属性が対象のモンスターと同じモンスター１体を手札・デッキから選び、攻撃力１０００アップの装備カード扱いとして対象のモンスターに装備する。この効果でデッキから装備した場合、ターン終了時まで自分はその装備したモンスターカード及びその同名モンスターを特殊召喚できない。",
    image: "card100179237_1.jpg",
    hasDefense: false as const,
    hasLevel: false as const,
    hasLink: true as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: (state: GameStore, card: CardInstance) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const faceUpMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones]
                        .filter(
                            (monster): monster is CardInstance =>
                                monster !== null &&
                                (monster.position === "attack" || monster.position === "defense")
                        )
                        .filter((monster) => {
                            const typedMonster = monster.card as MonsterCard;
                            return (
                                [...state.hand, ...state.deck].filter(
                                    (card) =>
                                        monsterFilter(card.card) &&
                                        (card.card.race === typedMonster.race ||
                                            card.card.element === typedMonster.element)
                                ).length > 0
                            );
                        });
                    const hasEmptySpellField =
                        state.field.spellTrapZones.filter((e): e is CardInstance => e === null).length > 0;
                    return faceUpMonsters.length > 0 && hasEmptySpellField && card.location === "MonsterField";
                });
            },
            effect: (state: GameStore, card: CardInstance) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const faceUpMonsters = (state: GameStore) =>
                        [...state.field.monsterZones, ...state.field.extraMonsterZones]
                            .filter(
                                (monster): monster is CardInstance =>
                                    monster !== null &&
                                    monster.position !== "back_defense" &&
                                    monster.position !== "back"
                            )
                            .filter((monster) => {
                                const typedMonster = monster.card as MonsterCard;
                                return (
                                    [...state.hand, ...state.deck].filter(
                                        (card) =>
                                            monsterFilter(card.card) &&
                                            (card.card.race === typedMonster.race ||
                                                card.card.element === typedMonster.element)
                                    ).length > 0
                                );
                            });

                    withUserSelectCard(
                        state,
                        card,
                        faceUpMonsters,
                        { select: "single", message: "装備する対象のモンスターを1体選んでください" },
                        (state, card, selected) => {
                            const equipTarget = selected[0];
                            const target = (state: GameStore) => {
                                const typedMonster = equipTarget.card as MonsterCard;
                                return [...state.hand, ...state.deck].filter(
                                    (card) =>
                                        monsterFilter(card.card) &&
                                        (card.card.race === typedMonster.race ||
                                            card.card.element === typedMonster.element)
                                );
                            };
                            withUserSelectCard(
                                state,
                                card,
                                target,
                                { select: "single", message: "装備するモンスターをデッキから1体選んでください" },
                                (state, _, selected) => {
                                    const buffedCard = {
                                        ...selected[0],
                                        buf: { attack: 1000, defense: 0, level: 0 },
                                    };

                                    sendCard(state, buffedCard, "SpellField");
                                    equipCard(state, equipTarget, buffedCard);
                                }
                            );
                        }
                    );
                });
            },
        },
    },
} satisfies ExtraMonster;

export default card;