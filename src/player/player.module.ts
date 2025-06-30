import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Player } from "./player.entity";
import { Party } from "../party/party.entity";
import { PlayerController } from "./player.controller";
import { PlayerService } from "./player.service";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "../common/strategies/jwt.strategy";

@Module({
    controllers: [PlayerController],
    imports: [
        TypeOrmModule.forFeature([Party, Player])
    ],
    providers: [PlayerService, JwtService, JwtStrategy]
})
export class PlayerModule{}