import { Controller, UseGuards, applyDecorators } from '@nestjs/common';
import { ClientType } from '@/common/enums/index.enum';
import { SkipAuth, ClientTypes } from '@/common/decorators/index.decorator';

export function BffController(prefix: string, options?: { auth?: boolean; clientTypes?: ClientType[] }) {
  const decorators: ClassDecorator[] = [Controller(prefix)];

  if (options?.clientTypes) {
    decorators.push(ClientTypes(...options.clientTypes));
  }

  if (options?.auth === false) {
    decorators.push(SkipAuth());
  }

  return applyDecorators(...decorators);
}
