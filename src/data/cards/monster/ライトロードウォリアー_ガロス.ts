import { withDelayRecursive, withDraw } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・ウォリアー ガロス",
    card_type: "モンスター" as const,
    text: "自分フィールド上に表側表示で存在する「ライトロード・ウォリアー ガロス」以外の「ライトロード」と名のついたモンスターの効果によって自分のデッキからカードが墓地に送られる度に、自分のデッキの上からカードを２枚墓地に送る。このカードの効果で墓地に送られた「ライトロード」と名のついたモンスター１体につき、自分のデッキからカードを１枚ドローする。",
    image: "card1002381_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "戦士族" as const,
    attack: 1850,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onStandbyPhase: (state, card) => {
            if (card.location === "MonsterField" && (card.position === "attack" || card.position === "defense")) {
                // エンドフェイズでデッキの上から2枚墓地に送る効果（簡略化）
                const sentCards: typeof state.deck = [];
                
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    2,
                    (state, card, depth) => {
                        if (state.deck.length > 0) {
                            const topCard = state.deck[0];
                            sentCards.push(topCard);
                            sendCard(state, topCard, "Graveyard");
                        }
                    },
                    (state, card) => {
                        // 送ったカードの中のライトロードモンスターの数だけドロー
                        const lightlordCount = sentCards.filter(c => 
                            c.card.card_name.includes("ライトロード") && c.card.card_type === "モンスター"
                        ).length;
                        
                        if (lightlordCount > 0) {
                            withDraw(state, card, { count: lightlordCount });
                        }
                    }
                );
            }
        }
    },
};
