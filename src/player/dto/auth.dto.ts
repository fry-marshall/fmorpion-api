import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MinLength } from "class-validator";


export class AuthDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    @Transform(({ value }) => (typeof value === 'string' ? value?.trim() : ''))
    pseudo: string;
}