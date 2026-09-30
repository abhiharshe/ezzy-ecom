<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../api/auth.api';
import { useToast } from '@/shared/composables/useToast';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();
const toast = useToast();

const email = ref('admin2@ezzyecomm.com');
const loading = ref(false);
const submitted = ref(false);
const devToken = ref('');
const error = ref('');

const handleSubmit = async () => {
  if (!email.value || !email.value.includes('@')) {
    error.value = 'Please enter a valid email address';
    return;
  }
  error.value = '';
  loading.value = true;

  try {
    const res = await authApi.forgotPassword(email.value);
    submitted.value = true;
    if (res.dev_reset_token) {
      devToken.value = res.dev_reset_token;
    }
    toast.success('Reset link requested successfully');
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Failed to request reset link');
  } finally {
    loading.value = false;
  }
};

const goToResetWithToken = () => {
  router.push({
    path: '/reset-password',
    query: { token: devToken.value },
  });
};
</script>

<template>
  <div class="forgot-view animate-fade-in">
    <div class="view-header">
      <div class="icon-badge">
        <KeyRound class="badge-icon" />
      </div>
      <h2 class="view-title">Forgot password?</h2>
      <p class="view-desc">
        Enter your admin email and we'll send you instructions to reset your password.
      </p>
    </div>

    <!-- Success State -->
    <div v-if="submitted" class="success-box">
      <div class="success-header">
        <CheckCircle2 class="success-icon" />
        <span class="success-title">Check your email</span>
      </div>
      <p class="success-desc">
        We've generated a password reset token for <strong>{{ email }}</strong>.
      </p>

      <!-- Dev Token Fast Action -->
      <div v-if="devToken" class="dev-token-box">
        <span class="dev-label">Development Mode Active Token:</span>
        <code class="dev-token">{{ devToken }}</code>
        <AppButton
          variant="primary"
          size="sm"
          full-width
          @click="goToResetWithToken"
        >
          Proceed to Reset Password →
        </AppButton>
      </div>

      <AppButton
        variant="ghost"
        size="md"
        full-width
        @click="submitted = false"
      >
        Try another email
      </AppButton>
    </div>

    <!-- Form State -->
    <form v-else class="forgot-form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="email"
        label="Email address"
        type="email"
        placeholder="admin@example.com"
        :error="error"
        required
      >
        <template #leading>
          <Mail class="field-icon" />
        </template>
      </AppInput>

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="loading"
      >
        Send Reset Link
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
.forgot-view {
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
  line-height: 1.4;
  max-width: 320px;
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-icon {
  width: 15px;
  height: 15px;
}

.success-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background-color: #f8fafc;
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.success-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
}

.success-icon {
  width: 18px;
  height: 18px;
}

.success-title {
  font-weight: 700;
  font-size: 14px;
}

.success-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.4;
}

.dev-token-box {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dev-label {
  font-size: 11px;
  font-weight: 700;
  color: #4338ca;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dev-token {
  font-family: monospace;
  font-size: 12px;
  background-color: #f1f5f9;
  padding: 4px 6px;
  border-radius: 4px;
  word-break: break-all;
  color: var(--text-main);
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
