import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Pagination, PaginationDto } from '../pagination';
import {
  ApiOkWrappedResponse,
  ApiPaginatedResponse,
} from '../swagger/swagger.decorator';

import {
  BankResponseDto,
  InterbankResponseDto,
  InterbankTransferResponseDto,
} from './dto/interbank.response.dto';
import { InterbankTransactionQueryDto } from './dto/query.dto';
import { InterbankService } from './interbank.service';
import { transferDTO } from './dto/transfer.dto';
import { CryptographyService } from '../cryptography/cryptography.service';
import { InterbankRequestDTO } from './dto/interbank.request.dto';
import { Public } from '../common/decorators';
import { nganHangLienKet } from '@prisma/client';
import { verify } from 'crypto';
import { API_TIMEOUT } from '../constants';

@Controller('interbank')
export class InterbankController {
  constructor(
    private interbankService: InterbankService,
    private cryptographyService: CryptographyService,
  ) {}

  @Public()
  @Post('/api/account')
  @ApiOperation({
    summary: 'Fetch an interbank account info',
  })
  @ApiTags('API cho liên ngân hàng')
  @ApiOkWrappedResponse({
    type: InterbankResponseDto,
    description: 'Successfully fetched an interbank account info',
  })
  @ApiBody({ type: InterbankRequestDTO })
  async getAccount(@Body() body: InterbankRequestDTO) {
    const banksList = await this.interbankService.getBanksList();
    if (!banksList || banksList.length === 0) {
      throw new NotFoundException({
        errorId: HttpStatus.NOT_FOUND,
        message: 'No Linked Bank',
      });
    }
    const { chuKy, ...bodyData } = body;
    const verified = await this.cryptographyService.verify(
      JSON.stringify(bodyData),
      chuKy,
    );

    if (!verified) {
      throw new BadRequestException({
        errorId: HttpStatus.BAD_REQUEST,
        message: 'Invalid Signature',
      });
    }
    const dateDiff = new Date().getTime() - new Date(body.ngayTao).getTime();
    if (dateDiff > API_TIMEOUT) {
      throw new BadRequestException({
        errorId: HttpStatus.BAD_REQUEST,
        message: 'Timeout',
      });
    }
    const res = await this.interbankService.getPaymentAccountInfo(body.soTK);
    if (!res) {
      throw new BadRequestException({
        errorId: HttpStatus.NOT_FOUND,
        message: 'Account not found',
      });
    }
    const signature = await this.cryptographyService.sign(JSON.stringify(res));
    if (!signature) {
      throw new InternalServerErrorException({
        errorId: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
    res['chuKy'] = signature;
    return res;
  }

  @Get('all')
  @ApiTags('interbank')
  @ApiOperation({
    summary: 'Fetch a non-paginated list of interbank transfer',
  })
  @ApiOkWrappedResponse({
    description:
      'Successfully received a non-paginated list of interbank transfer',
    type: InterbankTransferResponseDto,
  })
  async findAllWithoutPagination() {
    try {
      const data = await this.interbankService.findAllWithoutPagination();
      return { data };
    } catch (e) {
      throw e;
    }
  }

  @Get()
  @ApiTags('interbank')
  @ApiOperation({
    summary: 'Fetch a paginated list of interbank transfer',
  })
  @ApiPaginatedResponse({ type: InterbankTransferResponseDto })
  async findAllWithPagination(
    @Pagination() pagination: PaginationDto,
    @Query() query: InterbankTransactionQueryDto,
  ) {
    try {
      return this.interbankService.findAllWithPagination(pagination, query);
    } catch (e) {
      throw e;
    }
  }

  @Get(':maCKN')
  @ApiTags('interbank')
  @ApiOperation({
    summary: 'Get detail of an interbank transfer',
  })
  @ApiParam({
    name: 'maCKN',
    description: 'Mã chuyển khoản ngoài',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Successfully fetched a record of interbank transfer',
    type: InterbankTransferResponseDto,
  })
  findOne(@Param('maCKN', ParseIntPipe) id: number) {
    try {
      return this.interbankService.findOne(id);
    } catch (e) {
      throw e;
    }
  }

  @Post('transfer')
  async externalBankTransfer(@Body() body: transferDTO) {
    return await this.interbankService.externalBankTransfer(body);
  }
}
