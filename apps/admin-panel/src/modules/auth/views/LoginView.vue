<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppPasswordInput from '@/shared/components/ui/AppPasswordInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppSwitch from '@/shared/components/ui/AppSwitch.vue';
import { Mail, ShieldCheck } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const email = ref('admin2@ezzyecomm.com');
const password = ref('Password123!');
const rememberMe = ref(true);
const emailError = ref('');
const passwordError = ref('');

const validate = () => {
  let valid = true;
  emailError.value = '';
  passwordError.value = '';

  if (!email.value || !email.value.includes('@')) {
    emailError.value = 'Please enter a valid email address';
    valid = false;
  }
  if (!password.value || password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters';
    valid = false;
  }
  return valid;
};

const handleLogin = async () => {
  if (!validate()) return;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    toast.success(`Welcome back, ${authStore.fullName}!`);
    router.push('/overview');
  } catch (err: unknown) {
    toast.error((err as Error).message || 'Invalid email or password');
  }
};
</script>

<template>
  <div class="login-view animate-fade-in">
    <div class="view-header">
      <h2 class="view-title">Welcome back</h2>
      <p class="view-desc">Sign in to your Superadmin platform</p>
    </div>

    <form class="login-form" @submit.prevent="handleLogin">
      <AppInput
        v-model="email"
        label="Email address"
        type="email"
        placeholder="admin@example.com"
        :error="emailError"
        required
      >
        <template #leading>
          <Mail class="field-icon" />
        </template>
      </AppInput>

      <AppPasswordInput
        v-model="password"
        label="Password"
        :error="passwordError"
        required
      >
        <template #label-action>
          <router-link to="/forgot-password" class="forgot-link">
            Forgot password?
          </router-link>
        </template>
      </AppPasswordInput>

      <div class="remember-row">
        <AppSwitch v-model="rememberMe" label="Remember this device" />
      </div>

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="authStore.loading"
      >
        <template #icon>
          <ShieldCheck class="btn-icon" />
        </template>
        Sign In to Superadmin
      </AppButton>
    </form>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-header {
  text-align: center;
}

.view-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.view-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.forgot-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-600);
}
.forgot-link:hover {
  text-decoration: underline;
}

.remember-row {
  display: flex;
  align-items: center;
  margin: -2px 0 6px;
}

.field-icon {
  width: 15px;
  height: 15px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}
</style>
