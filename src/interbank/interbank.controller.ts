import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Pagination, PaginationDto } from 'src/pagination';
import { InterbankService } from './interbank.service';

@Controller('interbank')
export class InterbankController {
  constructor(private readonly interbankService: InterbankService) {}

  @Get('all')
  async findAllWithoutPagination() {
    try {
      return this.interbankService.findAllWithoutPagination();
    } catch (e) {
      throw e;
    }
  }

  @Get()
  async findAllWithPagination(@Pagination() pagination: PaginationDto) {
    try {
      return this.interbankService.findAllWithPagination(pagination);
    } catch (e) {
      throw e;
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.interbankService.findOne(id);
    } catch (e) {
      throw e;
    }
  }
}
