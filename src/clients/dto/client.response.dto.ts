import { ApiProperty } from '@nestjs/swagger';

class ClientInfo {
  @ApiProperty()
  maKH: number;

  @ApiProperty()
  hoTen: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  sdt: string;

  @ApiProperty()
  maTK: number;
}

class AccountInfo {
  @ApiProperty()
  soTK: string;

  @ApiProperty()
  soDu: number;

  @ApiProperty()
  maTK: number;

  @ApiProperty()
  hoatDong: boolean;
}

export class CreateClientResponseDto {
  @ApiProperty()
  maTK: number;

  @ApiProperty()
  tenDangNhap: string;

  @ApiProperty()
  matKhau: string;

  @ApiProperty()
  vaiTro: 'User' | 'Banker' | 'Admin';

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  hoatDong: boolean;

  @ApiProperty()
  khachHang: ClientInfo;

  @ApiProperty()
  taiKhoanThanhToan: AccountInfo;

  @ApiProperty()
  id: number;
}

export class ClientResponseDto {
  @ApiProperty()
  maTK: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  tenDangNhap: string;

  @ApiProperty()
  matKhau: string;

  @ApiProperty()
  vaiTro: 'User' | 'Banker' | 'Admin';

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  hoatDong: boolean;

  @ApiProperty()
  khachHang: ClientInfo;
}

export class UpdateClientResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  data: ClientInfo;
}
