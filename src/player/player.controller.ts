import { Body, Controller, Post } from "@nestjs/common";
import { AuthDto } from "./dto/auth.dto";
import { PlayerService } from "./player.service";
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('players')
@Controller('players')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @ApiOperation({ description: "Sign up the player" })
    @ApiBody({ type: AuthDto })
    @ApiCreatedResponse({
        description: "Player signed up successfully",
        schema: {
            example: {
                is_error: false,
                data: {
                    message: "Player created successfully"
                },
                statusCode: 201,
            }
        }
    })
    @ApiBadRequestResponse({
        description: "Invalid input data",
        schema: {
            example: {
                is_error: true,
                message: "Invalid input data",
                statusCode: 400,
            }
        }
    })
    @ApiConflictResponse({
        description: "Pseudo already exists",
        schema: {
            example: {
                is_error: false,
                message: "Pseudo already exists",
                statusCode: 409,
            }
        }
    })
    @Post('signup')
    signup(@Body() authDto: AuthDto) {
        return this.playerService.signup(authDto)
    }

    @ApiOperation({ description: "Sign in the player" })
    @ApiBody({ type: AuthDto })
    @ApiCreatedResponse({
        description: "Player signed in successfully",
        schema: {
            example: {
                is_error: false,
                data: {
                    access_token: "xxxxxxxx",
                    refresh_token: "xxxxxxxx"
                },
                statusCode: 201,
            }
        }
    })
    @ApiBadRequestResponse({
        description: "Invalid input data",
        schema: {
            example: {
                is_error: true,
                message: "Invalid input data",
                statusCode: 400,
            }
        }
    })
    @ApiConflictResponse({
        description: "Pseudo not found",
        schema: {
            example: {
                is_error: false,
                message: "Pseudo not found",
                statusCode: 404,
            }
        }
    })
    @Post('signin')
    signin(@Body() authDto: AuthDto) {
        return this.playerService.signin(authDto)
    }

}