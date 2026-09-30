import { ref } from 'vue';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export function useToast() {
  const show = (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: ToastItem = {
      id,
      duration: 4000,
      ...toast,
    };

    toasts.value.push(item);

    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        remove(id);
      }, item.duration);
    }

    return id;
  };

  const success = (message: string, title = 'Success') => show({ type: 'success', message, title });
  const error = (message: string, title = 'Error') => show({ type: 'error', message, title, duration: 6000 });
  const info = (message: string, title = 'Info') => show({ type: 'info', message, title });
  const warning = (message: string, title = 'Warning') => show({ type: 'warning', message, title });

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    remove,
  };
}
