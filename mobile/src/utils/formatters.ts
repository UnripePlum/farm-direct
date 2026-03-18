import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR') + '원';
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return format(date, 'yyyy년 MM월 dd일', { locale: ko });
  } catch {
    return dateStr;
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  } catch {
    return dateStr;
  }
};

export const formatWeight = (weight: number): string => {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}kg`;
  }
  return `${weight}g`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
