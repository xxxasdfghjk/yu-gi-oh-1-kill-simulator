import type { CardInstance } from "@/types/card";
import { isFusionMonster, isMagicCard, monsterFilter } from "./cardManagement";
import { getLevel } from "./gameUtils";

export class CardInstanceFilter<T extends (CardInstance | null)[]> {
    private cardList: T;
    constructor(cardList: T) {
        this.cardList = cardList;
    }

    monster() {
        const monsterList = this.cardList.filter((e): e is CardInstance => e !== null && monsterFilter(e.card));
        return new CardInstanceFilter<CardInstance[]>(monsterList);
    }

    level(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) === level
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    upperLevel(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) >= level
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    underLevel(level: number) {
        const leveledMonterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && getLevel(e) <= level
        );
        return new CardInstanceFilter<CardInstance[]>(leveledMonterList);
    }

    fusionMonster() {
        const monsterList = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && isFusionMonster(e.card)
        );
        return new CardInstanceFilter<CardInstance[]>(monsterList);
    }

    spellOrTrap() {
        const spellOrTrapList = this.cardList.filter((e): e is CardInstance => e !== null && isMagicCard(e.card));
        return new CardInstanceFilter<CardInstance[]>(spellOrTrapList);
    }

    magic() {
        const magicList = this.cardList.filter((e): e is CardInstance => e !== null && isMagicCard(e.card));
        return new CardInstanceFilter<CardInstance[]>(magicList);
    }

    nonNull() {
        const nonNull = this.cardList.filter((e): e is CardInstance => e !== null);
        return new CardInstanceFilter<CardInstance[]>(nonNull);
    }

    canNormalSummon() {
        const nonNull = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.canNormalSummon
        );
        return new CardInstanceFilter<CardInstance[]>(nonNull);
    }
    null() {
        const nullList = this.cardList.filter((e): e is null => e === null);
        return new CardInstanceFilter<null[]>(nullList);
    }

    include(str: string) {
        const list = this.cardList.filter((e): e is CardInstance => e !== null && e.card.card_name.includes(str));
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    excludeId(id: string) {
        const list = this.cardList.filter((e): e is CardInstance => e !== null && e.id !== id);
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    hasAttackBelow(attack: number) {
        const list = this.cardList.filter(
            (e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.attack <= attack
        );
        return new CardInstanceFilter<CardInstance[]>(list);
    }

    len() {
        return this.cardList.length;
    }

    get() {
        return this.cardList;
    }

    clone() {
        return [...this.cardList];
    }
}
