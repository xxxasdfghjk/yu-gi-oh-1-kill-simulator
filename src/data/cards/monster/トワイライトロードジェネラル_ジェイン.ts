import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard, addBuf } from "@/utils/cardMovement";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";

export default {
    card_name: "トワイライトロード・ジェネラル ジェイン",
    card_type: "モンスター" as const,
    text: "①：１ターンに１度、自分の手札・墓地から「ライトロード」モンスター１体を除外し、フィールドの表側表示モンスター１体を対象として発動できる。 そのモンスターの攻撃力・守備力はターン終了時まで、除外したモンスターのレベル×３００ダウンする。 ②：１ターンに１度、このカード以外の自分の「ライトロード」モンスターの効果が発動した場合に発動する。自分のデッキの上からカードを２枚墓地へ送る。",
    image: "card100051817_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "戦士族" as const,
    attack: 1800,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const lightroadInHandGrave = [
                        ...new CardSelector(state).hand().get(),
                        ...new CardSelector(state).graveyard().get()
                    ].filter(c => c.card.card_name.includes("ライトロード"));
                    
                    const faceUpMonsters = [
                        ...new CardSelector(state).allMonster().filter().nonNull().get().filter(m => m.position === "attack" || m.position === "defense"),
                        ...state.opponentField.monsterZones.filter(m => m !== null && (m.position === "attack" || m.position === "defense")),
                        ...state.opponentField.extraMonsterZones.filter(m => m !== null && (m.position === "attack" || m.position === "defense"))
                    ];
                    
                    return lightroadInHandGrave.length > 0 && faceUpMonsters.length > 0 && card.location === "MonsterField";
                }, "TwilightJane_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const lightroadInHandGrave = [
                        ...new CardSelector(state).hand().get(),
                        ...new CardSelector(state).graveyard().get()
                    ].filter(c => c.card.card_name.includes("ライトロード"));
                    
                    withUserSelectCard(
                        state,
                        card,
                        () => lightroadInHandGrave,
                        {
                            select: "single",
                            message: "除外する「ライトロード」モンスターを選択してください"
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                const banishedCard = selected[0];
                                const level = hasLevelMonsterFilter(banishedCard.card) ? banishedCard.card.level : 0;
                                const debuff = level * 300;
                                
                                sendCard(state, banishedCard, "Exclusion");
                                
                                const faceUpMonsters = [
                                    ...new CardSelector(state).allMonster().filter().nonNull().get().filter(m => m.position === "attack" || m.position === "defense"),
                                    ...state.opponentField.monsterZones.filter(m => m !== null && (m.position === "attack" || m.position === "defense")),
                                    ...state.opponentField.extraMonsterZones.filter(m => m !== null && (m.position === "attack" || m.position === "defense"))
                                ];
                                
                                withUserSelectCard(
                                    state,
                                    card,
                                    () => faceUpMonsters,
                                    {
                                        select: "single",
                                        message: "攻撃力・守備力をダウンさせるモンスターを選択してください"
                                    },
                                    (state, card, selected2) => {
                                        if (selected2.length > 0) {
                                            addBuf(state, selected2[0], { attack: -debuff, defense: -debuff, level: 0 });
                                        }
                                    }
                                );
                            }
                        }
                    );
                }, "TwilightJane_Ignition");
            }
        }
    },
};
