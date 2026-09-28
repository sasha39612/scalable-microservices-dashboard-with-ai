import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

/**
 * Get the request object from either a GraphQL or a plain HTTP (REST) context
 */
export function getRequest(context: ExecutionContext): Request {
  if (context.getType<string>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest<Request>();
}
