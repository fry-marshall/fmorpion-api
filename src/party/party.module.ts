import { Module } from "@nestjs/common";
import { PartyController } from "./party.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Party } from "./party.entity";
import { Player } from "../player/player.entity";

@Module({
    controllers: [PartyController],
    imports: [
        TypeOrmModule.forFeature([Party, Player])
    ],
    providers: []
})
export class PartyModule{}