import { Party } from "src/party/party.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Player{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    pseudo: string;

    @OneToMany(() => Party, party => party.player1)
    partiesAsPlayer1: Party[];

    @OneToMany(() => Party, party => party.player2)
    partiesAsPlayer2: Party[];

    @OneToMany(() => Party, party => party.winner)
    partiesAsWinner: Party[];
}