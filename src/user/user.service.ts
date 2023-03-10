import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { FEE } from '../constants';
import { PaymentAccountsService } from '../paymentAccounts/paymentAccounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionOtpService } from '../transactions/transactionOtp.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FeeType } from '../types';

import { LocalTransferDto } from './dto/transfer.dto';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private paymentAccountService: PaymentAccountsService,
    private otpService: TransactionOtpService,
    private transactionService: TransactionsService,
  ) {}

  /**
   * Also include info from payment account
   */
  async getInfo(maTK: number) {
    const [info, paymentInfo] = await Promise.all([
      this.prismaService.khachHang.findUnique({
        where: { maTK: maTK },
      }),
      this.prismaService.taiKhoanThanhToan.findFirst({
        where: { maTK: maTK },
      }),
    ]).catch((e) => {
      console.error(e);
      throw new InternalServerErrorException({
        errorId: 'database_error',
        message: `Cannot get info for ${maTK}`,
      });
    });
    return { ...info, taiKhoanThanhToan: paymentInfo };
  }

  async transfer(transferDto: LocalTransferDto) {
    const otp = await this.otpService.findOne(transferDto.soTK);
    if (
      !this.otpService.verify(
        {
          otp: transferDto.otp,
          nguoiNhan: transferDto.nguoiNhan,
          soTK: transferDto.soTK,
          soTien: transferDto.soTien,
        },
        otp,
      )
    ) {
      throw new UnauthorizedException({
        errorId: 'invalid_otp',
        message: 'Invalid OTP',
      });
    }
    const [senderPaymentAccount] = await Promise.all(
      [transferDto.soTK, transferDto.nguoiNhan].map((id) =>
        this.paymentAccountService.findOne(id).then((v) => {
          if (v != null) return v;
          throw new NotFoundException({
            errorId: 'payment_account_not_found',
            message: `Cannot find payment account with ${id}`,
          });
        }),
      ),
    );
    if (senderPaymentAccount.soDu < transferDto.soTien) {
      throw new BadRequestException({
        errorId: 'insufficient_fund',
        message: "you're not rich enough to make this transaction",
      });
    }
    return this.prismaService.$transaction(async (tx) => {
      await this.otpService.delete(otp.soTK, tx);
      // Shouldn't throw P2018 because we already checked payment accounts are valid
      const transaction = await this.transactionService.create(
        {
          sender: transferDto.soTK,
          receiver: transferDto.nguoiNhan,
          amount: transferDto.soTien,
          message: transferDto.noiDung,
          fee: FEE,
          feeType: transferDto.loaiCK,
        },
        tx,
      );
      const senderFee = transferDto.loaiCK === FeeType.Sender ? FEE : 0;
      const receiverFee = transferDto.loaiCK === FeeType.Receiver ? FEE : 0;
      await Promise.all([
        this.paymentAccountService.decreaseBalance(
          {
            soTK: transferDto.soTK,
            amount: transferDto.soTien + senderFee,
          },
          tx,
        ),
        this.paymentAccountService.increaseBalance(
          {
            soTK: transferDto.nguoiNhan,
            amount: transferDto.soTien - receiverFee,
          },
          tx,
        ),
      ]);
      return transaction;
    });
  }

  async deactivateAccount(maTK: number) {
    const isActive = await this.prismaService.taiKhoan.findUnique({
      where: {
        maTK: maTK,
      },
    });
    if (!isActive) {
      throw new ForbiddenException({
        errorId: HttpStatus.FORBIDDEN,
        message: 'Account is inactive',
      });
    }
    await this.prismaService.taiKhoan.update({
      where: {
        maTK: maTK,
      },
      data: {
        hoatDong: false,
      },
    });
    const paymentAccount = await this.getInfo(maTK);
    if (!paymentAccount) {
      throw new NotFoundException({
        errorId: HttpStatus.NOT_FOUND,
        message: 'Payment account not found',
      });
    }
    const soTK = paymentAccount.taiKhoanThanhToan.soTK;
    await this.paymentAccountService.deactivatePaymentAccount(soTK);
  }
}
