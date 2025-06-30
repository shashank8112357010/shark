export enum TransactionType {
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  REFERRAL = 'referral'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface TransactionMetadata {
  shark?: string;
  price?: number;
  [key: string]: any;
}
