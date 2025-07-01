import { Player } from "../player/player.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum PartyState{
    PENDING_PLAYER='pending_player',
    IN_PROGRESS='in_progress',
    FINISHED='finished',
    CANCELED='canceled',
}

@Entity()
export class Party{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @ManyToOne(() => Player, player => player.partiesAsPlayer1)
    player1: Player;

    @ManyToOne(() => Player, player => player.partiesAsPlayer2)
    player2: Player;

    @ManyToOne(() => Player, player => player.partiesAsWinner)
    winner: Player;

    @Column({ enum: PartyState, default: PartyState.PENDING_PLAYER })
    partyState: PartyState
}