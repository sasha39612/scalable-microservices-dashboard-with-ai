"use strict";
/**
 * Common validation utilities
 * Reusable validation functions across all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isStrongPassword = isStrongPassword;
exports.isValidUUID = isValidUUID;
exports.isValidURL = isValidURL;
exports.isValidPhoneNumber = isValidPhoneNumber;
exports.isValidDate = isValidDate;
exports.isDateInPast = isDateInPast;
exports.isDateInFuture = isDateInFuture;
exports.isInRange = isInRange;
exports.isValidLength = isValidLength;
exports.isAlphanumeric = isAlphanumeric;
exports.isAlpha = isAlpha;
exports.isNumeric = isNumeric;
exports.sanitizeString = sanitizeString;
exports.hasRequiredFields = hasRequiredFields;
exports.isEmpty = isEmpty;
exports.hasMinLength = hasMinLength;
exports.hasMaxLength = hasMaxLength;
exports.isInAllowedValues = isInAllowedValues;
exports.isValidIPv4 = isValidIPv4;
exports.isValidCreditCard = isValidCreditCard;
exports.isValidJSON = isValidJSON;
exports.isValidUsername = isValidUsername;
exports.isValidSlug = isValidSlug;
exports.generateSlug = generateSlug;
/**
 * Email validation using regex
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Password strength validation
 * Requirements: min 8 chars, at least one uppercase, one lowercase, one number
 */
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return (password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber);
}
/**
 * UUID validation (v4)
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * URL validation
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Phone number validation (international format)
 */
function isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}
/**
 * Date validation
 */
function isValidDate(date) {
    const timestamp = new Date(date).getTime();
    return !isNaN(timestamp);
}
/**
 * Check if date is in the past
 */
function isDateInPast(date) {
    return new Date(date).getTime() < Date.now();
}
/**
 * Check if date is in the future
 */
function isDateInFuture(date) {
    return new Date(date).getTime() > Date.now();
}
/**
 * Number range validation
 */
function isInRange(value, min, max) {
    return value >= min && value <= max;
}
/**
 * String length validation
 */
function isValidLength(str, min, max) {
    if (max !== undefined) {
        return str.length >= min && str.length <= max;
    }
    return str.length >= min;
}
/**
 * Alphanumeric validation
 */
function isAlphanumeric(str) {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(str);
}
/**
 * Check if string contains only letters
 */
function isAlpha(str) {
    const alphaRegex = /^[a-zA-Z]+$/;
    return alphaRegex.test(str);
}
/**
 * Check if string is numeric
 */
function isNumeric(str) {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}
/**
 * Sanitize string (remove special characters)
 */
function sanitizeString(str) {
    return str.replace(/[^\w\s-]/gi, '');
}
/**
 * Validate object has required fields
 */
function hasRequiredFields(obj, requiredFields) {
    return requiredFields.every((field) => obj[field] !== undefined && obj[field] !== null);
}
/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }
    return false;
}
/**
 * Validate array has minimum length
 */
function hasMinLength(arr, minLength) {
    return arr.length >= minLength;
}
/**
 * Validate array has maximum length
 */
function hasMaxLength(arr, maxLength) {
    return arr.length <= maxLength;
}
/**
 * Check if value is within allowed values
 */
function isInAllowedValues(value, allowedValues) {
    return allowedValues.includes(value);
}
/**
 * IP address validation (IPv4)
 */
function isValidIPv4(ip) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}
/**
 * Credit card number validation (Luhn algorithm)
 */
function isValidCreditCard(cardNumber) {
    const sanitized = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(sanitized)) {
        return false;
    }
    let sum = 0;
    let isEven = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
}
/**
 * Validate JSON string
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate username format
 * Requirements: 3-20 chars, alphanumeric, underscores, hyphens
 */
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
}
/**
 * Validate slug format (URL-friendly)
 */
function isValidSlug(slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
}
/**
 * Generate slug from string
 */
function generateSlug(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
