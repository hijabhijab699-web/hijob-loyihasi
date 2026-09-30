import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { OnboardingService } from './onboarding.service';
import { BodyParamsDto } from './dto';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('body')
  getBody(@CurrentUser() user: CurrentUserInfo) {
    return this.onboarding.getBodyParams(user.id);
  }

  @Put('body')
  saveBody(@CurrentUser() user: CurrentUserInfo, @Body() dto: BodyParamsDto) {
    return this.onboarding.saveBodyParams(user.id, dto);
  }

  @Get('face/status')
  faceStatus(@CurrentUser() user: CurrentUserInfo) {
    return this.onboarding.getFaceStatus(user.id);
  }

  @Post('face/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'front', maxCount: 1 },
        { name: 'left', maxCount: 1 },
        { name: 'right', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_IMAGE_BYTES } },
    ),
  )
  async uploadFace(
    @CurrentUser() user: CurrentUserInfo,
    @UploadedFiles()
    files: {
      front?: Express.Multer.File[];
      left?: Express.Multer.File[];
      right?: Express.Multer.File[];
    },
  ) {
    const front = files.front?.[0];
    if (!front) throw new BadRequestException('FRONT_IMAGE_REQUIRED');

    return this.onboarding.uploadFace(user.id, {
      front,
      left: files.left?.[0],
      right: files.right?.[0],
    });
  }

  @Delete('face')
  deleteFace(@CurrentUser() user: CurrentUserInfo) {
    return this.onboarding.deleteFaceTemplate(user.id);
  }
}
