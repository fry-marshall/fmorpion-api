import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { GlobalInterceptor } from "../src/common/interceptors/global-interceptor";
import { Player } from "../src/player/player.entity";
import { App } from "supertest/types";
import { IsNull, Not, Repository } from "typeorm";
import * as request from 'supertest';
import { Party, PartyState } from "../src/party/party.entity";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";


describe('PartyController (e2e)', () => {

    let app: INestApplication<App>;
    let playerRepository: Repository<Player>;
    let partyRepository: Repository<Party>;
    let jwtService: JwtService;

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
    });

    beforeEach(async () => {
        await partyRepository.delete({ id: Not(IsNull()) });
        await playerRepository.delete({ id: Not(IsNull()) });
    });

    let accessToken: string;
    let accessToken2: string;
    const testPlayer: Player = {
        id: randomUUID(),
        pseudo: "toto",
    };

    const testPlayer2: Player = {
        id: randomUUID(),
        pseudo: "tata",
    };

    beforeEach(async () => {
        await playerRepository.save(testPlayer);
        await playerRepository.save(testPlayer2);

        // Sign in to get access token
        const signinResponse = await request(app.getHttpServer())
            .post('/players/signin')
            .send({
                pseudo: 'toto',
            });

        accessToken = signinResponse.body.data.access_token;

        const signinResponse2 = await request(app.getHttpServer())
            .post('/players/signin')
            .send({
                pseudo: 'tata',
            });

        accessToken2 = signinResponse2.body.data.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    /* describe("POST /parties", () => {
        describe('Success cases', () => {
            it('should create a party successfully', async () => {

                const response = await request(app.getHttpServer())
                    .post('/parties')
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('message', 'Party created successfully');
                expect(response.body.data).toHaveProperty('code');
            })
        });

        describe('Failure cases', () => {
            it('should fail with player that have parties in progress', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "5HA01",
                    partyState: PartyState.IN_PROGRESS
                });

                await partyRepository.save(party);

                await request(app.getHttpServer())
                    .post('/parties')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(403);
            });

            it('should fail with player not found', async () => {
                await request(app.getHttpServer())
                    .post('/parties')
                    .set('Authorization', `Bearer toto`)
                    .expect(401);
            });
        })
    });

    describe("GET /parties/me", () => {
        describe('Success cases', () => {
            it('should return player parties', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "5Ah01",
                    partyState: PartyState.FINISHED
                });

                const party2 = partyRepository.create({
                    player2: player!,
                    code: "5AhB1",
                    partyState: PartyState.FINISHED
                });

                await partyRepository.save(party);
                await partyRepository.save(party2);

                const response = await request(app.getHttpServer())
                    .get('/parties/me')
                    .set('Authorization', `Bearer ${accessToken}`)

                console.log(response.body)

                expect(response.status).toBe(200);
                expect(response.body.data.length).toBe(2);
            })
        });

        describe('Failure cases', () => {
            it('should fail with player not found', async () => {

                await request(app.getHttpServer())
                    .get('/parties/me')
                    .set('Authorization', `Bearer toto`)
                    .expect(401);
            });
        })
    }); */

    describe("PUT /parties/join?code=", () => {
        describe('Success cases', () => {
            it('should join a party successfully', async () => {

                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "5ABAT",
                    partyState: PartyState.PENDING_PLAYER
                });

                await partyRepository.save(party);

                const response = await request(app.getHttpServer())
                    .put('/parties/join?code='+party.code)
                    .set('Authorization', `Bearer ${accessToken2}`);


                expect(response.status).toBe(200);
                expect(response.body.data).toHaveProperty('message', 'Party joined successfully');
            })
        });

        describe('Failure cases', () => {

            it('should return 401 for player not found', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "51HA",
                    partyState: PartyState.IN_PROGRESS
                });

                await partyRepository.save(party);

                await request(app.getHttpServer())
                    .put('/parties/join?code='+party.code)
                    .set('Authorization', `Bearer toto}`)
                    .expect(401);
            });

            it('should return 404 for party not found', async () => {

                await request(app.getHttpServer())
                    .put('/parties/join?code=toto')
                    .set('Authorization', `Bearer ${accessToken2}`)
                    .expect(404);
            });

            it('should return 403 for a party not waiting player', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "51HA",
                    partyState: PartyState.IN_PROGRESS
                });

                await partyRepository.save(party);

                await request(app.getHttpServer())
                    .put('/parties/join?code='+party.code)
                    .set('Authorization', `Bearer ${accessToken2}`)
                    .expect(403);
            });

            it('should return 403 for a player who want to join his own party', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });

                const party = partyRepository.create({
                    player1: player!,
                    code: "51HA",
                    partyState: PartyState.PENDING_PLAYER
                });

                await partyRepository.save(party);

                await request(app.getHttpServer())
                    .put('/parties/join?code='+party.code)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(403);
            });

            it('should return 403 for a party already full', async () => {
                const player = await playerRepository.findOne({ where: { pseudo: "toto" } });
                const player2 = await playerRepository.findOne({ where: { pseudo: "tata" } });

                const party = partyRepository.create({
                    player1: player!,
                    player2: player2!,
                    code: "51HA",
                    partyState: PartyState.PENDING_PLAYER
                });

                await partyRepository.save(party);

                await request(app.getHttpServer())
                    .put('/parties/join?code='+party.code)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(403);
            });

        })
    });
});