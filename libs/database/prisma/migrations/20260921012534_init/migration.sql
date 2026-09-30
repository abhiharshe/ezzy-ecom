-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "affiliates";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "orders";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "seo";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "vendors";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VENDOR', 'CUSTOMER', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "vendors"."VendorStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "vendors"."SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'DISPUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "vendors"."PayoutStatus" AS ENUM ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "vendors"."VendorLedgerReferenceType" AS ENUM ('ORDER_SALE', 'COMMISSION_DEDUCTION', 'TDS_DEDUCTION', 'TCS_DEDUCTION', 'REFUND_REVERSAL', 'PAYOUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "catalog"."ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "inventory"."StockMovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'RESERVATION_HOLD', 'RESERVATION_RELEASE', 'RETURN');

-- CreateEnum
CREATE TYPE "inventory"."ReservationStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "orders"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "orders"."OrderItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "orders"."PaymentProvider" AS ENUM ('RAZORPAY', 'CASHFREE', 'PHONEPE', 'STRIPE', 'COD');

-- CreateEnum
CREATE TYPE "orders"."PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "orders"."RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "affiliates"."AffiliateTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "affiliates"."AffiliateStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "affiliates"."CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "affiliates"."AffiliateLedgerReferenceType" AS ENUM ('COMMISSION_EARNED', 'PAYOUT_WITHDRAWAL', 'COMMISSION_REVERSED', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "marketing"."PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "marketing"."DealType" AS ENUM ('TODAYS_DEAL', 'FLASH_SALE', 'CLEARANCE', 'FESTIVE_OFFER');

-- CreateEnum
CREATE TYPE "marketing"."BannerPlacement" AS ENUM ('HOME_HERO_CAROUSEL', 'HOME_STRIP', 'CATEGORY_BANNER', 'DEALS_SECTION', 'FESTIVE_SPOTLIGHT');

-- CreateEnum
CREATE TYPE "seo"."SeoEntityType" AS ENUM ('PRODUCT', 'CATEGORY');

-- CreateEnum
CREATE TYPE "seo"."SeoJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "platform"."WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "platform"."LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateTable
CREATE TABLE "auth"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "roles" "auth"."UserRole"[] DEFAULT ARRAY['CUSTOMER']::"auth"."UserRole"[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."UserAddress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT,
    "recipient_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "is_default_shipping" BOOLEAN NOT NULL DEFAULT false,
    "is_default_billing" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."RefreshToken" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."PasswordResetToken" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorProfile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "support_email" TEXT,
    "support_phone" TEXT,
    "gstin" TEXT,
    "pan_number" TEXT,
    "commission_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "status" "vendors"."VendorStatus" NOT NULL DEFAULT 'PENDING',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorPayoutAccount" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number_encrypted" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "branch_name" TEXT,
    "upi_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorSettings" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "auto_accept_orders" BOOLEAN NOT NULL DEFAULT true,
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "shipping_policy" TEXT,
    "return_policy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorSettlement" (
    "id" UUID NOT NULL,
    "settlement_number" TEXT NOT NULL,
    "vendor_id" UUID NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "gross_sales_in_paise" BIGINT NOT NULL,
    "commission_in_paise" BIGINT NOT NULL,
    "tax_deducted_in_paise" BIGINT NOT NULL DEFAULT 0,
    "refund_deductions_in_paise" BIGINT NOT NULL DEFAULT 0,
    "net_payable_in_paise" BIGINT NOT NULL,
    "status" "vendors"."SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "settled_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorPayout" (
    "id" UUID NOT NULL,
    "payout_number" TEXT NOT NULL,
    "vendor_id" UUID NOT NULL,
    "settlement_id" UUID,
    "payout_account_id" UUID NOT NULL,
    "amount_in_paise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "vendors"."PayoutStatus" NOT NULL DEFAULT 'INITIATED',
    "utr_number" TEXT,
    "payment_gateway_ref" TEXT,
    "failure_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors"."VendorLedger" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "entry_type" "platform"."LedgerEntryType" NOT NULL,
    "amount_in_paise" BIGINT NOT NULL,
    "balance_after_in_paise" BIGINT NOT NULL,
    "reference_type" "vendors"."VendorLedgerReferenceType" NOT NULL,
    "reference_id" UUID,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Category" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "attribute_schema" JSONB NOT NULL DEFAULT '[]',
    "return_window_days" INTEGER NOT NULL DEFAULT 7,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Brand" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Product" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "status" "catalog"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "base_price_in_paise" BIGINT NOT NULL,
    "compare_at_price_in_paise" BIGINT,
    "cost_price_in_paise" BIGINT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."ProductVariant" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "variant_attributes" JSONB NOT NULL DEFAULT '{}',
    "price_in_paise" BIGINT NOT NULL,
    "compare_at_price_in_paise" BIGINT,
    "weight_in_grams" INTEGER,
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."ProductImage" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."ProductReview" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."ProductEmbedding" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "embedding" vector(1536),
    "model_version" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."Warehouse" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "contact" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."StockLevel" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_threshold" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."StockMovement" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "type" "inventory"."StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" UUID,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."StockReservation" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "order_id" UUID,
    "quantity" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "inventory"."ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."Order" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" "orders"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal_in_paise" BIGINT NOT NULL,
    "discount_in_paise" BIGINT NOT NULL DEFAULT 0,
    "tax_in_paise" BIGINT NOT NULL DEFAULT 0,
    "shipping_in_paise" BIGINT NOT NULL DEFAULT 0,
    "total_amount_in_paise" BIGINT NOT NULL,
    "shipping_address" JSONB NOT NULL,
    "billing_address" JSONB NOT NULL,
    "coupon_code" TEXT,
    "affiliate_code" TEXT,
    "customer_notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."SubOrder" (
    "id" UUID NOT NULL,
    "sub_order_number" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "status" "orders"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal_in_paise" BIGINT NOT NULL,
    "discount_in_paise" BIGINT NOT NULL DEFAULT 0,
    "tax_in_paise" BIGINT NOT NULL DEFAULT 0,
    "shipping_in_paise" BIGINT NOT NULL DEFAULT 0,
    "total_amount_in_paise" BIGINT NOT NULL,
    "shipping_carrier" TEXT,
    "tracking_number" TEXT,
    "delivered_at" TIMESTAMP(3),
    "escrow_release_date" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."OrderItem" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "sub_order_id" UUID,
    "variant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "warehouse_id" UUID,
    "quantity" INTEGER NOT NULL,
    "unit_price_in_paise" BIGINT NOT NULL,
    "total_price_in_paise" BIGINT NOT NULL,
    "tax_in_paise" BIGINT NOT NULL DEFAULT 0,
    "discount_in_paise" BIGINT NOT NULL DEFAULT 0,
    "status" "orders"."OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."OrderStatusHistory" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "orders"."OrderStatus",
    "to_status" "orders"."OrderStatus" NOT NULL,
    "notes" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."Payment" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "orders"."PaymentProvider" NOT NULL,
    "transaction_reference" TEXT,
    "amount_in_paise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "orders"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "gateway_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."Refund" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID,
    "amount_in_paise" BIGINT NOT NULL,
    "reason" TEXT,
    "status" "orders"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_refund_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates"."AffiliateProfile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "referral_code" TEXT NOT NULL,
    "tier" "affiliates"."AffiliateTier" NOT NULL DEFAULT 'BRONZE',
    "commission_rate_override" DECIMAL(5,2),
    "upline_affiliate_id" UUID,
    "status" "affiliates"."AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "bank_payout_details" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates"."AffiliateLink" (
    "id" UUID NOT NULL,
    "affiliate_id" UUID NOT NULL,
    "product_id" UUID,
    "campaign" TEXT,
    "slug" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates"."AffiliateClick" (
    "id" UUID NOT NULL,
    "affiliate_link_id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer_url" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates"."AffiliateCommission" (
    "id" UUID NOT NULL,
    "affiliate_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID,
    "tier_level" INTEGER NOT NULL DEFAULT 1,
    "commission_in_paise" BIGINT NOT NULL,
    "status" "affiliates"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates"."CommissionLedger" (
    "id" UUID NOT NULL,
    "affiliate_id" UUID NOT NULL,
    "commission_id" UUID,
    "entry_type" "platform"."LedgerEntryType" NOT NULL,
    "amount_in_paise" BIGINT NOT NULL,
    "balance_after_in_paise" BIGINT NOT NULL,
    "reference_type" "affiliates"."AffiliateLedgerReferenceType" NOT NULL,
    "reference_id" UUID,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."Promotion" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "marketing"."PromotionType" NOT NULL,
    "value_in_paise" BIGINT,
    "value_percent" DECIMAL(5,2),
    "min_order_value_in_paise" BIGINT,
    "max_discount_in_paise" BIGINT,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."Coupon" (
    "id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "usage_limit_per_user" INTEGER NOT NULL DEFAULT 1,
    "usage_limit_total" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."CouponUsage" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "discount_amount_in_paise" BIGINT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."FestiveCampaign" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "theme_config" JSONB NOT NULL DEFAULT '{}',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FestiveCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."Deal" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "marketing"."DealType" NOT NULL DEFAULT 'TODAYS_DEAL',
    "badge_text" TEXT,
    "banner_image_url" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "campaign_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."DealItem" (
    "id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "deal_price_in_paise" BIGINT NOT NULL,
    "discount_percentage" INTEGER,
    "allocated_quantity" INTEGER,
    "sold_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."CarouselBanner" (
    "id" UUID NOT NULL,
    "campaign_id" UUID,
    "placement" "marketing"."BannerPlacement" NOT NULL DEFAULT 'HOME_HERO_CAROUSEL',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "target_url" TEXT NOT NULL,
    "cta_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo"."ProductSeo" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "meta_title" VARCHAR(120),
    "meta_description" VARCHAR(320),
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image_url" TEXT,
    "canonical_url" TEXT,
    "json_ld" JSONB,
    "generated_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "model_version" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo"."CategorySeo" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "meta_title" VARCHAR(120),
    "meta_description" VARCHAR(320),
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "json_ld" JSONB,
    "generated_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorySeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo"."SeoGenerationJob" (
    "id" UUID NOT NULL,
    "entity_type" "seo"."SeoEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "status" "seo"."SeoJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "qstash_message_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."DailyVendorMetric" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "gross_sales_in_paise" BIGINT NOT NULL DEFAULT 0,
    "net_sales_in_paise" BIGINT NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "units_sold" INTEGER NOT NULL DEFAULT 0,
    "returns_count" INTEGER NOT NULL DEFAULT 0,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyVendorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."DailyProductMetric" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "cart_adds" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue_in_paise" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProductMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."DailyPlatformMetric" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "gross_merchandise_value_in_paise" BIGINT NOT NULL DEFAULT 0,
    "net_revenue_in_paise" BIGINT NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,
    "active_vendors" INTEGER NOT NULL DEFAULT 0,
    "affiliate_commissions_in_paise" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlatformMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."TrafficEvent" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."AuditLog" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."FeatureFlag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "target_roles" "auth"."UserRole"[] DEFAULT ARRAY[]::"auth"."UserRole"[],
    "rollout_percentage" INTEGER NOT NULL DEFAULT 100,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."WebhookEventLog" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "platform"."WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "auth"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "auth"."User"("phone_number");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "auth"."User"("email");

-- CreateIndex
CREATE INDEX "User_phone_number_idx" ON "auth"."User"("phone_number");

-- CreateIndex
CREATE INDEX "User_deleted_at_idx" ON "auth"."User"("deleted_at");

-- CreateIndex
CREATE INDEX "UserAddress_user_id_idx" ON "auth"."UserAddress"("user_id");

-- CreateIndex
CREATE INDEX "UserAddress_postal_code_idx" ON "auth"."UserAddress"("postal_code");

-- CreateIndex
CREATE INDEX "UserAddress_deleted_at_idx" ON "auth"."UserAddress"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_hash_key" ON "auth"."Session"("token_hash");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "auth"."Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "auth"."Session"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "auth"."RefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "auth"."RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "RefreshToken_token_hash_idx" ON "auth"."RefreshToken"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key" ON "auth"."PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_hash_idx" ON "auth"."PasswordResetToken"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_user_id_key" ON "vendors"."VendorProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "vendors"."VendorProfile"("slug");

-- CreateIndex
CREATE INDEX "VendorProfile_user_id_idx" ON "vendors"."VendorProfile"("user_id");

-- CreateIndex
CREATE INDEX "VendorProfile_status_idx" ON "vendors"."VendorProfile"("status");

-- CreateIndex
CREATE INDEX "VendorProfile_deleted_at_idx" ON "vendors"."VendorProfile"("deleted_at");

-- CreateIndex
CREATE INDEX "VendorPayoutAccount_vendor_id_idx" ON "vendors"."VendorPayoutAccount"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorPayoutAccount_deleted_at_idx" ON "vendors"."VendorPayoutAccount"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettings_vendor_id_key" ON "vendors"."VendorSettings"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_settlement_number_key" ON "vendors"."VendorSettlement"("settlement_number");

-- CreateIndex
CREATE INDEX "VendorSettlement_vendor_id_idx" ON "vendors"."VendorSettlement"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorSettlement_status_idx" ON "vendors"."VendorSettlement"("status");

-- CreateIndex
CREATE INDEX "VendorSettlement_period_start_period_end_idx" ON "vendors"."VendorSettlement"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "VendorSettlement_deleted_at_idx" ON "vendors"."VendorSettlement"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayout_payout_number_key" ON "vendors"."VendorPayout"("payout_number");

-- CreateIndex
CREATE INDEX "VendorPayout_vendor_id_idx" ON "vendors"."VendorPayout"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorPayout_settlement_id_idx" ON "vendors"."VendorPayout"("settlement_id");

-- CreateIndex
CREATE INDEX "VendorPayout_status_idx" ON "vendors"."VendorPayout"("status");

-- CreateIndex
CREATE INDEX "VendorPayout_deleted_at_idx" ON "vendors"."VendorPayout"("deleted_at");

-- CreateIndex
CREATE INDEX "VendorLedger_vendor_id_idx" ON "vendors"."VendorLedger"("vendor_id");

-- CreateIndex
CREATE INDEX "VendorLedger_created_at_idx" ON "vendors"."VendorLedger"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "catalog"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parent_id_idx" ON "catalog"."Category"("parent_id");

-- CreateIndex
CREATE INDEX "Category_is_active_idx" ON "catalog"."Category"("is_active");

-- CreateIndex
CREATE INDEX "Category_deleted_at_idx" ON "catalog"."Category"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "catalog"."Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_is_active_idx" ON "catalog"."Brand"("is_active");

-- CreateIndex
CREATE INDEX "Brand_deleted_at_idx" ON "catalog"."Brand"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "catalog"."Product"("slug");

-- CreateIndex
CREATE INDEX "Product_vendor_id_idx" ON "catalog"."Product"("vendor_id");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "catalog"."Product"("category_id");

-- CreateIndex
CREATE INDEX "Product_brand_id_idx" ON "catalog"."Product"("brand_id");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "catalog"."Product"("status");

-- CreateIndex
CREATE INDEX "Product_is_featured_idx" ON "catalog"."Product"("is_featured");

-- CreateIndex
CREATE INDEX "Product_deleted_at_idx" ON "catalog"."Product"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "catalog"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_product_id_idx" ON "catalog"."ProductVariant"("product_id");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "catalog"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_is_active_idx" ON "catalog"."ProductVariant"("is_active");

-- CreateIndex
CREATE INDEX "ProductVariant_deleted_at_idx" ON "catalog"."ProductVariant"("deleted_at");

-- CreateIndex
CREATE INDEX "ProductImage_product_id_idx" ON "catalog"."ProductImage"("product_id");

-- CreateIndex
CREATE INDEX "ProductImage_variant_id_idx" ON "catalog"."ProductImage"("variant_id");

-- CreateIndex
CREATE INDEX "ProductReview_product_id_idx" ON "catalog"."ProductReview"("product_id");

-- CreateIndex
CREATE INDEX "ProductReview_user_id_idx" ON "catalog"."ProductReview"("user_id");

-- CreateIndex
CREATE INDEX "ProductReview_rating_idx" ON "catalog"."ProductReview"("rating");

-- CreateIndex
CREATE INDEX "ProductReview_deleted_at_idx" ON "catalog"."ProductReview"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_product_id_key" ON "catalog"."ProductEmbedding"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "inventory"."Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_code_idx" ON "inventory"."Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_is_active_idx" ON "inventory"."Warehouse"("is_active");

-- CreateIndex
CREATE INDEX "Warehouse_deleted_at_idx" ON "inventory"."Warehouse"("deleted_at");

-- CreateIndex
CREATE INDEX "StockLevel_variant_id_idx" ON "inventory"."StockLevel"("variant_id");

-- CreateIndex
CREATE INDEX "StockLevel_warehouse_id_idx" ON "inventory"."StockLevel"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_variant_id_warehouse_id_key" ON "inventory"."StockLevel"("variant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "StockMovement_variant_id_idx" ON "inventory"."StockMovement"("variant_id");

-- CreateIndex
CREATE INDEX "StockMovement_warehouse_id_idx" ON "inventory"."StockMovement"("warehouse_id");

-- CreateIndex
CREATE INDEX "StockMovement_created_at_idx" ON "inventory"."StockMovement"("created_at");

-- CreateIndex
CREATE INDEX "StockReservation_variant_id_warehouse_id_idx" ON "inventory"."StockReservation"("variant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "StockReservation_order_id_idx" ON "inventory"."StockReservation"("order_id");

-- CreateIndex
CREATE INDEX "StockReservation_expires_at_idx" ON "inventory"."StockReservation"("expires_at");

-- CreateIndex
CREATE INDEX "StockReservation_status_idx" ON "inventory"."StockReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_order_number_key" ON "orders"."Order"("order_number");

-- CreateIndex
CREATE INDEX "Order_customer_id_idx" ON "orders"."Order"("customer_id");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "orders"."Order"("status");

-- CreateIndex
CREATE INDEX "Order_coupon_code_idx" ON "orders"."Order"("coupon_code");

-- CreateIndex
CREATE INDEX "Order_affiliate_code_idx" ON "orders"."Order"("affiliate_code");

-- CreateIndex
CREATE INDEX "Order_created_at_idx" ON "orders"."Order"("created_at");

-- CreateIndex
CREATE INDEX "Order_deleted_at_idx" ON "orders"."Order"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrder_sub_order_number_key" ON "orders"."SubOrder"("sub_order_number");

-- CreateIndex
CREATE INDEX "SubOrder_order_id_idx" ON "orders"."SubOrder"("order_id");

-- CreateIndex
CREATE INDEX "SubOrder_vendor_id_idx" ON "orders"."SubOrder"("vendor_id");

-- CreateIndex
CREATE INDEX "SubOrder_status_idx" ON "orders"."SubOrder"("status");

-- CreateIndex
CREATE INDEX "SubOrder_delivered_at_idx" ON "orders"."SubOrder"("delivered_at");

-- CreateIndex
CREATE INDEX "SubOrder_deleted_at_idx" ON "orders"."SubOrder"("deleted_at");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "orders"."OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_sub_order_id_idx" ON "orders"."OrderItem"("sub_order_id");

-- CreateIndex
CREATE INDEX "OrderItem_variant_id_idx" ON "orders"."OrderItem"("variant_id");

-- CreateIndex
CREATE INDEX "OrderItem_vendor_id_idx" ON "orders"."OrderItem"("vendor_id");

-- CreateIndex
CREATE INDEX "OrderItem_status_idx" ON "orders"."OrderItem"("status");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_order_id_idx" ON "orders"."OrderStatusHistory"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transaction_reference_key" ON "orders"."Payment"("transaction_reference");

-- CreateIndex
CREATE INDEX "Payment_order_id_idx" ON "orders"."Payment"("order_id");

-- CreateIndex
CREATE INDEX "Payment_transaction_reference_idx" ON "orders"."Payment"("transaction_reference");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "orders"."Payment"("status");

-- CreateIndex
CREATE INDEX "Refund_order_id_idx" ON "orders"."Refund"("order_id");

-- CreateIndex
CREATE INDEX "Refund_payment_id_idx" ON "orders"."Refund"("payment_id");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "orders"."Refund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_user_id_key" ON "affiliates"."AffiliateProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_referral_code_key" ON "affiliates"."AffiliateProfile"("referral_code");

-- CreateIndex
CREATE INDEX "AffiliateProfile_user_id_idx" ON "affiliates"."AffiliateProfile"("user_id");

-- CreateIndex
CREATE INDEX "AffiliateProfile_referral_code_idx" ON "affiliates"."AffiliateProfile"("referral_code");

-- CreateIndex
CREATE INDEX "AffiliateProfile_status_idx" ON "affiliates"."AffiliateProfile"("status");

-- CreateIndex
CREATE INDEX "AffiliateProfile_deleted_at_idx" ON "affiliates"."AffiliateProfile"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_slug_key" ON "affiliates"."AffiliateLink"("slug");

-- CreateIndex
CREATE INDEX "AffiliateLink_affiliate_id_idx" ON "affiliates"."AffiliateLink"("affiliate_id");

-- CreateIndex
CREATE INDEX "AffiliateLink_product_id_idx" ON "affiliates"."AffiliateLink"("product_id");

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliate_link_id_idx" ON "affiliates"."AffiliateClick"("affiliate_link_id");

-- CreateIndex
CREATE INDEX "AffiliateClick_session_id_idx" ON "affiliates"."AffiliateClick"("session_id");

-- CreateIndex
CREATE INDEX "AffiliateClick_expires_at_idx" ON "affiliates"."AffiliateClick"("expires_at");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliate_id_idx" ON "affiliates"."AffiliateCommission"("affiliate_id");

-- CreateIndex
CREATE INDEX "AffiliateCommission_order_id_idx" ON "affiliates"."AffiliateCommission"("order_id");

-- CreateIndex
CREATE INDEX "AffiliateCommission_status_idx" ON "affiliates"."AffiliateCommission"("status");

-- CreateIndex
CREATE INDEX "CommissionLedger_affiliate_id_idx" ON "affiliates"."CommissionLedger"("affiliate_id");

-- CreateIndex
CREATE INDEX "CommissionLedger_created_at_idx" ON "affiliates"."CommissionLedger"("created_at");

-- CreateIndex
CREATE INDEX "Promotion_is_active_idx" ON "marketing"."Promotion"("is_active");

-- CreateIndex
CREATE INDEX "Promotion_starts_at_ends_at_idx" ON "marketing"."Promotion"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "Promotion_deleted_at_idx" ON "marketing"."Promotion"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "marketing"."Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "marketing"."Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_is_active_idx" ON "marketing"."Coupon"("is_active");

-- CreateIndex
CREATE INDEX "Coupon_deleted_at_idx" ON "marketing"."Coupon"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_order_id_key" ON "marketing"."CouponUsage"("order_id");

-- CreateIndex
CREATE INDEX "CouponUsage_coupon_id_idx" ON "marketing"."CouponUsage"("coupon_id");

-- CreateIndex
CREATE INDEX "CouponUsage_user_id_idx" ON "marketing"."CouponUsage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_coupon_id_user_id_order_id_key" ON "marketing"."CouponUsage"("coupon_id", "user_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "FestiveCampaign_slug_key" ON "marketing"."FestiveCampaign"("slug");

-- CreateIndex
CREATE INDEX "FestiveCampaign_slug_idx" ON "marketing"."FestiveCampaign"("slug");

-- CreateIndex
CREATE INDEX "FestiveCampaign_is_active_idx" ON "marketing"."FestiveCampaign"("is_active");

-- CreateIndex
CREATE INDEX "FestiveCampaign_starts_at_ends_at_idx" ON "marketing"."FestiveCampaign"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "FestiveCampaign_deleted_at_idx" ON "marketing"."FestiveCampaign"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_slug_key" ON "marketing"."Deal"("slug");

-- CreateIndex
CREATE INDEX "Deal_type_idx" ON "marketing"."Deal"("type");

-- CreateIndex
CREATE INDEX "Deal_is_active_idx" ON "marketing"."Deal"("is_active");

-- CreateIndex
CREATE INDEX "Deal_starts_at_ends_at_idx" ON "marketing"."Deal"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "Deal_campaign_id_idx" ON "marketing"."Deal"("campaign_id");

-- CreateIndex
CREATE INDEX "Deal_deleted_at_idx" ON "marketing"."Deal"("deleted_at");

-- CreateIndex
CREATE INDEX "DealItem_deal_id_idx" ON "marketing"."DealItem"("deal_id");

-- CreateIndex
CREATE INDEX "DealItem_product_id_idx" ON "marketing"."DealItem"("product_id");

-- CreateIndex
CREATE INDEX "DealItem_variant_id_idx" ON "marketing"."DealItem"("variant_id");

-- CreateIndex
CREATE INDEX "CarouselBanner_placement_idx" ON "marketing"."CarouselBanner"("placement");

-- CreateIndex
CREATE INDEX "CarouselBanner_is_active_idx" ON "marketing"."CarouselBanner"("is_active");

-- CreateIndex
CREATE INDEX "CarouselBanner_sort_order_idx" ON "marketing"."CarouselBanner"("sort_order");

-- CreateIndex
CREATE INDEX "CarouselBanner_deleted_at_idx" ON "marketing"."CarouselBanner"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSeo_product_id_key" ON "seo"."ProductSeo"("product_id");

-- CreateIndex
CREATE INDEX "ProductSeo_product_id_idx" ON "seo"."ProductSeo"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySeo_category_id_key" ON "seo"."CategorySeo"("category_id");

-- CreateIndex
CREATE INDEX "CategorySeo_category_id_idx" ON "seo"."CategorySeo"("category_id");

-- CreateIndex
CREATE INDEX "SeoGenerationJob_status_idx" ON "seo"."SeoGenerationJob"("status");

-- CreateIndex
CREATE INDEX "SeoGenerationJob_created_at_idx" ON "seo"."SeoGenerationJob"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "SeoGenerationJob_entity_type_entity_id_key" ON "seo"."SeoGenerationJob"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "DailyVendorMetric_vendor_id_idx" ON "analytics"."DailyVendorMetric"("vendor_id");

-- CreateIndex
CREATE INDEX "DailyVendorMetric_date_idx" ON "analytics"."DailyVendorMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyVendorMetric_vendor_id_date_key" ON "analytics"."DailyVendorMetric"("vendor_id", "date");

-- CreateIndex
CREATE INDEX "DailyProductMetric_product_id_idx" ON "analytics"."DailyProductMetric"("product_id");

-- CreateIndex
CREATE INDEX "DailyProductMetric_date_idx" ON "analytics"."DailyProductMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProductMetric_product_id_date_key" ON "analytics"."DailyProductMetric"("product_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlatformMetric_date_key" ON "analytics"."DailyPlatformMetric"("date");

-- CreateIndex
CREATE INDEX "DailyPlatformMetric_date_idx" ON "analytics"."DailyPlatformMetric"("date");

-- CreateIndex
CREATE INDEX "TrafficEvent_event_type_idx" ON "analytics"."TrafficEvent"("event_type");

-- CreateIndex
CREATE INDEX "TrafficEvent_user_id_idx" ON "analytics"."TrafficEvent"("user_id");

-- CreateIndex
CREATE INDEX "TrafficEvent_session_id_idx" ON "analytics"."TrafficEvent"("session_id");

-- CreateIndex
CREATE INDEX "TrafficEvent_entity_type_entity_id_idx" ON "analytics"."TrafficEvent"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "TrafficEvent_created_at_idx" ON "analytics"."TrafficEvent"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "platform"."SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "platform"."SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "platform"."SystemSetting"("category");

-- CreateIndex
CREATE INDEX "AuditLog_actor_id_idx" ON "platform"."AuditLog"("actor_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "platform"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "platform"."AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "platform"."AuditLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_key" ON "platform"."FeatureFlag"("name");

-- CreateIndex
CREATE INDEX "FeatureFlag_name_idx" ON "platform"."FeatureFlag"("name");

-- CreateIndex
CREATE INDEX "WebhookEventLog_event_type_idx" ON "platform"."WebhookEventLog"("event_type");

-- CreateIndex
CREATE INDEX "WebhookEventLog_source_idx" ON "platform"."WebhookEventLog"("source");

-- CreateIndex
CREATE INDEX "WebhookEventLog_status_idx" ON "platform"."WebhookEventLog"("status");

-- CreateIndex
CREATE INDEX "WebhookEventLog_created_at_idx" ON "platform"."WebhookEventLog"("created_at");

-- AddForeignKey
ALTER TABLE "auth"."UserAddress" ADD CONSTRAINT "UserAddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorProfile" ADD CONSTRAINT "VendorProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorPayoutAccount" ADD CONSTRAINT "VendorPayoutAccount_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorSettings" ADD CONSTRAINT "VendorSettings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorSettlement" ADD CONSTRAINT "VendorSettlement_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorPayout" ADD CONSTRAINT "VendorPayout_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorPayout" ADD CONSTRAINT "VendorPayout_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "vendors"."VendorSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorPayout" ADD CONSTRAINT "VendorPayout_payout_account_id_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "vendors"."VendorPayoutAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors"."VendorLedger" ADD CONSTRAINT "VendorLedger_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Category" ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Product" ADD CONSTRAINT "Product_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Product" ADD CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "catalog"."Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."ProductImage" ADD CONSTRAINT "ProductImage_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."ProductReview" ADD CONSTRAINT "ProductReview_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."ProductReview" ADD CONSTRAINT "ProductReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockLevel" ADD CONSTRAINT "StockLevel_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockLevel" ADD CONSTRAINT "StockLevel_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockMovement" ADD CONSTRAINT "StockMovement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockMovement" ADD CONSTRAINT "StockMovement_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockReservation" ADD CONSTRAINT "StockReservation_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."StockReservation" ADD CONSTRAINT "StockReservation_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory"."Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."Order" ADD CONSTRAINT "Order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."SubOrder" ADD CONSTRAINT "SubOrder_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."SubOrder" ADD CONSTRAINT "SubOrder_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderItem" ADD CONSTRAINT "OrderItem_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "orders"."SubOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderItem" ADD CONSTRAINT "OrderItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderItem" ADD CONSTRAINT "OrderItem_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"."VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderItem" ADD CONSTRAINT "OrderItem_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "inventory"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."Refund" ADD CONSTRAINT "Refund_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."Refund" ADD CONSTRAINT "Refund_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "orders"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_upline_affiliate_id_fkey" FOREIGN KEY ("upline_affiliate_id") REFERENCES "affiliates"."AffiliateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"."AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateLink" ADD CONSTRAINT "AffiliateLink_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "affiliates"."AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"."AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates"."CommissionLedger" ADD CONSTRAINT "CommissionLedger_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"."AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."Coupon" ADD CONSTRAINT "Coupon_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "marketing"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."CouponUsage" ADD CONSTRAINT "CouponUsage_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "marketing"."Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."CouponUsage" ADD CONSTRAINT "CouponUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."Deal" ADD CONSTRAINT "Deal_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."FestiveCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."DealItem" ADD CONSTRAINT "DealItem_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "marketing"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."DealItem" ADD CONSTRAINT "DealItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."DealItem" ADD CONSTRAINT "DealItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing"."CarouselBanner" ADD CONSTRAINT "CarouselBanner_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing"."FestiveCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo"."ProductSeo" ADD CONSTRAINT "ProductSeo_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo"."CategorySeo" ADD CONSTRAINT "CategorySeo_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
