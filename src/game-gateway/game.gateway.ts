import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { WebSocketGateway, OnGatewayConnection, WebSocketServer, SubscribeMessage } from "@nestjs/websockets";
import { Server } from "http";
import { Socket } from "socket.io";
import { Party, PartyState } from "../party/party.entity";
import { Player } from "../player/player.entity";
import { Repository } from "typeorm";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
})
@Injectable()
export class GameGateway implements OnGatewayConnection {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      client.data.playerId = payload.id;
      console.log(`Client connected: playerId=${client.data.playerId}`);
    } catch (error) {
      console.log("Invalid token, disconnect client", error);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinParty')
  async handleJoinParty(client: Socket, data: { partyId: string }) {
    const party = await this.partyRepository.findOne({
      where: { id: data.partyId, partyState: PartyState.PENDING_PLAYER },
      relations: ['player1', 'player2'],
    });
    if (!party) return;

    const playerId = client.data.playerId;
    if (party.player1?.id !== playerId && party.player2?.id !== playerId) {
      return; // player not authorized
    }

    const player = await this.playerRepository.findOne({ where: { id: playerId } });

    const room = `party-${data.partyId}`;
    client.join(room);
    console.log("party really joined", room)
    client.to(room).emit('partyJoined', { playerId, player: player?.pseudo });
  }

  @SubscribeMessage('playParty')
  async handlePlayParty(client: Socket, data: { partyId: string; x: number; y: number }) {
    const party = await this.partyRepository.findOne({
      where: { id: data.partyId },
      relations: ['player1', 'player2'],
    });
    if (!party) return;

    const playerId = client.data.playerId;
    if (party.player1.id !== playerId && party.player2.id !== playerId) {
      return;
    }

    const room = `party-${data.partyId}`;
    console.log("room - playParty", room);
    const move = { x: data.x, y: data.y };
    client.to(room).emit('partyPlayed', { move, playerId });
  }

  @SubscribeMessage('finishParty')
  async handleFinishedParty(client: Socket, data: { partyId: string }) {
    const party = await this.partyRepository.findOne({
      where: { id: data.partyId },
      relations: ['player1', 'player2', 'winner'],
    });
    if (!party) return;

    const playerId = client.data.playerId;
    if (party.player1.id !== playerId && party.player2.id !== playerId) {
      return;
    }

    const player = await this.playerRepository.findOne({ where: { id: playerId } });
    if (!player) return;

    party.winner = player;
    party.partyState = PartyState.FINISHED;
    await this.partyRepository.save(party);

    const room = `party-${data.partyId}`;
    client.to(room).emit('partyFinished', { winner: playerId });
  }
}
