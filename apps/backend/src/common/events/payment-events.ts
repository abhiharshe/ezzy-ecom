export class PaymentCapturedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly provider: string,
    public readonly amountInPaise: bigint,
    public readonly transactionReference: string
  ) {}
}

export class PaymentFailedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly provider: string,
    public readonly failureReason: string
  ) {}
}
