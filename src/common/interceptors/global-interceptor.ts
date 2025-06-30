import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';

export interface Response<T> {
  is_error: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

@Injectable()
export class GlobalInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> | Promise<Observable<Response<T>>> {
    return next.handle().pipe(
      map((data) => ({
        is_error: false,
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
      })),
      catchError((error) => {
        let message = error.message;
        const isDataError = Array.isArray(error.response?.message);

        if (error instanceof BadRequestException && isDataError) {
          message = 'Invalid input data';
        }

        const errorResponse = {
          is_error: true,
          statusCode: error.status || 500,
          message,
        };

        throw new HttpException(errorResponse, errorResponse.statusCode);
      }),
    );
  }
}
