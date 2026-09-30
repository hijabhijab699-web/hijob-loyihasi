import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: CurrentUserInfo) {
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      language: user.language,
      onboarding: {
        faceCaptured: user.onboardingFaceDone,
        bodyProvided: user.onboardingBodyDone,
      },
    };
  }
}
