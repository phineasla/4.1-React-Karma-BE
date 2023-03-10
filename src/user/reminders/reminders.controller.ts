import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, OmitType } from '@nestjs/swagger';
import { TrangThaiNhacNo, VaiTro } from '@prisma/client';

import { Role } from '../../common/decorators';
import { RoleGuard } from '../../common/guards';
import { JwtUser } from '../../jwt/jwt.decorator';
import { JwtUserDto } from '../../jwt/jwt.dto';
import { Pagination, PaginationDto } from '../../pagination';
import {
  ApiOkPaginatedResponse,
  ApiOkWrappedResponse,
} from '../../swagger/swagger.decorator';

import { CancelReminderDto } from './dto/cancel-reminder.dto';
import { ConfirmReminderDto } from './dto/confirm-reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { FindRemindersDto } from './dto/find-reminders.dto';
import { Reminder } from './entities/reminder.entity';
import { RemindersService } from './reminders.service';

@ApiTags('user/reminders')
@Controller('user/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Role(VaiTro.User)
  @UseGuards(RoleGuard)
  @Post()
  @ApiOperation({ summary: 'Create reminder' })
  @ApiOkWrappedResponse({ type: OmitType(Reminder, ['noiDungXoa'] as const) })
  async create(
    @JwtUser() user: JwtUserDto,
    @Body() createReminderDto: CreateReminderDto,
  ) {
    const { maTK } = user;
    const data = await this.remindersService.create(maTK, createReminderDto);
    return { data };
  }

  @Role(VaiTro.User)
  @UseGuards(RoleGuard)
  @Get()
  @ApiOperation({ summary: 'Get list of reminders' })
  @ApiOkPaginatedResponse({ type: Reminder })
  findAll(
    @JwtUser() user: JwtUserDto,
    @Pagination() pagination: PaginationDto,
    @Query() dto: FindRemindersDto,
  ) {
    const { maTK } = user;
    return this.remindersService.findAllWithPagination(maTK, pagination, dto);
  }

  /**
   * Local transfer + mark reminder as DONE
   */
  @Role(VaiTro.User)
  @UseGuards(RoleGuard)
  @Patch(':maNN')
  @ApiOperation({ summary: 'Checkout a reminder' })
  @ApiOkWrappedResponse({ type: OmitType(Reminder, ['noiDungXoa'] as const) })
  @ApiQuery({ name: 'maNN', description: 'Reminder ID' })
  async confirm(
    @JwtUser() user: JwtUserDto,
    @Param('maNN', ParseIntPipe) maNN: number,
    @Body() dto: ConfirmReminderDto,
  ) {
    const { maTK } = user;
    const data = await this.remindersService.confirm(maTK, maNN, dto);
    return { data };
  }

  @Role(VaiTro.User)
  @UseGuards(RoleGuard)
  @Delete(':maNN')
  @ApiOperation({ summary: 'Cancel reminder' })
  @ApiOkWrappedResponse({ type: Reminder })
  @ApiQuery({ name: 'maNN', description: 'Reminder ID' })
  async cancel(
    @JwtUser() user: JwtUserDto,
    @Param('maNN', ParseIntPipe) maNN: number,
    @Body() dto: CancelReminderDto,
  ) {
    const reminder = await this.remindersService.findOne(maNN);
    if (!reminder) {
      throw new NotFoundException({
        errorId: 'reminder_not_found',
        message: `Cannot find reminder with ID ${maNN}`,
      });
    }
    if (reminder.trangThai === TrangThaiNhacNo.done) {
      return { data: reminder };
    }
    console.log('dto', dto);
    const data = await this.remindersService.cancel(maNN, dto);
    return { data };
  }
}
