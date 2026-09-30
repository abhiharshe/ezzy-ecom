export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly vendorId: string,
    public readonly name: string,
    public readonly slug: string
  ) {}
}

export class ProductUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly vendorId: string,
    public readonly name: string,
    public readonly slug: string
  ) {}
}
