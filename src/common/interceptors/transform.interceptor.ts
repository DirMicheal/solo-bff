import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResult } from '../dto/api-result.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResult<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResult<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof ApiResult) {
          return data;
        }
        return ApiResult.success(data);
      }),
    );
  }
}
