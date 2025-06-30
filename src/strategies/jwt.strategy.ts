import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Player } from "src/player/player.entity";
import { Repository } from "typeorm";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.ACCESS_TOKEN_SECRET!
        });
    }


    async validate(payload: { id: string, pseudo: string }) {
        const player = await this.playerRepository.findOne({ where: { id: payload.id } });

        if (!player) {
            throw new UnauthorizedException();
        }

        return payload;
    }

}