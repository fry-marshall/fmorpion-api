import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AppModule } from "../src/app.module";
import { GlobalInterceptor } from "../src/common/interceptors/global-interceptor";
import { Player } from "../src/player/player.entity";
import { App } from "supertest/types";
import { IsNull, Not, Repository } from "typeorm";
import * as request from 'supertest';
import { Party } from "../src/party/party.entity";


describe('PlayerController (e2e)', () => {

    let app: INestApplication<App>;
    let playerRepository: Repository<Player>;
    let partyRepository: Repository<Party>;


    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
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
        await app.init();
    });

    beforeEach(async () => {
        await partyRepository.delete({ id: Not(IsNull()) });
        await playerRepository.delete({ id: Not(IsNull()) });

    });

    afterAll(async () => {
        await app.close();
    });

    describe("POST /player/signup", () => {
        describe('Success cases', () => {
            it('should create new player successfully', async () => {
                const validateSignUp = {
                    pseudo: "toto"
                };

                const response = await request(app.getHttpServer())
                    .post('/players/signup')
                    .send(validateSignUp);

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('message', 'Player created successfully');
            })
        });

        describe('Failure cases', () => {
            it('should fail with empty pseudo value', async () => {
                const validateSignUp = {
                    pseudo: ""
                };

                await request(app.getHttpServer())
                    .post('/players/signup')
                    .send(validateSignUp)
                    .expect(400);
            });

            it('should fail with short pseudo value', async () => {
                const validateSignUp = {
                    pseudo: "aaa"
                };

                await request(app.getHttpServer())
                    .post('/players/signup')
                    .send(validateSignUp)
                    .expect(400);
            });

            it('should fail with no body sended', async () => {

                await request(app.getHttpServer())
                    .post('/players/signup')
                    .expect(400);
            })
        })
    });

    describe("POST /player/signin", () => {
        describe('Success cases', () => {
            it('should sign in player successfully', async () => {
                const player = await playerRepository.create({
                    pseudo: "toto"
                });
                await playerRepository.save(player);

                const payload = {
                    pseudo: "toto"
                }

                const response = await request(app.getHttpServer())
                    .post('/players/signin')
                    .send(payload);

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('access_token');
                expect(response.body.data).toHaveProperty('refresh_token');
            })
        });

        describe('Failure cases', () => {
            it('should fail with player not found', async () => {
                const validateSignIn = {
                    pseudo: "tototoa"
                };

                await request(app.getHttpServer())
                    .post('/players/signin')
                    .send(validateSignIn)
                    .expect(404);
            });

            it('should fail with empty pseudo value', async () => {
                const validateSignIn = {
                    pseudo: ""
                };

                await request(app.getHttpServer())
                    .post('/players/signin')
                    .send(validateSignIn)
                    .expect(400);
            });

            it('should fail with short pseudo value', async () => {
                const validateSignIn = {
                    pseudo: "aaa"
                };

                await request(app.getHttpServer())
                    .post('/players/signin')
                    .send(validateSignIn)
                    .expect(400);
            });

            it('should fail with no body sended', async () => {

                await request(app.getHttpServer())
                    .post('/players/signin')
                    .expect(400);
            })
        })
    });
});