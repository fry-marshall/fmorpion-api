import { Controller, Get, HttpCode, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guard/jwt-auth.guard";
import { PartyService } from "./party.service";

@Controller('parties')
export class PartyController{

    constructor(private readonly partyService: PartyService){}
    
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req){
        return this.partyService.create(req.user.id)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/me')
    getParties(@Req() req){
        return this.partyService.getParties(req.user.id)
    }

    @UseGuards(JwtAuthGuard)
    @Put('/join')
    @HttpCode(200)
    joinParty(@Req() req, @Query('code') code){
        return this.partyService.joinParty(req.user.id, code);
    }
}