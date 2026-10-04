<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import AppToast from '@/shared/components/feedback/AppToast.vue';
import AppAvatar from '@/shared/components/ui/AppAvatar.vue';
import {
  LayoutGrid,
  Activity,
  Bell,
  ShoppingBag,
  Package,
  Tag,
  Users,
  Star,
  TrendingUp,
  CreditCard,
  Building2,
  Store,
  Tablet,
  Share2,
  Settings,
  Search,
  LogOut,
  User,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const showUserMenu = ref(false);
const searchQuery = ref('');

// Track open state of submenus (Catalog open by default)
const openSubmenus = ref<Record<string, boolean>>({
  catalog: true,
});

watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/catalog')) {
      openSubmenus.value['catalog'] = true;
    }
  },
  { immediate: true }
);

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleLogout = () => {
  showUserMenu.value = false;
  authStore.logout();
};

const navigateTo = (path: string) => {
  router.push(path);
};

const toggleSubmenu = (id: string, defaultPath?: string) => {
  openSubmenus.value[id] = !openSubmenus.value[id];
  if (openSubmenus.value[id] && defaultPath && !route.path.startsWith(defaultPath.split('/')[1])) {
    router.push(defaultPath);
  }
};

interface NavSubItem {
  id: string;
  label: string;
  path: string;
}

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: any;
  children?: NavSubItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: 'COMMAND',
    items: [
      { id: 'overview', label: 'Overview', path: '/overview', icon: LayoutGrid },
      { id: 'monitor', label: 'Live Monitor', path: '/monitor', icon: Activity },
      { id: 'alerts', label: 'Alerts', path: '/alerts', icon: Bell },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { id: 'orders', label: 'Order Queue', path: '/orders', icon: ShoppingBag },
      {
        id: 'catalog',
        label: 'Catalog',
        icon: Package,
        children: [
          { id: 'catalog-products', label: 'Products', path: '/catalog/products' },
          { id: 'catalog-categories', label: 'Categories', path: '/catalog/categories' },
        ],
      },
      { id: 'pricing', label: 'Pricing Engine', path: '/overview', icon: Tag },
      { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
      { id: 'reviews', label: 'Reviews', path: '/reviews', icon: Star },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { id: 'revenue', label: 'Revenue Desk', path: '/revenue', icon: TrendingUp },
      { id: 'payouts', label: 'Payouts', path: '/payouts', icon: CreditCard },
      { id: 'tax', label: 'Tax Engine', path: '/tax', icon: Building2 },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { id: 'marketplace', label: 'Marketplace', path: '/marketplace', icon: Store },
      { id: 'pos', label: 'POS', path: '/pos', icon: Tablet },
      { id: 'social', label: 'Social Channels', path: '/social', icon: Share2 },
      { id: 'settings', label: 'Settings', path: '/profile', icon: Settings },
    ],
  },
];

const isActiveRoute = (path: string) => {
  if (path === '/overview' && route.path === '/overview') return true;
  if (path !== '/overview' && route.path.startsWith(path)) return true;
  return false;
};

const isSubActive = (path: string) => {
  if (path === '/catalog/products') {
    return route.path.startsWith('/catalog/products') || route.path === '/catalog';
  }
  if (path === '/catalog/categories') {
    return route.path.startsWith('/catalog/categories');
  }
  return route.path === path || route.path.startsWith(path);
};

const isParentActive = (item: NavItem) => {
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isSubActive(child.path));
  }
  return item.path ? isActiveRoute(item.path) : false;
};
</script>

<template>
  <div class="admin-shell">
    <AppToast />

    <!-- Left Sidebar -->
    <aside class="sidebar">
      <!-- Brand Header -->
      <div class="brand-header" @click="navigateTo('/overview')">
        <div class="brand-badge">
          <span>C</span>
        </div>
        <div class="brand-info">
          <h2 class="brand-name">Confidency OS</h2>
          <p class="brand-role">Business Operations Platform</p>
        </div>
      </div>

      <!-- Search Input with ⌘K -->
      <div class="sidebar-search">
        <div class="search-box">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search.."
            class="search-input"
          />
          <kbd class="shortcut-key">⌘K</kbd>
        </div>
      </div>

      <!-- Navigation Tree -->
      <nav class="sidebar-nav">
        <div
          v-for="section in navigationSections"
          :key="section.title"
          class="nav-section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <ul class="nav-list">
            <li
              v-for="item in section.items"
              :key="item.id"
              class="nav-item"
            >
              <!-- Item with Children Submenu -->
              <div v-if="item.children && item.children.length > 0" class="nav-group">
                <button
                  type="button"
                  class="nav-button"
                  :class="{ 'is-active': isParentActive(item) }"
                  @click="toggleSubmenu(item.id, item.children[0].path)"
                >
                  <component :is="item.icon" class="nav-icon" />
                  <span class="nav-label">{{ item.label }}</span>
                  <ChevronDown
                    class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0"
                    :class="{ '-rotate-90': !openSubmenus[item.id] }"
                  />
                </button>

                <!-- Submenu List -->
                <div v-show="openSubmenus[item.id]" class="submenu-container">
                  <ul class="submenu-list">
                    <li v-for="sub in item.children" :key="sub.id" class="submenu-item">
                      <button
                        type="button"
                        class="submenu-button"
                        :class="{ 'is-active': isSubActive(sub.path) }"
                        @click="navigateTo(sub.path)"
                      >
                        <span class="submenu-dot" />
                        <span class="submenu-label">{{ sub.label }}</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Regular Single Item -->
              <button
                v-else
                type="button"
                class="nav-button"
                :class="{ 'is-active': isActiveRoute(item.path!) }"
                @click="navigateTo(item.path!)"
              >
                <component :is="item.icon" class="nav-icon" />
                <span class="nav-label">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User Profile Footer -->
      <div class="sidebar-footer">
        <div class="user-pill" @click="toggleUserMenu">
          <AppAvatar
            :name="authStore.fullName"
            size="md"
          />
          <div class="user-info">
            <span class="user-name">{{ authStore.fullName }}</span>
            <span class="user-email">{{ authStore.user?.email || 'admin@example.com' }}</span>
          </div>
        </div>

        <!-- User Popover Menu -->
        <Transition name="fade">
          <div v-if="showUserMenu" class="user-popover">
            <button type="button" class="popover-item" @click="navigateTo('/profile'); showUserMenu = false">
              <User class="popover-icon" />
              <span>Profile & Security</span>
            </button>
            <div class="popover-divider"></div>
            <button type="button" class="popover-item is-danger" @click="handleLogout">
              <LogOut class="popover-icon" />
              <span>Sign Out</span>
            </button>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- Main Content Canvas -->
    <main class="main-canvas">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-canvas);
}

/* Sidebar Styling */
.sidebar {
  width: 256px;
  min-width: 256px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-card);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
  user-select: none;
}

/* Brand Header */
.brand-header {
  padding: 20px 20px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.brand-badge {
  width: 36px;
  height: 36px;
  background: var(--primary-gradient);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.3);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.brand-role {
  font-size: 11px;
  color: var(--text-subtle);
  font-weight: 500;
}

/* Sidebar Search */
.sidebar-search {
  padding: 4px 18px 14px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: var(--radius-md);
  padding: 0 8px 0 10px;
  height: 34px;
}

.search-icon {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  margin-right: 6px;
}

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 12.5px;
  color: var(--text-main);
}
.search-input::placeholder {
  color: #94a3b8;
}

.shortcut-key {
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 600;
  color: #94a3b8;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 5px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.04);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  padding: 0 10px 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.06em;
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-button:hover {
  background-color: #f8fafc;
  color: var(--text-main);
}

.nav-button.is-active {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
}

.nav-button.is-active .nav-icon {
  color: #4f46e5;
}

.nav-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: color 0.15s ease;
}

.nav-label {
  flex: 1;
  text-align: left;
}

/* Submenu Styling */
.nav-group {
  display: flex;
  flex-direction: column;
}

.submenu-container {
  padding-left: 14px;
  margin-left: 20px;
  border-left: 1.5px solid #e2e8f0;
  margin-top: 2px;
  margin-bottom: 4px;
}

.submenu-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.submenu-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px;
  border-radius: var(--radius-sm, 6px);
  color: #64748b;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
  background: transparent;
  border: none;
}

.submenu-button:hover {
  color: #0f172a;
  background-color: #f8fafc;
}

.submenu-button.is-active {
  color: #4f46e5;
  font-weight: 700;
  background-color: #eef2ff;
}

.submenu-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #cbd5e1;
  transition: all 0.15s ease;
}

.submenu-button:hover .submenu-dot {
  background-color: #94a3b8;
}

.submenu-button.is-active .submenu-dot {
  background-color: #4f46e5;
  transform: scale(1.2);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.submenu-label {
  flex: 1;
  text-align: left;
}

/* Sidebar Footer (User Pill) */
.sidebar-footer {
  position: relative;
  padding: 14px 16px;
  border-top: 1px solid var(--border-card);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.user-pill:hover {
  background-color: #f8fafc;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-email {
  font-size: 11px;
  color: var(--text-subtle);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Popover */
.user-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 16px;
  right: 16px;
  background-color: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 6px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 200;
}

.popover-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-main);
}

.popover-item:hover {
  background-color: var(--bg-surface-subtle);
}

.popover-item.is-danger {
  color: var(--danger-text);
}
.popover-item.is-danger:hover {
  background-color: var(--danger-bg);
}

.popover-icon {
  width: 15px;
  height: 15px;
}

.popover-divider {
  height: 1px;
  background-color: var(--border-light);
  margin: 4px 0;
}

/* Main Canvas */
.main-canvas {
  flex: 1;
  background-color: var(--bg-canvas);
  overflow-y: auto;
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
