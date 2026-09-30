<script setup lang="ts">
import AppToast from '@/shared/components/feedback/AppToast.vue';
</script>

<template>
  <div class="auth-wrapper">
    <AppToast />
    <div class="auth-card-container">
      <div class="auth-brand-header">
        <div class="brand-badge">
          <span class="brand-letter">C</span>
        </div>
        <div class="brand-text">
          <h1 class="brand-title">Confidency OS</h1>
          <p class="brand-subtitle">Superadmin Operations Platform</p>
        </div>
      </div>

      <div class="auth-card">
        <slot />
      </div>

      <div class="auth-footer">
        <p>© 2026 EzzyEcomm Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-canvas);
  background-image: radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.06) 0px, transparent 50%);
  padding: 24px;
}

.auth-card-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.auth-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl);
  padding: 32px 28px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
}

.auth-footer {
  text-align: center;
  font-size: 12px;
  color: var(--text-subtle);
}
</style>
