import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { MlFaceClient } from './ml-face.client';
import { UserFaceRendersModule } from '../user-face-renders/user-face-renders.module';

@Module({
  imports: [UserFaceRendersModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, MlFaceClient],
})
export class OnboardingModule {}
