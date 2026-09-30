<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { authApi } from '@/modules/auth/api/auth.api';
import { useToast } from '@/shared/composables/useToast';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppPasswordInput from '@/shared/components/ui/AppPasswordInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppAvatar from '@/shared/components/ui/AppAvatar.vue';
import {
  User,
  Shield,
  Key,
  Smartphone,
  CheckCircle2,
  Lock,
  Clock,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const toast = useToast();

const activeTab = ref<'personal' | 'security' | 'sessions'>('personal');

// Profile form state
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phoneNumber = ref('');
const profileLoading = ref(false);

// Password form state
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordLoading = ref(false);
const currentPasswordError = ref('');
const newPasswordError = ref('');
const confirmPasswordError = ref('');

onMounted(() => {
  if (authStore.user) {
    firstName.value = authStore.user.first_name || '';
    lastName.value = authStore.user.last_name || '';
    email.value = authStore.user.email || '';
    phoneNumber.value = authStore.user.phone_number || '';
  }
});

const handleUpdateProfile = async () => {
  profileLoading.value = true;
  try {
    await authStore.updateProfile({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      phone_number: phoneNumber.value.trim() || undefined,
    });
    toast.success('Profile updated successfully!');
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Failed to update profile');
  } finally {
    profileLoading.value = false;
  }
};

const handleChangePassword = async () => {
  currentPasswordError.value = '';
  newPasswordError.value = '';
  confirmPasswordError.value = '';

  let valid = true;
  if (!currentPassword.value) {
    currentPasswordError.value = 'Current password is required';
    valid = false;
  }
  if (!newPassword.value || newPassword.value.length < 8) {
    newPasswordError.value = 'New password must be at least 8 characters';
    valid = false;
  }
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match';
    valid = false;
  }
  if (!valid) return;

  passwordLoading.value = true;
  try {
    const res = await authApi.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
    });
    toast.success(res.message || 'Password changed successfully!');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Failed to change password');
  } finally {
    passwordLoading.value = false;
  }
};
</script>

<template>
  <div class="profile-container animate-fade-in">
    <!-- Top Header -->
    <div class="profile-header">
      <div class="user-hero">
        <AppAvatar :name="authStore.fullName" size="lg" />
        <div class="hero-details">
          <h1 class="hero-name">{{ authStore.fullName }}</h1>
          <div class="hero-tags">
            <span class="hero-email">{{ authStore.user?.email }}</span>
            <AppBadge
              v-for="role in authStore.user?.roles"
              :key="role"
              variant="purple"
              size="sm"
            >
              {{ role }}
            </AppBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="profile-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'personal' }"
        @click="activeTab = 'personal'"
      >
        <User class="tab-icon" />
        <span>Personal Info</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'security' }"
        @click="activeTab = 'security'"
      >
        <Key class="tab-icon" />
        <span>Password & Security</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'sessions' }"
        @click="activeTab = 'sessions'"
      >
        <Shield class="tab-icon" />
        <span>Active Sessions</span>
      </button>
    </div>

    <!-- Tab 1: Personal Info -->
    <div v-if="activeTab === 'personal'" class="profile-card">
      <div class="card-head">
        <h2 class="card-title">Personal Information</h2>
        <p class="card-desc">Update your administrator details and contact information.</p>
      </div>

      <form class="profile-form" @submit.prevent="handleUpdateProfile">
        <div class="form-grid">
          <AppInput
            v-model="firstName"
            label="First Name"
            placeholder="John"
            required
          />
          <AppInput
            v-model="lastName"
            label="Last Name"
            placeholder="Doe"
            required
          />
        </div>

        <div class="form-grid">
          <AppInput
            v-model="email"
            label="Email Address"
            disabled
            hint="Email address cannot be modified directly"
          >
            <template #trailing>
              <CheckCircle2 class="verified-icon" />
            </template>
          </AppInput>

          <AppInput
            v-model="phoneNumber"
            label="Phone Number"
            placeholder="+91 98765 43210"
          >
            <template #leading>
              <Smartphone class="input-icon" />
            </template>
          </AppInput>
        </div>

        <div class="form-actions">
          <AppButton type="submit" variant="primary" :loading="profileLoading">
            Save Profile Changes
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Tab 2: Change Password -->
    <div v-else-if="activeTab === 'security'" class="profile-card">
      <div class="card-head">
        <h2 class="card-title">Change Password</h2>
        <p class="card-desc">Ensure your account uses a long, random password for maximum security.</p>
      </div>

      <form class="password-form" @submit.prevent="handleChangePassword">
        <AppPasswordInput
          v-model="currentPassword"
          label="Current Password"
          :error="currentPasswordError"
          required
        />

        <AppPasswordInput
          v-model="newPassword"
          label="New Password"
          :error="newPasswordError"
          hint="Must be at least 8 characters long"
          required
        />

        <AppPasswordInput
          v-model="confirmPassword"
          label="Confirm New Password"
          :error="confirmPasswordError"
          required
        />

        <div class="form-actions">
          <AppButton type="submit" variant="primary" :loading="passwordLoading">
            <template #icon>
              <Lock class="btn-icon" />
            </template>
            Update Password
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Tab 3: Active Sessions -->
    <div v-else class="profile-card">
      <div class="card-head">
        <h2 class="card-title">Active Devices & Sessions</h2>
        <p class="card-desc">You are currently logged into the following active browser sessions.</p>
      </div>

      <div class="sessions-list">
        <div class="session-item">
          <div class="session-icon-box">
            <Shield class="session-icon" />
          </div>
          <div class="session-info">
            <div class="session-title-row">
              <span class="session-device">MacBook Pro (macOS) — Google Chrome</span>
              <AppBadge variant="green" size="sm">Current Session</AppBadge>
            </div>
            <div class="session-meta">
              <span>IP: 127.0.0.1 (Localhost)</span>
              <span>•</span>
              <span class="session-time">
                <Clock class="time-icon" />
                Active now
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 32px;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  background-color: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  box-shadow: var(--shadow-card);
}

.user-hero {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.hero-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-email {
  font-size: 13px;
  color: var(--text-muted);
}

/* Tabs */
.profile-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--border-card);
  padding-bottom: 1px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.is-active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-600);
}

.tab-icon {
  width: 16px;
  height: 16px;
}

/* Card */
.profile-card {
  background-color: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.card-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.profile-form, .password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  padding-top: 8px;
}

.verified-icon {
  width: 16px;
  height: 16px;
  color: #10b981;
}

.input-icon {
  width: 15px;
  height: 15px;
}

.btn-icon {
  width: 15px;
  height: 15px;
}

/* Sessions */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background-color: var(--bg-surface-subtle);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.session-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

.session-icon {
  width: 18px;
  height: 18px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.session-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.session-device {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.session-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  font-weight: 500;
}

.time-icon {
  width: 12px;
  height: 12px;
}
</style>
