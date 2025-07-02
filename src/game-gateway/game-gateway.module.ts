import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Party } from "../party/party.entity";
import { Player } from "../player/player.entity";
import { GameGateway } from "./game.gateway";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([Party, Player])
  ],
  providers: [GameGateway, JwtService]
})
export class GameGatewayModule{}
