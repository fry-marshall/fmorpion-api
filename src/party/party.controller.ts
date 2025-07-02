import { Controller, Get, HttpCode, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guard/jwt-auth.guard";
import { PartyService } from "./party.service";
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('parties')
@Controller('parties')
export class PartyController {

    constructor(private readonly partyService: PartyService) { }

    @ApiOperation({ description: "Create a new party" })
    @ApiBearerAuth()
    @ApiCreatedResponse({
        description: "Party created successfully",
        schema: {
            example: {
                is_error: false,
                data: {
                    message: 'Party created successfully',
                    code: "xxxx"
                },
                statusCode: 201
            }
        }
    })
    @ApiNotFoundResponse({
        description: "Player not found",
        schema: {
            example: {
                is_error: true,
                message: 'Party not found',
                statusCode: 404
            }
        }
    })
    @ApiForbiddenResponse({
        description: "Player has a party already in progress",
        schema: {
            example: {
                is_error: true,
                message: 'You cannot create a party when you have another in progress',
                statusCode: 403
            }
        }
    })
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req) {
        return this.partyService.create(req.user.id)
    }

    @ApiOperation({ description: "Get player parties" })
    @ApiBearerAuth()
    @ApiCreatedResponse({
        description: "Player parties got successfully",
        schema: {
            example: {
                is_error: false,
                data: [
                    {
                        id: "xxx",
                        code: "xxx",
                        player1: {
                            id: "xxx"
                        },
                        player2: {
                            id: "xxx"
                        },
                        winner: {
                            id: "xxx"
                        },
                        partyStatus: "canceled"
                    }
                ],
                statusCode: 200
            }
        }
    })
    @ApiNotFoundResponse({
        description: "Player not found",
        schema: {
            example: {
                is_error: true,
                message: 'Party not found',
                statusCode: 404
            }
        }
    })
    @UseGuards(JwtAuthGuard)
    @Get('/me')
    getParties(@Req() req) {
        return this.partyService.getParties(req.user.id)
    }

    @ApiOperation({ description: "Create a new party" })
    @ApiBearerAuth()
    @ApiCreatedResponse({
        description: "Party joined successfully",
        schema: {
            example: {
                is_error: false,
                data: {
                    message: 'Party joined successfully',
                },
                statusCode: 200
            }
        }
    })
    @ApiNotFoundResponse({
        description: "Player not found",
        schema: {
            example: {
                is_error: true,
                message: 'Party not found',
                statusCode: 404
            }
        }
    })
    @ApiForbiddenResponse({
        description: "This party cannot be join or  This party is full or You cannot join your own party",
        schema: {
            example: {
                is_error: true,
                message: 'This party cannot be join or  This party is full or You cannot join your own party',
                statusCode: 403
            }
        }
    })
    @UseGuards(JwtAuthGuard)
    @Put('/join')
    @HttpCode(200)
    joinParty(@Req() req, @Query('code') code) {
        return this.partyService.joinParty(req.user.id, code);
    }
}