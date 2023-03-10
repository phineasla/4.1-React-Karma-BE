import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AllExceptionFilter } from './all-exception.filter';
import { AuthModule } from './auth/auth.module';
import { BankersModule } from './bankers/bankers.module';
import { BanksModule } from './banks/banks.module';
import { ClientsModule } from './clients/clients.module';
import { AtGuard } from './common/guards';
import { CryptographyModule } from './cryptography/cryptography.module';
import { ExternalModule } from './external/external.module';
import { InterbankModule } from './interbank/interbank.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentAccountsModule } from './paymentAccounts/paymentAccounts.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    BanksModule,
    BankersModule,
    InterbankModule,
    ClientsModule,
    TransactionsModule,
    PaymentAccountsModule,
    ExternalModule,
    UserModule,
    AuthModule,
    CryptographyModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    // { provide: APP_FILTER, useClass: AllExceptionFilter },
    Logger,
  ],
})
export class AppModule {}
