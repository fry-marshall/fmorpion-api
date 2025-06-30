import { Body, Controller, Post } from "@nestjs/common";
import { AuthDto } from "./dto/auth.dto";
import { PlayerService } from "./player.service";

@Controller('players')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Post('signup')
    signup(@Body() authDto: AuthDto) {
        return this.playerService.signup(authDto)
    }

    @Post('signin')
    signin(@Body() authDto: AuthDto) {
        return this.playerService.signin(authDto)
    }

}