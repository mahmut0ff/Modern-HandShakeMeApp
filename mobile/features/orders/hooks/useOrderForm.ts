/**
 * Hook for managing order form state and validation
 */

import { useState, useCallback } from 'react';
import type { OrderFormData, OrderFormErrors } from '../types';

const initialFormData: OrderFormData = {
  category: null,
  subcategory: null,
  required_skills: [],
  title: '',
  description: '',
  city: '',
  address: '',
  hide_address: false,
  budget_type: 'negotiable',
  budget_min: undefined,
  budget_max: undefined,
  start_date: undefined,
  end_date: undefined,
  is_urgent: false,
  is_public: true,
  auto_close_applications: false,
};

export const useOrderForm = (initialData?: Partial<OrderFormData>) => {
  const [formData, setFormData] = useState<OrderFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<OrderFormErrors>({});

  const updateField = useCallback(<K extends keyof OrderFormData>(
    field: K,
    value: OrderFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field as keyof OrderFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof OrderFormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: OrderFormErrors = {};

    if (!formData.category) {
      newErrors.category = 'Выберите категорию';
    }

    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Заголовок должен содержать минимум 5 символов';
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Описание должно содержать минимум 20 символов';
    }

    if (!formData.city || formData.city.trim().length === 0) {
      newErrors.city = 'Укажите город';
    }

    if (!formData.address || formData.address.trim().length === 0) {
      newErrors.address = 'Укажите адрес';
    }

    if (formData.budget_type === 'fixed' && !formData.budget_min) {
      newErrors.budget_min = 'Укажите бюджет';
    }

    if (formData.budget_type === 'range') {
      if (!formData.budget_min) {
        newErrors.budget_min = 'Укажите минимальный бюджет';
      }
      if (!formData.budget_max) {
        newErrors.budget_max = 'Укажите максимальный бюджет';
      }
      if (formData.budget_min && formData.budget_max && formData.budget_min >= formData.budget_max) {
        newErrors.budget_max = 'Максимальный бюджет должен быть больше минимального';
      }
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (start >= end) {
        newErrors.end_date = 'Дата окончания должна быть позже даты начала';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    setFormData,
    setErrors,
  };
};
