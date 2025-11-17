/**
 * Common validation utilities
 * Reusable validation functions across all microservices
 */
/**
 * Email validation using regex
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Password strength validation
 * Requirements: min 8 chars, at least one uppercase, one lowercase, one number
 */
export declare function isStrongPassword(password: string): boolean;
/**
 * UUID validation (v4)
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * URL validation
 */
export declare function isValidURL(url: string): boolean;
/**
 * Phone number validation (international format)
 */
export declare function isValidPhoneNumber(phone: string): boolean;
/**
 * Date validation
 */
export declare function isValidDate(date: string | Date): boolean;
/**
 * Check if date is in the past
 */
export declare function isDateInPast(date: string | Date): boolean;
/**
 * Check if date is in the future
 */
export declare function isDateInFuture(date: string | Date): boolean;
/**
 * Number range validation
 */
export declare function isInRange(value: number, min: number, max: number): boolean;
/**
 * String length validation
 */
export declare function isValidLength(str: string, min: number, max?: number): boolean;
/**
 * Alphanumeric validation
 */
export declare function isAlphanumeric(str: string): boolean;
/**
 * Check if string contains only letters
 */
export declare function isAlpha(str: string): boolean;
/**
 * Check if string is numeric
 */
export declare function isNumeric(str: string): boolean;
/**
 * Sanitize string (remove special characters)
 */
export declare function sanitizeString(str: string): string;
/**
 * Validate object has required fields
 */
export declare function hasRequiredFields<T extends object>(obj: T, requiredFields: (keyof T)[]): boolean;
/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export declare function isEmpty(value: unknown): boolean;
/**
 * Validate array has minimum length
 */
export declare function hasMinLength(arr: unknown[], minLength: number): boolean;
/**
 * Validate array has maximum length
 */
export declare function hasMaxLength(arr: unknown[], maxLength: number): boolean;
/**
 * Check if value is within allowed values
 */
export declare function isInAllowedValues<T>(value: T, allowedValues: T[]): boolean;
/**
 * IP address validation (IPv4)
 */
export declare function isValidIPv4(ip: string): boolean;
/**
 * Credit card number validation (Luhn algorithm)
 */
export declare function isValidCreditCard(cardNumber: string): boolean;
/**
 * Validate JSON string
 */
export declare function isValidJSON(str: string): boolean;
/**
 * Validate username format
 * Requirements: 3-20 chars, alphanumeric, underscores, hyphens
 */
export declare function isValidUsername(username: string): boolean;
/**
 * Validate slug format (URL-friendly)
 */
export declare function isValidSlug(slug: string): boolean;
/**
 * Generate slug from string
 */
export declare function generateSlug(str: string): string;
