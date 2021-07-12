/*
https://docs.nestjs.com/openapi/decorators#decorators
*/

import { SetMetadata } from '@nestjs/common';
import { AGENDA_HANDLER } from './agenda.constants';
import { AgendaDefineOptions } from './interfaces';

export const AgendaHandle = (config: AgendaDefineOptions) => (target, key, descriptor: TypedPropertyDescriptor<any>) =>
  SetMetadata(AGENDA_HANDLER, config)(target, key, descriptor);
