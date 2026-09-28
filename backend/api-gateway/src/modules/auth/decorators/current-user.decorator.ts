import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRequest } from '../get-request';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => getRequest(context).user,
);
