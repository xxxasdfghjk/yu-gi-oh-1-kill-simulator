import type { CardInstance } from "@/types/card";
import {
    type ExtraMonster,
    sumLevel,
    monsterFilter,
    hasLevelMonsterFilter,
    sumLink,
    hasRankMonsterFilter,
} from "../cards";

const createExtraMonster = (property: ExtraMonster): ExtraMonster => {
    return property;
};
export const EXTRA_MONSTERS = [
    createExtraMonster({
        card_name: "虹光の宣告者",
        monster_type: "シンクロモンスター",
        level: 4,
        element: "光",
        race: "天使",
        attack: 600,
        defense: 1000,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                sumLevel(card) === 4 &&
                card.find((e) => monsterFilter(e.card) && e.card.hasTuner) &&
                card.find((e) => monsterFilter(e.card) && !e.card.hasTuner)
            );
        },
        text: "チューナー＋チューナー以外のモンスター１体以上\n(1)：このカードがモンスターゾーンに存在する限り、お互いの手札・デッキから墓地へ送られるモンスターは墓地へは行かず除外される。\n(2)：モンスターの効果・魔法・罠カードが発動した時、このカードをリリースして発動できる。その発動を無効にし破壊する。\n(3)：このカードが墓地へ送られた場合に発動できる。デッキから儀式モンスター１体または儀式魔法カード１枚を手札に加える。",
        image: "card100179270_1.jpg",
        effect: {},
        canNormalSummon: false,
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: true,
        hasLink: false,
        hasRank: false,
    }),
    createExtraMonster({
        card_name: "セイクリッド・トレミスM7",
        monster_type: "エクシーズモンスター",
        rank: 6,
        element: "光",
        race: "機械",
        attack: 2700,
        defense: 2000,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 6));
        },
        text: "レベル６モンスター×２\nこのカードは「セイクリッド・トレミスM７」以外の自分フィールドの「セイクリッド」Xモンスターの上に重ねてX召喚する事もできる。この方法で特殊召喚したターン、このカードの①の効果は発動できない。①：１ターンに１度、このカードのX素材を１つ取り除き、自分または相手の、フィールド・墓地のモンスター１体を対象として発動できる。そのモンスターを持ち主の手札に戻す。",
        image: "card100287504_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "永遠の淑女 ベアトリーチェ",
        monster_type: "エクシーズモンスター",
        rank: 6,
        element: "光",
        race: "天使",
        attack: 2500,
        defense: 2800,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 6));
        },
        text: "①1ターンに1度、このカードのX素材を1つ取り除いて発動できる。デッキからカード1枚を選んで墓地へ送る。この効果は相手ターンでも発動できる。②このカードが相手によって破壊され墓地へ送られた場合に発動できる。EXデッキから「彼岸」モンスター1体を召喚条件を無視して特殊召喚する。",
        image: "card100330938_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "竜輝巧－ファフμβ'",
        monster_type: "エクシーズモンスター",
        rank: 1,
        element: "光",
        race: "機械",
        attack: 2000,
        defense: 0,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length >= 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1));
        },
        text: "レベル１モンスター×２体以上\nこのカード名の①③の効果はそれぞれ１ターンに１度しか使用できない。\n①：このカードがX召喚した場合に発動できる。デッキから「ドライトロン」カード１枚を墓地へ送る。\n②：自分が儀式召喚を行う場合、そのリリースするモンスターを、このカードのX素材から取り除く事もできる。\n③：自分フィールドに機械族の儀式モンスターが存在し、相手が魔法・罠カードを発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にし破壊する。",
        image: "card100221516_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "幻獣機アウローラドン",
        monster_type: "リンクモンスター",
        link: 3,
        linkDirection: ["左", "下", "右"],
        element: "風",
        race: "機械",
        attack: 2100,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.filter((e) => monsterFilter(e.card) && e.card.race === "機械").length >= 2 && sumLink(card) === 3
            );
        },
        text: "機械族モンスター２体以上\n①：このカードがリンク召喚に成功した場合に発動できる。自分フィールドに「幻獣機トークン」（機械族・風・星３・攻／守０）３体を特殊召喚する。このターン、自分はリンク召喚できない。②：１ターンに１度、自分フィールドのモンスターを３体までリリースして発動できる。リリースしたモンスターの数によって以下の効果を適用する。●１体：フィールドのカード１枚を選んで破壊する。●２体：デッキから「幻獣機」モンスター１体を特殊召喚する。●３体：自分の墓地から罠カード１枚を選んで手札に加える。",
        image: "card100179342_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: false,
        hasLevel: false,
        hasLink: true,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "警衛バリケイドベルグ",
        monster_type: "リンクモンスター",
        link: 2,
        linkDirection: ["左", "下"],
        element: "闇",
        race: "機械",
        attack: 1000,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && sumLink(card) === 2 && card[0].card.card_name !== card[1].card.card_name);
        },
        text: "カード名が異なるモンスター２体\nこのカード名の①の効果は１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合、手札を１枚捨てて発動できる。このターンのエンドフェイズに、自分の墓地から永続魔法カードまたはフィールド魔法カード１枚を選んで手札に加える。②：このカードがモンスターゾーンに存在する限り、自分フィールドの表側表示の魔法カードは相手の効果では破壊されない。",
        image: "card100322913_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: false,
        hasLevel: false,
        hasLink: true,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "ユニオン・キャリアー",
        monster_type: "リンクモンスター",
        link: 2,
        linkDirection: ["下", "右"],
        element: "光",
        race: "機械",
        attack: 1000,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.length >= 2 &&
                sumLink(card) === 2 &&
                ((monsterFilter(card[0].card) &&
                    monsterFilter(card[1].card) &&
                    card[0].card.race === card[1].card.race) ||
                    (monsterFilter(card[0].card) &&
                        monsterFilter(card[1].card) &&
                        card[0].card.element === card[1].card.element))
            );
        },
        text: "種族または属性が同じモンスター2体\nこのカード名の効果は１ターンに１度しか使用できない。このカードはリンク召喚されたターンにはリンク素材にできない。①：自分フィールドの表側表示モンスター１体を対象として発動できる。元々の種族または元々の属性が対象のモンスターと同じモンスター１体を手札・デッキから選び、攻撃力１０００アップの装備カード扱いとして対象のモンスターに装備する。この効果でデッキから装備した場合、ターン終了時まで自分はその装備したモンスターカード及びその同名モンスターを特殊召喚できない。",
        image: "card100179237_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: false,
        hasLevel: false,
        hasLink: true,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "転生炎獣アルミラージ",
        monster_type: "リンクモンスター",
        link: 1,
        linkDirection: ["右下"],
        element: "炎",
        race: "サイバース",
        attack: 0,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.length === 1 &&
                monsterFilter(card[0].card) &&
                card[0].summonedBy === "Normal" &&
                sumLink(card) === 1
            );
        },
        text: "このカード名の②の効果は１ターンに１度しか使用できない。①：このカードをリリースし、自分フィールドのモンスター１体を対象として発動できる。このターン、そのモンスターは相手の効果では破壊されない。この効果は相手ターンでも発動できる。②：このカードが墓地に存在し、通常召喚された自分のモンスターが戦闘で破壊された時に発動できる。このカードを特殊召喚する。",
        image: "card100354764_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: false,
        hasLevel: false,
        hasLink: true,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "リンクリボー",
        monster_type: "リンクモンスター",
        link: 1,
        linkDirection: ["下"],
        element: "闇",
        race: "サイバース",
        attack: 300,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.length === 1 &&
                hasLevelMonsterFilter(card[0].card) &&
                card[0].card.level === 1 &&
                sumLink(card) === 1
            );
        },
        text: "レベル1モンスター1体\n①このカードがリンク召喚に成功した時に発動できる。デッキからレベル1モンスター1体を墓地へ送る。②このカードが戦闘で破壊された場合に発動できる。手札からレベル1モンスター1体を特殊召喚する。",
        image: "card100358454_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: false,
        hasLevel: false,
        hasLink: true,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "旧神ヌトス",
        monster_type: "融合モンスター",
        level: 4,
        element: "光",
        race: "天使",
        attack: 2500,
        defense: 1200,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.length === 2 &&
                card.find((e) => monsterFilter(e.card) && e.card.monster_type === "シンクロモンスター") &&
                card.find((e) => monsterFilter(e.card) && e.card.monster_type === "エクシーズモンスター")
            );
        },
        text: "Ｓモンスター＋Ｘモンスター\n自分フィールドの上記カードを墓地へ送った場合のみ特殊召喚できる（「融合」は必要としない）。自分は「旧神ヌトス」を１ターンに１度しか特殊召喚できない。(1)：１ターンに１度、自分メインフェイズに発動できる。手札からレベル４モンスター１体を特殊召喚する。(2)：このカードが墓地へ送られた場合、フィールドのカード１枚を対象として発動できる。そのカードを破壊する。",
        image: "card100065315_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: true,
        hasLink: false,
        hasRank: false,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "天霆號アーゼウス",
        monster_type: "エクシーズモンスター",
        rank: 12,
        element: "光",
        race: "機械",
        attack: 3000,
        defense: 3000,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length == 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 12));
        },
        text: "レベル12モンスター×2\nXモンスターが戦闘を行ったターンに1度、自分フィールドのXモンスターの上に重ねてX召喚可能\n「天霆號アーゼウス」は、Xモンスターが戦闘を行ったターンに１度、自分フィールドのXモンスターの上に重ねてX召喚する事もできる。①：このカードのX素材を２つ取り除いて発動できる。このカード以外のフィールドのカードを全て墓地へ送る。この効果は相手ターンでも発動できる。②：１ターンに１度、このカード以外の自分フィールドのカードが戦闘または相手の効果で破壊された場合に発動できる。手札・デッキ・EXデッキからカード１枚を選び、このカードの下に重ねてX素材とする。",
        image: "card100336782_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "FNo.0 未来皇ホープ",
        monster_type: "エクシーズモンスター",
        rank: 0,
        element: "光",
        race: "戦士",
        attack: 0,
        defense: 0,
        materialCondition: (card: CardInstance[]) => {
            return (
                !!(
                    card.length == 2 &&
                    card.every((e) => hasRankMonsterFilter(e.card) && !e.card.card_name.includes("No.")) &&
                    hasRankMonsterFilter(card[0].card) &&
                    hasRankMonsterFilter(card[1].card)
                ) && card[0].card.rank === card[1].card.rank
            );
        },
        text: "「No.」モンスター以外の同じランクのXモンスター×2\nルール上、このカードのランクは１として扱う。①：このカードは戦闘では破壊されず、このカードの戦闘で発生するお互いの戦闘ダメージは０になる。②：このカードが相手モンスターと戦闘を行ったダメージステップ終了時に発動できる。その相手モンスターのコントロールをバトルフェイズ終了時まで得る。②：フィールドのこのカードが効果で破壊される場合、代わりにこのカードのＸ素材を１つ取り除く事ができる。",
        image: "card100178133_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
    createExtraMonster({
        card_name: "FNo.0 未来龍皇ホープ",
        monster_type: "エクシーズモンスター",
        rank: 0,
        element: "光",
        race: "戦士",
        attack: 0,
        defense: 0,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.length == 3 &&
                card.every((e) => hasRankMonsterFilter(e.card) && !e.card.card_name.includes("No.")) &&
                hasRankMonsterFilter(card[0].card) &&
                hasRankMonsterFilter(card[1].card) &&
                hasRankMonsterFilter(card[2].card) &&
                card[0].card.rank === card[1].card.rank &&
                card[1].card.rank === card[2].card.rank
            );
        },
        text: "「No.」モンスター以外の同じランクのXモンスター×３\nルール上、このカードのランクは１として扱い、このカード名は「未来皇ホープ」カードとしても扱う。このカードは自分フィールドの「FNo.0 未来皇ホープ」の上に重ねてX召喚する事もできる。①：このカードは戦闘・効果では破壊されない。②：１ターンに１度、相手がモンスターの効果を発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にする。この効果でフィールドのモンスターの効果の発動を無効にした場合、さらにそのコントロールを得る。",
        image: "card100323225_1.jpg",
        effect: {},
        card_type: "モンスター",
        hasDefense: true,
        hasLevel: false,
        hasLink: false,
        hasRank: true,
        canNormalSummon: false,
    }),
] satisfies ExtraMonster[];
