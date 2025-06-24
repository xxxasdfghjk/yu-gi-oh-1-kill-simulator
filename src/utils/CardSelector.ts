import { CardInstanceFilter } from "./CardInstanceFilter";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export class CardSelector {
    private state: GameStore;
    private list: (CardInstance | null)[] = [];
    constructor(state: GameStore) {
        this.state = state;
    }

    allMonster() {
        this.list = [...this.list, ...this.state.field.monsterZones, ...this.state.field.extraMonsterZones];
        return this;
    }

    materials() {
        const materials = [
            ...this.state.field.monsterZones.map((e) => e?.materials ?? []),
            ...this.state.field.extraMonsterZones.map((e) => e?.materials ?? []),
        ]
            .flat()
            .filter((e): e is CardInstance => e !== null);
        this.list = [...this.list, ...materials];
        return this;
    }

    monster() {
        this.list = [...this.list, ...this.state.field.monsterZones];
        return this;
    }

    exMonster() {
        this.list = [...this.list, ...this.state.field.extraMonsterZones];
        return this;
    }

    spellTrap() {
        this.list = [...this.list, ...this.state.field.spellTrapZones];
        return this;
    }

    deck() {
        this.list = [...this.list, ...this.state.deck];
        return this;
    }

    extraDeck() {
        this.list = [...this.list, ...this.state.extraDeck];
        return this;
    }

    hand() {
        this.list = [...this.list, ...this.state.hand];
        return this;
    }
    graveyard() {
        this.list = [...this.list, ...this.state.graveyard];
        return this;
    }

    banished() {
        this.list = [...this.list, ...this.state.banished];
        return this;
    }

    field() {
        this.list = [...this.list, this.state.field.fieldZone];
        return this;
    }

    opponentField() {
        this.list = [...this.list, this.state.opponentField.fieldZone];
        return this;
    }
    allFieldSpellTrap() {
        this.list = [
            ...this.list,
            this.state.opponentField.fieldZone,
            this.state.field.fieldZone,
            ...this.state.field.spellTrapZones,
        ];
        return this;
    }

    filter() {
        return new CardInstanceFilter(this.list);
    }

    len() {
        return this.list.length;
    }

    get() {
        return this.list;
    }

    getNonNull() {
        return this.list.filter((e): e is CardInstance => e !== null);
    }

    clone() {
        return JSON.parse(JSON.stringify(this.list)) as CardInstance[];
    }
}
