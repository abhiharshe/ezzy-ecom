export class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmountInPaise: bigint,
    public readonly affiliateCode?: string
  ) {}
}

export class SubOrderDeliveredEvent {
  constructor(
    public readonly subOrderId: string,
    public readonly orderId: string,
    public readonly vendorId: string,
    public readonly deliveredAt: Date,
    public readonly escrowReleaseDate: Date
  ) {}
}

export class EscrowMaturedEvent {
  constructor(
    public readonly orderId: string,
    public readonly subOrderId: string
  ) {}
}
