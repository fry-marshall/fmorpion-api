import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Party, PartyState } from "./party.entity";
import { Repository } from "typeorm";
import { Player } from "../player/player.entity";
import { SchedulerRegistry } from "@nestjs/schedule";

function generateCode(length: number = 5): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}


@Injectable()
export class PartyService {

  constructor(
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private schedulerRegistry: SchedulerRegistry
  ) { }

  async create(playerId: string) {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['partiesAsPlayer1', 'partiesAsPlayer2', 'partiesAsWinner']
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const hasPartyInProgress = player.partiesAsPlayer1?.some(party => party.partyState === PartyState.IN_PROGRESS || party.partyState === PartyState.PENDING_PLAYER) ||
      player.partiesAsPlayer2?.some(party => party.partyState === PartyState.IN_PROGRESS || PartyState.PENDING_PLAYER);

    if (hasPartyInProgress) {
      throw new ForbiddenException('You cannot create a party when you have another in progress');
    }

    const party = this.partyRepository.create({
      code: generateCode(5),
      player1: player
    });

    await this.partyRepository.save(party);

    const timeout = setTimeout(() => {
      this.checkGameTimeout(party.id);
    }, 15 * 60 * 1000); // 15 minutes

    this.schedulerRegistry.addTimeout(`check-game-${party.id}`, timeout);

    return {
      message: 'Party created successfully',
      code: party.code,
      id: party.id
    };
  }

  async getParties(playerId: string) {
    const parties = await this.partyRepository.find();
    console.log(parties)
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: [
        'partiesAsPlayer1',
        'partiesAsPlayer1.player1',
        'partiesAsPlayer1.player2',
        'partiesAsPlayer1.winner',
        'partiesAsPlayer2',
        'partiesAsPlayer2.player1',
        'partiesAsPlayer2.player2',
        'partiesAsPlayer2.winner',
      ],
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return [
      ...player.partiesAsPlayer1!,
      ...player.partiesAsPlayer2!
    ].map(party => {
      return {
        id: party.id,
        player1: party.player1?.pseudo,
        player2: party.player2?.pseudo,
        winner: party.winner?.pseudo,
        partyState: party.partyState
      }
    });
  }

  async joinParty(playerId: string, code: string) {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['partiesAsPlayer1', 'partiesAsPlayer2']
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const party = await this.partyRepository.findOne({
      where: { code },
      relations: ["player1", "player2"]
    })

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    if (party.partyState !== PartyState.PENDING_PLAYER) {
      throw new ForbiddenException('This party cannot be join')
    }

    if (!!party.player1 && !!party.player2) {
      throw new ForbiddenException('This party is full')
    }

    if (party.player1.id === player.id) {
      throw new ForbiddenException('You cannot join your own party');
    }

    party.player2 = player;

    await this.partyRepository.save(party);

    return {
      id: party.id,
      player1: party.player1.pseudo,
      player2: player.pseudo,
      message: 'Party joined successfully'
    };

  }

  async checkGameTimeout(partyId: string) {
    if (partyId) {
      await this.partyRepository.update(partyId, {
        partyState: PartyState.CANCELED
      })
    }

    try {
      this.schedulerRegistry.deleteTimeout(`check-game-${partyId}`);
    } catch (e) { }
  }
}