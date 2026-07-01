import { useStore } from '../store/useStore';
import { getCategoryIcon } from '../lib/icons';

export function useCategory(categoryId: string) {
  return useStore((s) => s.categories.find((c) => c.id === categoryId));
}

export function useCategoryIconFor(categoryId: string) {
  const category = useCategory(categoryId);
  return getCategoryIcon(category?.icon ?? '');
}
