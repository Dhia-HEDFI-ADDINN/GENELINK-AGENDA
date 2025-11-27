import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Priority: header > user.tenant_id > params > body
    return (
      request.headers['x-tenant-id'] ||
      request.user?.tenant_id ||
      request.params?.tenant_id ||
      request.body?.tenant_id
    );
  },
);
