import { z } from 'zod';

// Common validation schemas
export const validationSchemas = {
  // User authentication
  phone: z.string()
    .min(10, 'Номер телефона должен содержать минимум 10 цифр')
    .max(15, 'Номер телефона слишком длинный')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат номера телефона'),
  
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль слишком длинный')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать строчные, заглавные буквы и цифры'),
  
  email: z.string()
    .email('Неверный формат email адреса')
    .max(254, 'Email адрес слишком длинный'),
  
  name: z.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя слишком длинное')
    .regex(/^[a-zA-Zа-яА-Я\s-']+$/, 'Имя может содержать только буквы, пробелы и дефисы'),
  
  // Financial
  amount: z.number()
    .positive('Сумма должна быть положительной')
    .max(1000000, 'Сумма слишком большая')
    .multipleOf(0.01, 'Сумма может содержать максимум 2 знака после запятой'),
  
  price: z.number()
    .positive('Цена должна быть положительной')
    .max(100000, 'Цена слишком высокая'),
  
  // Security
  pin: z.string()
    .length(4, 'PIN должен содержать 4 цифры')
    .regex(/^\d{4}$/, 'PIN может содержать только цифры'),
  
  // Content
  title: z.string()
    .min(3, 'Заголовок должен содержать минимум 3 символа')
    .max(100, 'Заголовок слишком длинный')
    .trim(),
  
  description: z.string()
    .min(10, 'Описание должно содержать минимум 10 символов')
    .max(1000, 'Описание слишком длинное')
    .trim(),
  
  shortDescription: z.string()
    .min(5, 'Описание должно содержать минимум 5 символов')
    .max(200, 'Описание слишком длинное')
    .trim(),
  
  // Location
  city: z.string()
    .min(2, 'Название города должно содержать минимум 2 символа')
    .max(50, 'Название города слишком длинное')
    .regex(/^[a-zA-Zа-яА-Я\s-']+$/, 'Название города может содержать только буквы, пробелы и дефисы'),
  
  address: z.string()
    .min(5, 'Адрес должен содержать минимум 5 символов')
    .max(200, 'Адрес слишком длинный'),
  
  // Ratings and reviews
  rating: z.number()
    .min(1, 'Рейтинг должен быть от 1 до 5')
    .max(5, 'Рейтинг должен быть от 1 до 5')
    .int('Рейтинг должен быть целым числом'),
  
  // Time and dates
  workHours: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (ЧЧ:ММ)'),
  
  // File validation
  fileSize: z.number()
    .max(10 * 1024 * 1024, 'Размер файла не должен превышать 10 МБ'), // 10MB
  
  imageSize: z.number()
    .max(5 * 1024 * 1024, 'Размер изображения не должен превышать 5 МБ'), // 5MB
};

// Composite validation schemas
export const compositeSchemas = {
  // User registration
  userRegistration: z.object({
    phone: validationSchemas.phone,
    password: validationSchemas.password,
    firstName: validationSchemas.name,
    lastName: validationSchemas.name,
    email: validationSchemas.email.optional(),
  }),
  
  // User login
  userLogin: z.object({
    phone: validationSchemas.phone,
    password: z.string().min(1, 'Введите пароль'),
  }),
  
  // Profile update
  profileUpdate: z.object({
    firstName: validationSchemas.name.optional(),
    lastName: validationSchemas.name.optional(),
    email: validationSchemas.email.optional(),
    bio: validationSchemas.description.optional(),
    city: validationSchemas.city.optional(),
    address: validationSchemas.address.optional(),
  }),
  
  // Order creation
  orderCreation: z.object({
    title: validationSchemas.title,
    description: validationSchemas.description,
    budget: validationSchemas.amount,
    city: validationSchemas.city,
    address: validationSchemas.address.optional(),
  }),
  
  // Service creation
  serviceCreation: z.object({
    name: validationSchemas.title,
    description: validationSchemas.shortDescription.optional(),
    priceFrom: validationSchemas.price,
    priceTo: validationSchemas.price.optional(),
  }),
  
  // Review creation
  reviewCreation: z.object({
    rating: validationSchemas.rating,
    comment: validationSchemas.description.optional(),
  }),
  
  // Wallet operations
  walletDeposit: z.object({
    amount: validationSchemas.amount,
  }),
  
  walletWithdrawal: z.object({
    amount: validationSchemas.amount,
  }),
  
  // Security
  pinSetup: z.object({
    pin: validationSchemas.pin,
    confirmPin: validationSchemas.pin,
  }).refine((data) => data.pin === data.confirmPin, {
    message: 'PIN коды не совпадают',
    path: ['confirmPin'],
  }),
  
  passwordChange: z.object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: validationSchemas.password,
    confirmPassword: validationSchemas.password,
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  }),
};

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string[]>;
}

// Main validation function
export const validateInput = <T>(
  schema: z.ZodSchema<T>, 
  value: unknown
): ValidationResult => {
  try {
    schema.parse(value);
    return {
      isValid: true,
      errors: [],
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      const errors: string[] = [];
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        const message = err.message;
        
        if (path) {
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(message);
        }
        
        errors.push(message);
      });
      
      return {
        isValid: false,
        errors,
        fieldErrors,
      };
    }
    
    return {
      isValid: false,
      errors: ['Ошибка валидации'],
      fieldErrors: {},
    };
  }
};

// Sanitization functions
export const sanitizeInput = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },
  
  // Sanitize phone number
  phone: (input: string): string => {
    return input.replace(/[^\d+]/g, '');
  },
  
  // Sanitize numeric input
  numeric: (input: string): string => {
    return input.replace(/[^\d.,]/g, '');
  },
  
  // Sanitize text input
  text: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  },
  
  // Sanitize search query
  search: (input: string): string => {
    return input
      .replace(/[<>'"&%]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, 100); // Limit search length
  },
};

// Form validation helpers
export const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
  return (values: unknown) => {
    const result = validateInput(schema, values);
    
    if (result.isValid) {
      return {};
    }
    
    // Convert to format expected by form libraries
    const formErrors: Record<string, string> = {};
    Object.entries(result.fieldErrors).forEach(([field, errors]) => {
      formErrors[field] = errors[0]; // Take first error for each field
    });
    
    return formErrors;
  };
};

// Real-time validation for individual fields
export const validateField = (
  fieldName: string,
  value: unknown,
  schema: z.ZodSchema<any>
): string | null => {
  try {
    // Validate the entire object with just this field
    schema.parse({ [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => 
        err.path.includes(fieldName)
      );
      return fieldError?.message || 'Ошибка валидации';
    }
    return 'Ошибка валидации';
  }
};

// File validation
export const validateFile = (file: {
  size: number;
  type: string;
  name: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('Размер файла не должен превышать 10 МБ');
  }
  
  // Check file type for images
  if (file.type.startsWith('image/')) {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      errors.push('Поддерживаются только форматы: JPEG, PNG, WebP');
    }
    
    // Stricter size limit for images (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('Размер изображения не должен превышать 5 МБ');
    }
  }
  
  // Check file name
  if (file.name.length > 255) {
    errors.push('Имя файла слишком длинное');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors: {},
  };
};

export default {
  schemas: validationSchemas,
  composite: compositeSchemas,
  validate: validateInput,
  sanitize: sanitizeInput,
  createFormValidator,
  validateField,
  validateFile,
};