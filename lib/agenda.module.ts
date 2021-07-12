import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { AgendaDefineOptions, AgendaModuleOptions } from './interfaces';
import { AGENDA_HANDLER, AGENDA_MODULE_OPTIONS } from './agenda.constants';
import { Agenda } from 'agenda';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { groupBy } from 'lodash';

export class AgendaService extends Agenda {}

@Module({
  imports: [DiscoveryModule],
  providers: [
    {
      provide: AgendaService,
      useFactory: async (options) => {
        const agenda = new Agenda(options);
        await agenda.start();
        return agenda;
      },
      inject: [AGENDA_MODULE_OPTIONS],
    },
  ],
  exports: [AgendaService],
})
export class AgendaModule
  extends createConfigurableDynamicRootModule<AgendaModule, AgendaModuleOptions>(AGENDA_MODULE_OPTIONS, {
    providers: [
      {
        provide: AgendaService,
        useFactory: async (options) => {
          const agenda = new Agenda(options);
          await agenda.start();
          return agenda;
        },
        inject: [AGENDA_MODULE_OPTIONS],
      },
    ],
    exports: [AgendaService],
  })
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AgendaModule.name);

  constructor(
    private readonly discover: DiscoveryService,
    private readonly agenda: AgendaService,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {
    super();
  }

  async onModuleInit() {
    this.logger.log('Initializing RabbitMQ Handlers');

    const rabbitMeta = await this.discover.providerMethodsWithMetaAtKey<AgendaDefineOptions>(AGENDA_HANDLER);

    const grouped = groupBy(rabbitMeta, (x) => x.discoveredMethod.parentClass.name);

    const providerKeys = Object.keys(grouped);

    for (const key of providerKeys) {
      this.logger.log(`Registering rabbitmq handlers from ${key}`);
      await Promise.all(
        grouped[key].map(async ({ discoveredMethod, meta: config }) => {
          const handler = this.externalContextCreator.create(
            discoveredMethod.parentClass.instance,
            discoveredMethod.handler,
            discoveredMethod.methodName,
          );

          const argsLength = discoveredMethod.handler.length;
          // agenda count argument length to detect done callback function => need to wrap handler by function has exactly argument length
          this.agenda.define(
            config.name,
            config,
            argsLength === 2 ? (arg1, arg2) => handler(arg1, arg2) : (arg1) => handler(arg1),
          );
        }),
      );
    }
  }

  onModuleDestroy() {
    this.logger.log('disconnect agenda');
    this.agenda.close({ force: true });
  }
}
