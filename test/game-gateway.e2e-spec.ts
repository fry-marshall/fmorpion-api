import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TestingModule, Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { AppModule } from "../src/app.module";
import { GlobalInterceptor } from "../src/common/interceptors/global-interceptor";
import { Party, PartyState } from "../src/party/party.entity";
import { Player } from "../src/player/player.entity";
import { IsNull, Not, Repository } from "typeorm";
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';

describe('Game Gateway (e2e)', () => {

  let app: INestApplication;
  let jwtService: JwtService;
  let playerRepository: Repository<Player>;
  let partyRepository: Repository<Party>;
  let accessTokenPlayer1: string;
  let accessTokenPlayer2: string;
  const testPlayer: Player = {
    id: randomUUID(),
    pseudo: "toto",
  };
  const testPlayer2: Player = {
    id: randomUUID(),
    pseudo: "tata",
  };
  let testParty: Party = {
    id: randomUUID(),
    code: "tata5",
    player1: testPlayer,
    player2: testPlayer2,
    partyState: PartyState.PENDING_PLAYER
  };
  let clientPlayer1: Socket;
  let clientPlayer2: Socket;
  let url = `http://localhost:${process.env.PORT || 3000}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    app.useGlobalInterceptors(new GlobalInterceptor());
    playerRepository = moduleFixture.get<Repository<Player>>(getRepositoryToken(Player));
    partyRepository = moduleFixture.get<Repository<Party>>(getRepositoryToken(Party));
    jwtService = moduleFixture.get(JwtService);
    await app.init();
    await app.listen(process.env.PORT || 3000);
  });

  beforeEach(async () => {
    await partyRepository.delete({ id: Not(IsNull()) });
    await playerRepository.delete({ id: Not(IsNull()) });
  });

  afterEach(() => {
    if (clientPlayer1?.connected) clientPlayer1.disconnect();
    if (clientPlayer2?.connected) clientPlayer2.disconnect();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await playerRepository.save(testPlayer);
    await playerRepository.save(testPlayer2);

    await partyRepository.save(testParty);

    // Sign in to get access tokens
    const signinResponse1 = await request(app.getHttpServer())
      .post('/players/signin')
      .send({ pseudo: 'toto' });
    accessTokenPlayer1 = signinResponse1.body.data.access_token;

    const signinResponse2 = await request(app.getHttpServer())
      .post('/players/signin')
      .send({ pseudo: 'tata' });
    accessTokenPlayer2 = signinResponse2.body.data.access_token;
  });

  it('should emit playerJoined event when second player joins the party', (done) => {
    // Connexion client 1
    clientPlayer1 = io(url, {
      transports: ['websocket'],
      auth: { token: accessTokenPlayer1 },
      reconnectionDelayMax: 1000,
    });

    clientPlayer1.on('connect', () => {
      //Player 1 join the party
      clientPlayer1.emit('joinParty', { partyId: testParty.id });

      // Then we connect player2
      clientPlayer2 = io(url, {
        transports: ['websocket'],
        auth: { token: accessTokenPlayer2 },
        reconnectionDelayMax: 1000,
      });

      clientPlayer2.on('connect', () => {
        // Player 2 is joining the same party
        clientPlayer2.emit('joinParty', { partyId: testParty.id });
      });
    });

    // Player 1 is listening when player 2 has joined
    clientPlayer1.on('partyJoined', (payload) => {
      try {
        expect(payload).toHaveProperty('playerId', testPlayer2.id);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should emit partyPlayed event when player 2 play a party', (done) => {
    clientPlayer1 = io(url, {
      transports: ['websocket'],
      auth: { token: accessTokenPlayer1 },
      reconnectionDelayMax: 1000,
    });

    clientPlayer1.on('connect', () => {
      console.log("Player 1 - ", testPlayer.id)
      clientPlayer1.emit('joinParty', { partyId: testParty.id });

      // We wait that player 1 be informed that player1 has joined
      clientPlayer1.on('partyJoined', (payload) => {
        // One player2 joined, player2 can play
        console.log("tototototo")
        clientPlayer2.emit('playParty', { partyId: testParty.id, x: 2, y: 3 });
      });

      // Now we connect player2
      clientPlayer2 = io(url, {
        transports: ['websocket'],
        auth: { token: accessTokenPlayer2 },
        reconnectionDelayMax: 1000,
      });

      clientPlayer2.on('connect', () => {
        clientPlayer2.emit('joinParty', { partyId: testParty.id });
      });
    });

    clientPlayer1.on('partyPlayed', (payload) => {
      try {
        expect(payload.move).toHaveProperty('x', 2);
        expect(payload.move).toHaveProperty('y', 3);
        expect(payload).toHaveProperty('playerId', testPlayer2.id);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should emit partyFinished event when player 2 win the party', (done) => {
    // Connexion client 1
    clientPlayer1 = io(url, {
      transports: ['websocket'],
      auth: { token: accessTokenPlayer1 },
      reconnectionDelayMax: 1000,
    });

    clientPlayer1.on('connect', () => {
      //Player 1 join the party
      clientPlayer1.emit('joinParty', { partyId: testParty.id });

       // We wait that player 1 be informed that player1 has joined
      clientPlayer1.on('partyJoined', (payload) => {
        // One player2 joined, player2 can play
        clientPlayer2.emit('finishParty', { partyId: testParty.id, x: 2, y: 3 });
      });

      // Now we connect player2
      clientPlayer2 = io(url, {
        transports: ['websocket'],
        auth: { token: accessTokenPlayer2 },
        reconnectionDelayMax: 1000,
      });

      clientPlayer2.on('connect', () => {
        clientPlayer2.emit('joinParty', { partyId: testParty.id });
      });
    });

    // Player 1 is listening when player 2 has finished the party
    clientPlayer1.on('partyFinished', async (payload) => {
      try {
        const party = await partyRepository.findOne({ where: { id: testParty.id }, relations: ['winner'] });
        console.log(payload)
        expect(payload).toHaveProperty('winner', testPlayer2.id);
        expect(party?.winner?.id).toBe(testPlayer2.id);
        expect(party?.partyState).toBe(PartyState.FINISHED);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

});
