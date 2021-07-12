# nestjs-agenda

[Agenda](https://github.com/agenda/agenda) module for [Nestjs](https://github.com/nestjs/nest)

Agenda version is `^4.1.3`

# Installation

```
npm install nestjs-agenda
```

# Usage

Thank for

**1. Import `AgendaModule`:**

_Sync register_:

```TypeScript
import { AgendaModule } from 'nestjs-agenda';

@Module({
  imports: [AgendaModule.forRoot({ db: { address: 'mongodb://xxxxx' }})], // Same as configuring an agenda
  providers: [...],
})
export class FooModule {}
```

_Async register_:

```TypeScript
import { AgendaModule } from 'nestjs-agenda';

@Module({
  imports: [
    AgendaModule.forRootAsync(AgendaModule, {
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        db: { address: config.get('MONGODB_URI') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [...],
})
export class FooModule {}
```

**2. Inject `AgendaService` (AgendaService is a instance of Agenda):**

```TypeScript
import { Injectable } from '@nestjs/common';
import { AgendaService } from 'nestjs-agenda';

@Injectable()
export class FooService {
  constructor(private readonly agenda: AgendaService) {
    // schedule a job
    this.agenda.schedule('10 seconds from now', 'TEST_JOB', {});
  }

  @AgendaHandler({
    name: 'TEST_JOB',
    lockLifetime: 10000
  })
  private async testJob(job: any, done: any): Promise<void> {
    console.log('a job');
    await job.remove();
    done();
  }
}
```
