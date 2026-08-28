// backend/src/soroban/soroban.service.ts
import { Keypair } from '@stellar/stellar-sdk';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssuerWallet } from './entities/issuer-wallet.entity';
import * as crypto from 'crypto';

@Injectable()
export class SorobanService {
  private platformAdminKeypair: Keypair;

  constructor(
    private configService: ConfigService,
    @InjectRepository(IssuerWallet)
    private issuerWalletRepository: Repository<IssuerWallet>,
  ) {
    const adminSecret = this.configService.get<string>('STELLAR_ADMIN_SECRET')!;
    this.platformAdminKeypair = Keypair.fromSecret(adminSecret);
  }

  async getIssuerKeypair(issuerAddress: string): Promise<Keypair> {
    const wallet = await this.issuerWalletRepository.findOne({
      where: { issuerAddress },
    });

    if (!wallet) {
      throw new UnauthorizedException(`No registered signing wallet found for issuer: ${issuerAddress}`);
    }

    const decryptedSecret = this.decryptSecret(wallet.encryptedSecret);
    return Keypair.fromSecret(decryptedSecret);
  }

  private decryptSecret(encryptedData: string): string {
    const encryptionKey = Buffer.from(this.configService.get<string>('WALLET_ENCRYPTION_KEY')!, 'hex');
    const [ivHex, ciphertextHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}