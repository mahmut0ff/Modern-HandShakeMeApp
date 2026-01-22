/**
 * Enum converter utilities for converting between UPPERCASE (database) and lowercase (mobile/API)
 * Database uses UPPERCASE enums, Mobile app expects lowercase enums
 */

/**
 * Configuration of all enum fields in the system
 * Maps field names to their possible UPPERCASE enum values
 */
export const ENUM_FIELDS: Record<string, string[]> = {
  // User enums
  role: ['MASTER', 'CLIENT', 'ADMIN'],
  
  // Order enums
  budgetType: ['FIXED', 'RANGE', 'NEGOTIABLE'],
  status: ['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'NEW', 'REVIEW', 'REVISION', 'ARCHIVED', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED', 'PENDING', 'RESERVED', 'REFUNDED', 'FAILED', 'APPROVED', 'UNDER_REVIEW', 'VERIFIED'],
  
  // File enums
  fileType: ['PHOTO', 'DOCUMENT'],
  
  // Application enums
  applicationStatus: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'],
  
  // Project enums
  projectStatus: ['NEW', 'IN_PROGRESS', 'REVIEW', 'REVISION', 'COMPLETED', 'ARCHIVED'],
  priority: ['LOW', 'MEDIUM', 'HIGH'],
  
  // Message enums
  messageType: ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM'],
  
  // Notification enums
  notificationType: ['NEW_MESSAGE', 'NEW_APPLICATION', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'PROJECT_STATUS', 'NEW_ORDER', 'DEADLINE_REMINDER', 'NEW_REVIEW', 'PAYMENT', 'SYSTEM'],
  
  // Transaction enums
  type: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'FEE', 'RESERVATION', 'COMMISSION'],
  transactionStatus: ['PENDING', 'RESERVED', 'COMPLETED', 'REFUNDED', 'FAILED', 'CANCELLED'],
  transactionType: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'FEE', 'RESERVATION', 'COMMISSION'],
  
  // Withdrawal enums
  withdrawalStatus: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
  
  // Dispute enums
  reason: ['QUALITY_ISSUES', 'PAYMENT_DISPUTE', 'COMMUNICATION_PROBLEMS', 'DEADLINE_MISSED', 'SCOPE_DISAGREEMENT', 'CANCELLATION_REQUEST', 'OTHER'],
  disputeReason: ['QUALITY_ISSUES', 'PAYMENT_DISPUTE', 'COMMUNICATION_PROBLEMS', 'DEADLINE_MISSED', 'SCOPE_DISAGREEMENT', 'CANCELLATION_REQUEST', 'OTHER'],
  disputeStatus: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'],
  resolution: ['FULL_REFUND', 'PARTIAL_REFUND', 'PAY_MASTER', 'NO_ACTION'],
  
  // Service enums
  unit: ['HOUR', 'SQM', 'PIECE', 'PROJECT', 'DAY'],
  serviceUnit: ['HOUR', 'SQM', 'PIECE', 'PROJECT', 'DAY'],
  
  // Verification enums
  verificationStatus: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
};

/**
 * Convert a single enum value from UPPERCASE to lowercase
 * Handles snake_case enums (e.g., QUALITY_ISSUES -> quality_issues)
 */
export function enumToLowercase(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return value.toLowerCase();
}

/**
 * Convert a single enum value from lowercase to UPPERCASE
 * Handles snake_case enums (e.g., quality_issues -> QUALITY_ISSUES)
 */
export function enumToUppercase(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return value.toUpperCase();
}

/**
 * Detect if a field is likely an enum field based on naming patterns
 * Checks for common enum field name patterns
 */
function isLikelyEnumField(key: string): boolean {
  const enumPatterns = [
    /status$/i,
    /type$/i,
    /role$/i,
    /priority$/i,
    /reason$/i,
    /resolution$/i,
    /unit$/i,
  ];
  
  return enumPatterns.some(pattern => pattern.test(key));
}

/**
 * Recursively convert enum values from UPPERCASE to lowercase in an object
 * Uses ENUM_FIELDS configuration and automatic detection
 */
export function convertEnumsToLowercase(
  obj: any,
  enumFields: string[] = Object.keys(ENUM_FIELDS),
  seen = new WeakSet()
): any {
  // Preserve null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertEnumsToLowercase(item, enumFields, seen));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    seen.add(obj);
    const converted: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        // Check if this field is a known enum field or matches enum patterns
        const isEnumField = enumFields.includes(key) || isLikelyEnumField(key);
        
        if (isEnumField && typeof value === 'string') {
          // Convert enum value to lowercase
          converted[key] = enumToLowercase(value);
        } else if (typeof value === 'object') {
          // Recursively convert nested objects
          converted[key] = convertEnumsToLowercase(value, enumFields, seen);
        } else {
          // Keep other values as-is
          converted[key] = value;
        }
      }
    }
    
    return converted;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Recursively convert enum values from lowercase to UPPERCASE in an object
 * Uses ENUM_FIELDS configuration and automatic detection
 */
export function convertEnumsToUppercase(
  obj: any,
  enumFields: string[] = Object.keys(ENUM_FIELDS),
  seen = new WeakSet()
): any {
  // Preserve null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertEnumsToUppercase(item, enumFields, seen));
  }

  // Handle plain objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    seen.add(obj);
    const converted: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        // Check if this field is a known enum field or matches enum patterns
        const isEnumField = enumFields.includes(key) || isLikelyEnumField(key);
        
        if (isEnumField && typeof value === 'string') {
          // Convert enum value to UPPERCASE
          converted[key] = enumToUppercase(value);
        } else if (typeof value === 'object') {
          // Recursively convert nested objects
          converted[key] = convertEnumsToUppercase(value, enumFields, seen);
        } else {
          // Keep other values as-is
          converted[key] = value;
        }
      }
    }
    
    return converted;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Check if a value is a valid enum value for a given field
 */
export function isValidEnumValue(field: string, value: string): boolean {
  const enumValues = ENUM_FIELDS[field];
  if (!enumValues) {
    return false;
  }
  
  const upperValue = value.toUpperCase();
  return enumValues.includes(upperValue);
}

/**
 * Get all valid enum values for a field in lowercase
 */
export function getEnumValues(field: string): string[] {
  const enumValues = ENUM_FIELDS[field];
  if (!enumValues) {
    return [];
  }
  
  return enumValues.map(v => v.toLowerCase());
}
