import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CatalogModule } from './catalog/catalog.module';
import { TryOnModule } from './tryon/tryon.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
import { SellerModule } from './seller/seller.module';
import { StorageModule } from './storage/storage.module';
import { PaymentModule } from './payment/payment.module';
import { SmsModule } from './sms/sms.module';
import { PushModule } from './push/push.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'strict', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    StorageModule,
    SmsModule,
    PushModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OnboardingModule,
    CatalogModule,
    TryOnModule,
    CartModule,
    OrdersModule,
    SellerModule,
    PaymentModule,
    AdminModule,
  ],
})
export class AppModule {}
