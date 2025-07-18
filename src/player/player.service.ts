import { InjectRepository } from "@nestjs/typeorm";
import { Player } from "./player.entity";
import { Repository } from "typeorm";
import { AuthDto } from "./dto/auth.dto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";


export class PlayerService{
    constructor(
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        private readonly jwtService: JwtService
    ){}

    async signup(authDto: AuthDto){
        const alreadyExisted = await this.playerRepository.findOne({where: {
            pseudo: authDto.pseudo
        }});

        if(alreadyExisted){
            throw new ConflictException('Pseudo already exists');
        }

        const player = this.playerRepository.create({
            pseudo: authDto.pseudo
        });
        
        await this.playerRepository.save(player);

        const payload = {
            id: player.id,
            pseudo: player.pseudo,
        };

        const access_token = this.jwtService.sign(payload, {
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: '14d'
        });

         const refresh_token = this.jwtService.sign(payload, {
             secret: process.env.REFRESH_TOKEN_SECRET,
             expiresIn: '30d'
         });

        return {
            message: 'Player created successfully',
            access_token,
            refresh_token
        }
    }

    async signin(authDto: AuthDto){
        const player = await this.playerRepository.findOne({where: {
            pseudo: authDto.pseudo
        }});

        if(!player){
            throw new NotFoundException('Pseudo not found');
        }

        const payload = {
            id: player.id,
            pseudo: player.pseudo,
        };

        const access_token = this.jwtService.sign(payload, {
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: '14d'
        });

         const refresh_token = this.jwtService.sign(payload, {
             secret: process.env.REFRESH_TOKEN_SECRET,
             expiresIn: '30d'
         });
        

        return { access_token, refresh_token };
    }

    async getMe(playerId){
        const player = await this.playerRepository.findOne({where: {id: playerId}});

        if(!player){
            throw new NotFoundException('Player not found')
        }

        return player
    }
}