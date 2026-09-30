<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi } from '../api/auth.api';
import { useToast } from '@/shared/composables/useToast';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppPasswordInput from '@/shared/components/ui/AppPasswordInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import { Lock, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const tokenError = ref('');
const passwordError = ref('');
const confirmError = ref('');

onMounted(() => {
  if (route.query.token && typeof route.query.token === 'string') {
    token.value = route.query.token;
  }
});

const validate = () => {
  let valid = true;
  tokenError.value = '';
  passwordError.value = '';
  confirmError.value = '';

  if (!token.value.trim()) {
    tokenError.value = 'Reset token is required';
    valid = false;
  }
  if (!newPassword.value || newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    valid = false;
  }
  if (newPassword.value !== confirmPassword.value) {
    confirmError.value = 'Passwords do not match';
    valid = false;
  }
  return valid;
};

const handleReset = async () => {
  if (!validate()) return;
  loading.value = true;

  try {
    const res = await authApi.resetPassword({
      token: token.value.trim(),
      new_password: newPassword.value,
    });

    toast.success(res.message || 'Password successfully reset!');
    router.push('/login');
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Failed to reset password');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="reset-view animate-fade-in">
    <div class="view-header">
      <div class="icon-badge">
        <Lock class="badge-icon" />
      </div>
      <h2 class="view-title">Set new password</h2>
      <p class="view-desc">
        Create a strong password for your superadmin account.
      </p>
    </div>

    <form class="reset-form" @submit.prevent="handleReset">
      <AppInput
        v-model="token"
        label="Reset Token"
        placeholder="Enter or paste token"
        :error="tokenError"
        required
      >
        <template #leading>
          <KeyRound class="field-icon" />
        </template>
      </AppInput>

      <AppPasswordInput
        v-model="newPassword"
        label="New Password"
        :error="passwordError"
        hint="Minimum 8 characters with letters and numbers"
        required
      />

      <AppPasswordInput
        v-model="confirmPassword"
        label="Confirm New Password"
        :error="confirmError"
        required
      />

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="loading"
      >
        <template #icon>
          <ShieldCheck class="btn-icon" />
        </template>
        Reset Password
      </AppButton>
    </form>

    <div class="back-footer">
      <router-link to="/login" class="back-link">
        <ArrowLeft class="back-icon" />
        Back to Sign In
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.reset-view {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.view-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background-color: var(--primary-50);
  color: var(--primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.badge-icon {
  width: 22px;
  height: 22px;
}

.view-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.view-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-icon {
  width: 15px;
  height: 15px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.back-footer {
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}
.back-link:hover {
  color: var(--text-main);
}

.back-icon {
  width: 14px;
  height: 14px;
}
</style>
