<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Tag,
  RefreshCw,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-vue-next';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppTrendPill from '@/shared/components/ui/AppTrendPill.vue';
import AppStatCard from '@/shared/components/ui/AppStatCard.vue';
import AppProgressBar from '@/shared/components/ui/AppProgressBar.vue';
import { useToast } from '@/shared/composables/useToast';

const toast = useToast();

const isSyncing = ref(false);
const searchQuery = ref('');
const selectedScope = ref<string>('all');

// Quick Stats Data
const stats = ref([
  {
    id: 'active_rules',
    title: 'Active Rules',
    value: '05',
    subValue: '3 Scheduled',
    trend: '+2 vs last wk',
    trendType: 'positive' as const,
    icon: Tag,
    iconColor: '#6366f1',
    iconBg: '#e0e7ff',
  },
  {
    id: 'gross_margin',
    title: 'Avg Gross Margin',
    value: '65.4%',
    subValue: 'Target: 62%',
    trend: '+3.4% vs target',
    trendType: 'positive' as const,
    icon: TrendingUp,
    iconColor: '#059669',
    iconBg: '#d1fae5',
  },
  {
    id: 'price_impact',
    title: 'Net Price Impact',
    value: '+$3,270/wk',
    subValue: 'Dynamic adjustments',
    trend: '+12.8% vs last wk',
    trendType: 'positive' as const,
    icon: Zap,
    iconColor: '#3b82f6',
    iconBg: '#dbeafe',
  },
  {
    id: 'alerts',
    title: 'Competitor Alerts',
    value: '01',
    subValue: '2 Price drops flagged',
    trend: 'Action needed',
    trendType: 'warning' as const,
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
  },
]);

// Pricing Rules List
interface PricingRule {
  id: string;
  name: string;
  scope: 'Storewide' | 'VIP' | 'Collection' | 'Product';
  condition: string;
  schedule: string;
  impact: string;
  enabled: boolean;
}

const pricingRules = ref<PricingRule[]>([
  {
    id: 'rule-1',
    name: 'Weekend Flash Markdown',
    scope: 'Storewide',
    condition: '15% off orders over $150',
    schedule: 'Oct 12 – Oct 14',
    impact: '+$1,420/wk',
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'VIP Member Tier 2',
    scope: 'VIP',
    condition: '10% auto-discount at checkout',
    schedule: 'Permanent / Ongoing',
    impact: '+$850/wk',
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Outerwear Liquidation',
    scope: 'Collection',
    condition: 'Margin floor pinned at 45%',
    schedule: 'Ends in 4 days',
    impact: '+$620/wk',
    enabled: true,
  },
  {
    id: 'rule-4',
    name: 'Competitor Match: Alpaca Coat',
    scope: 'Product',
    condition: 'Dynamic matching vs Nordstrom index',
    schedule: 'Live sync active',
    impact: '+$380/wk',
    enabled: true,
  },
  {
    id: 'rule-5',
    name: 'Early Bird Holiday Promo',
    scope: 'Storewide',
    condition: '5% early bird discount on luxury catalog',
    schedule: 'Starts Nov 01',
    impact: 'Scheduled',
    enabled: false,
  },
]);

// Product Intelligence Data
interface ProductPriceItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentPrice: number;
  competitorPrice: number;
  margin: number;
  trend: number;
  ruleScope: 'Storewide' | 'VIP' | 'Collection' | 'Product';
  status: 'Active' | 'Under Review';
}

const products = ref<ProductPriceItem[]>([
  {
    id: 'p-1',
    name: 'Alpaca Blend Overcoat',
    sku: 'ALP-8821',
    category: 'Outerwear',
    currentPrice: 340.0,
    competitorPrice: 349.0,
    margin: 72,
    trend: 4.2,
    ruleScope: 'Product',
    status: 'Active',
  },
  {
    id: 'p-2',
    name: 'Silk Lined Tailored Blazer',
    sku: 'SLK-1904',
    category: 'Formalwear',
    currentPrice: 285.0,
    competitorPrice: 299.0,
    margin: 75,
    trend: 1.8,
    ruleScope: 'VIP',
    status: 'Active',
  },
  {
    id: 'p-3',
    name: 'Cashmere Crewneck Sweater',
    sku: 'CSH-4412',
    category: 'Knitwear',
    currentPrice: 195.0,
    competitorPrice: 195.0,
    margin: 68,
    trend: 8.5,
    ruleScope: 'Storewide',
    status: 'Active',
  },
  {
    id: 'p-4',
    name: 'Linen Vacation Collar Shirt',
    sku: 'LNN-3029',
    category: 'Shirts',
    currentPrice: 88.0,
    competitorPrice: 92.0,
    margin: 62,
    trend: -2.1,
    ruleScope: 'Collection',
    status: 'Active',
  },
  {
    id: 'p-5',
    name: 'Selvedge Denim Trucker Jacket',
    sku: 'DNM-0083',
    category: 'Outerwear',
    currentPrice: 160.0,
    competitorPrice: 175.0,
    margin: 58,
    trend: 3.0,
    ruleScope: 'Storewide',
    status: 'Active',
  },
  {
    id: 'p-6',
    name: 'Garment-Dyed Twill Chinos',
    sku: 'TWL-5521',
    category: 'Pants',
    currentPrice: 110.0,
    competitorPrice: 115.0,
    margin: 64,
    trend: 0.5,
    ruleScope: 'Storewide',
    status: 'Active',
  },
]);

const filteredProducts = computed(() => {
  return products.value.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesScope =
      selectedScope.value === 'all' ||
      item.ruleScope.toLowerCase() === selectedScope.value.toLowerCase();

    return matchesSearch && matchesScope;
  });
});

const handleToggleRule = (rule: PricingRule) => {
  const statusStr = rule.enabled ? 'activated' : 'paused';
  toast.success(
    `Rule ${rule.name}`,
    `Pricing rule was successfully ${statusStr}.`
  );
};

const handleSync = async () => {
  isSyncing.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  isSyncing.value = false;
  toast.info('Live Sync Completed', 'Market pricing feeds synchronized with live indexes.');
};

const handleExportReport = () => {
  toast.info('Report Queued', 'Pricing & margin audit report is generating.');
};

const handlePublishChanges = () => {
  toast.success(
    'Changes Published',
    'Dynamic price indexes updated across storefront and vendor feeds.'
  );
};

const getScopeBadgeVariant = (scope: string) => {
  switch (scope) {
    case 'Storewide':
      return 'storewide';
    case 'VIP':
      return 'vip';
    case 'Collection':
      return 'collection';
    case 'Product':
      return 'product';
    default:
      return 'neutral';
  }
};
</script>

<template>
  <div class="overview-container">
    <!-- Top Action & Breadcrumb Bar -->
    <header class="top-bar">
      <div class="breadcrumb-group">
        <div class="breadcrumb-trail">
          <span class="trail-crumb">COMMAND</span>
          <span class="trail-divider">/</span>
          <span class="trail-active">
            <Tag class="trail-icon" />
            Pricing Engine
          </span>
        </div>
        <div class="live-indicator">
          <span class="pulsing-dot"></span>
          <span class="indicator-text">Auto-refreshing every 2s</span>
        </div>
      </div>

      <div class="header-actions">
        <AppButton
          variant="outline"
          size="sm"
          :loading="isSyncing"
          @click="handleSync"
        >
          <template #icon>
            <RefreshCw class="btn-icon" :class="{ 'spin-anim': isSyncing }" />
          </template>
          Sync
        </AppButton>

        <AppButton
          variant="outline"
          size="sm"
          @click="handleExportReport"
        >
          <template #icon>
            <FileText class="btn-icon" />
          </template>
          Report
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          @click="toast.info('New Rule', 'Opening rule builder modal...')"
        >
          <template #icon>
            <Plus class="btn-icon" />
          </template>
          New Rule
        </AppButton>
      </div>
    </header>

    <div class="dashboard-body">
      <!-- 2x2 / 4-Col Quick Stats Grid -->
      <section class="stats-grid">
        <AppStatCard
          v-for="stat in stats"
          :key="stat.id"
          :title="stat.title"
          :value="stat.value"
          :sub-value="stat.subValue"
          :trend="stat.trend"
          :trend-type="stat.trendType"
        >
          <template #icon>
            <div
              class="stat-icon-wrap"
              :style="{ backgroundColor: stat.iconBg, color: stat.iconColor }"
            >
              <component :is="stat.icon" class="stat-icon" />
            </div>
          </template>
        </AppStatCard>
      </section>

      <!-- Main Dual Grid: Pricing Rules & Product Margin Intelligence -->
      <div class="grid-content">
        <!-- Pricing Rules Section -->
        <section class="card-section rules-card">
          <div class="section-header">
            <div class="header-title-wrap">
              <h2 class="section-title">Pricing Rules</h2>
              <span class="count-pill">5 Active</span>
            </div>
            <p class="section-description">
              Algorithmic price shifts, volume discounts & competitor adjustments.
            </p>
          </div>

          <div class="rules-list">
            <div
              v-for="rule in pricingRules"
              :key="rule.id"
              class="rule-row"
              :class="{ 'is-disabled': !rule.enabled }"
            >
              <div class="rule-main">
                <div class="rule-title-line">
                  <span class="rule-name">{{ rule.name }}</span>
                  <AppBadge :variant="getScopeBadgeVariant(rule.scope)" size="sm">
                    {{ rule.scope }}
                  </AppBadge>
                </div>
                <div class="rule-condition">{{ rule.condition }}</div>
                <div class="rule-meta">
                  <span class="meta-item">
                    <Clock class="meta-icon" />
                    {{ rule.schedule }}
                  </span>
                  <span class="meta-divider">•</span>
                  <span class="meta-item impact-text">
                    Impact: {{ rule.impact }}
                  </span>
                </div>
              </div>

              <div class="rule-toggle">
                <AppSwitch
                  v-model="rule.enabled"
                  @update:model-value="handleToggleRule(rule)"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Product Price Intelligence Table Card -->
        <section class="card-section products-card">
          <div class="section-header table-header-flex">
            <div>
              <h2 class="section-title">Product Pricing & Margin Intelligence</h2>
              <p class="section-description">
                Real-time margin calculation with live index comparison.
              </p>
            </div>

            <AppButton
              variant="primary"
              size="sm"
              @click="handlePublishChanges"
            >
              Publish Changes
            </AppButton>
          </div>

          <!-- Filter Toolbar -->
          <div class="table-toolbar">
            <div class="search-input-wrap">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Filter products, SKU, category..."
                class="filter-input"
              />
            </div>

            <div class="scope-filters">
              <button
                v-for="scope in ['all', 'Storewide', 'VIP', 'Collection', 'Product']"
                :key="scope"
                type="button"
                class="scope-chip"
                :class="{ 'is-active': selectedScope === scope }"
                @click="selectedScope = scope"
              >
                {{ scope === 'all' ? 'All Rules' : scope }}
              </button>
            </div>
          </div>

          <!-- Product Table -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Price</th>
                  <th>Competitor</th>
                  <th>Gross Margin</th>
                  <th>7D Trend</th>
                  <th>Applied Rule</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredProducts"
                  :key="item.id"
                  class="table-row"
                >
                  <!-- Product Column -->
                  <td class="product-cell">
                    <div class="product-avatar">
                      {{ item.name.charAt(0) }}
                    </div>
                    <div class="product-meta">
                      <span class="product-title">{{ item.name }}</span>
                      <span class="product-sub">{{ item.category }} • {{ item.sku }}</span>
                    </div>
                  </td>

                  <!-- Current Price -->
                  <td class="price-cell">
                    ${{ item.currentPrice.toFixed(2) }}
                  </td>

                  <!-- Competitor Price -->
                  <td class="competitor-cell">
                    <span class="comp-price">${{ item.competitorPrice.toFixed(2) }}</span>
                    <span
                      class="comp-diff"
                      :class="{
                        'is-lower': item.currentPrice < item.competitorPrice,
                        'is-higher': item.currentPrice > item.competitorPrice,
                      }"
                    >
                      {{
                        item.currentPrice < item.competitorPrice
                          ? `-$${(item.competitorPrice - item.currentPrice).toFixed(0)}`
                          : item.currentPrice > item.competitorPrice
                          ? `+$${(item.currentPrice - item.competitorPrice).toFixed(0)}`
                          : 'Matched'
                      }}
                    </span>
                  </td>

                  <!-- Gross Margin Bar -->
                  <td class="margin-cell">
                    <div class="margin-wrap">
                      <span class="margin-val">{{ item.margin }}%</span>
                      <AppProgressBar
                        :percentage="item.margin"
                        :variant="item.margin >= 70 ? 'success' : item.margin >= 60 ? 'primary' : 'warning'"
                        size="sm"
                      />
                    </div>
                  </td>

                  <!-- 7D Trend -->
                  <td>
                    <AppTrendPill
                      :value="`${item.trend > 0 ? '+' : ''}${item.trend}%`"
                      :trend="item.trend >= 0 ? 'positive' : 'negative'"
                    />
                  </td>

                  <!-- Rule Scope Badge -->
                  <td>
                    <AppBadge :variant="getScopeBadgeVariant(item.ruleScope)" size="sm">
                      {{ item.ruleScope }}
                    </AppBadge>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <button
                      type="button"
                      class="row-action-btn"
                      title="Inspect Margin"
                      @click="toast.info('Inspect SKU', `Opening pricing matrix for ${item.sku}`)"
                    >
                      <SlidersHorizontal class="action-icon" />
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredProducts.length === 0">
                  <td colspan="7" class="empty-state-cell">
                    <div class="empty-state">
                      <AlertTriangle class="empty-icon" />
                      <p>No products found matching "{{ searchQuery }}"</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Footer / Pagination -->
          <div class="table-pagination">
            <span class="pagination-info">
              Showing 1 to {{ filteredProducts.length }} of {{ products.length }} items
            </span>
            <div class="pagination-nav">
              <button type="button" class="page-btn" disabled>
                <ChevronLeft class="page-icon" />
              </button>
              <button type="button" class="page-btn is-active">1</button>
              <button type="button" class="page-btn">2</button>
              <button type="button" class="page-btn">
                <ChevronRight class="page-icon" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-container {
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Top Action & Breadcrumbs Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

.breadcrumb-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trail-crumb {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-subtle);
  letter-spacing: 0.06em;
}

.trail-divider {
  font-size: 11px;
  color: var(--text-muted);
}

.trail-active {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.trail-icon {
  width: 17px;
  height: 17px;
  color: #6366f1;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pulsing-dot {
  width: 7px;
  height: 7px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.indicator-text {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-subtle);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dashboard Body */
.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats 4-Col Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 18px;
  height: 18px;
}

/* Grid Layout for Cards */
.grid-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1100px) {
  .grid-content {
    grid-template-columns: 1fr;
  }
}

/* Common Card Section */
.card-section {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  margin-bottom: 20px;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.count-pill {
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background-color: #eef2ff;
  border: 1px solid #e0e7ff;
  border-radius: 999px;
  padding: 2px 8px;
}

.section-description {
  font-size: 12px;
  color: var(--text-subtle);
  margin-top: 3px;
}

/* Pricing Rules List */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.rule-row:hover {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
}

.rule-row.is-disabled {
  opacity: 0.55;
}

.rule-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.rule-condition {
  font-size: 12px;
  color: #475569;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-subtle);
  margin-top: 2px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  width: 12px;
  height: 12px;
}

.impact-text {
  font-weight: 600;
  color: #059669;
}

/* Products Card */
.table-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: #94a3b8;
}

.filter-input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 32px;
  font-size: 12.5px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background-color: #f8fafc;
}

.scope-filters {
  display: flex;
  gap: 6px;
}

.scope-chip {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.15s ease;
}

.scope-chip:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}

.scope-chip.is-active {
  background-color: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

/* Data Table */
.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-light);
}

.data-table td {
  padding: 12px;
  font-size: 12.5px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.table-row:hover td {
  background-color: #f8fafc;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.product-meta {
  display: flex;
  flex-direction: column;
}

.product-title {
  font-weight: 700;
  color: var(--text-main);
}

.product-sub {
  font-size: 11px;
  color: var(--text-subtle);
}

.price-cell {
  font-weight: 700;
  color: var(--text-main);
}

.competitor-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comp-price {
  color: var(--text-subtle);
}

.comp-diff {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
}

.comp-diff.is-lower {
  color: #059669;
  background: #d1fae5;
}

.comp-diff.is-higher {
  color: #dc2626;
  background: #fee2e2;
}

.margin-cell {
  min-width: 120px;
}

.margin-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.margin-val {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-main);
}

.text-right {
  text-align: right;
}

.row-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.15s ease;
}

.row-action-btn:hover {
  background-color: #e2e8f0;
  color: var(--text-main);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Empty State */
.empty-state-cell {
  padding: 40px !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-subtle);
}

.empty-icon {
  width: 24px;
  height: 24px;
  color: #f59e0b;
}

/* Table Pagination */
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
}

.pagination-info {
  font-size: 11.5px;
  color: var(--text-subtle);
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
  border: 1px solid var(--border-light);
  background-color: #ffffff;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled) {
  background-color: #f8fafc;
  color: var(--text-main);
}

.page-btn.is-active {
  background-color: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-icon {
  width: 13px;
  height: 13px;
}
</style>
