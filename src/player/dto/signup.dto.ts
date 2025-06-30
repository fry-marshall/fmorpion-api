import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";


export class AuthDto {

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => (typeof value === 'string' ? value?.trim() : ''))
    pseudo: string;
}