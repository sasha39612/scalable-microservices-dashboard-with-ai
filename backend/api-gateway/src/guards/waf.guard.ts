/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

/**
 * Web Application Firewall (WAF) Guard
 * Provides protection against common web vulnerabilities:
 * - SQL Injection
 * - XSS attacks
 * - Path traversal
 * - Command injection
 * - LDAP injection
 * - NoSQL injection
 */
@Injectable()
export class WafGuard implements CanActivate {
  // SQL injection patterns
  private readonly sqlInjectionPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC|EXECUTE|INSERT|MERGE|SELECT|UPDATE|UNION|INTO|FROM|WHERE)\b)/gi,
    /('|(\\')|("|\\")|(;|\\;))/gi,
    /((\%27)|(\')|((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3B)|(;))))/gi,
    /((\%27)|(\'))union/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
  ];

  // XSS patterns
  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<.*?style\s*=.*?expression\s*\(/gi,
  ];

  // Path traversal patterns
  private readonly pathTraversalPatterns = [
    /\.\.\//gi,
    /\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e/gi,
    /\.\.%2f/gi,
    /%2e%2e%5c/gi,
  ];

  // Command injection patterns
  private readonly commandInjectionPatterns = [
    /(\||\&|\;|\$|\`)/gi,
    /(nc |ncat |netcat |curl |wget )/gi,
    /(chmod |chown |rm |mv |cp )/gi,
  ];

  // LDAP injection patterns
  private readonly ldapInjectionPatterns = [
    /(\)|(\%29))((\&)|(\%26))((\w)|(\%\w))/gi,
    /(\)|(\%29))((\|)|(\%7C))((\w)|(\%\w))/gi,
  ];

  // NoSQL injection patterns
  private readonly nosqlInjectionPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$or/gi,
    /\$and/gi,
  ];

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if WAF is disabled for this route
    const isWafDisabled = this.reflector.get<boolean>('disable-waf', context.getHandler());
    if (isWafDisabled) {
      return true;
    }

    const request = this.getRequest(context);
    const body = request.body;
    const query = request.query;
    const params = request.params;
    const headers = request.headers;

    try {
      // Check request body
      if (body) {
        this.scanObject(body, 'request body');
      }

      // Check query parameters
      if (query) {
        this.scanObject(query, 'query parameters');
      }

      // Check URL parameters
      if (params) {
        this.scanObject(params, 'URL parameters');
      }

      // Check headers for suspicious content
      if (headers) {
        this.scanHeaders(headers);
      }

      // Check for suspicious file uploads
      this.checkFileUploads(request);

      // Check request size limits
      this.checkRequestSize(request);

      return true;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Request blocked by Web Application Firewall',
          error: 'WAF_BLOCKED',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getRequest(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    
    if (ctx && ctx.req) {
      return ctx.req;
    }
    
    return context.switchToHttp().getRequest();
  }

  private scanObject(obj: any, location: string): void {
    if (typeof obj === 'string') {
      this.scanString(obj, location);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          this.scanString(key, `${location} key`);
          this.scanObject(obj[key], location);
        }
      }
    }
  }

  private scanString(input: string, location: string): void {
    if (!input || typeof input !== 'string') return;

    const decodedInput = this.decodeInput(input);

    // Check for SQL injection
    if (this.matchesPatterns(decodedInput, this.sqlInjectionPatterns)) {
      throw new Error(`SQL injection detected in ${location}`);
    }

    // Check for XSS
    if (this.matchesPatterns(decodedInput, this.xssPatterns)) {
      throw new Error(`XSS attack detected in ${location}`);
    }

    // Check for path traversal
    if (this.matchesPatterns(decodedInput, this.pathTraversalPatterns)) {
      throw new Error(`Path traversal detected in ${location}`);
    }

    // Check for command injection
    if (this.matchesPatterns(decodedInput, this.commandInjectionPatterns)) {
      throw new Error(`Command injection detected in ${location}`);
    }

    // Check for LDAP injection
    if (this.matchesPatterns(decodedInput, this.ldapInjectionPatterns)) {
      throw new Error(`LDAP injection detected in ${location}`);
    }

    // Check for NoSQL injection
    if (this.matchesPatterns(decodedInput, this.nosqlInjectionPatterns)) {
      throw new Error(`NoSQL injection detected in ${location}`);
    }
  }

  private decodeInput(input: string): string {
    try {
      // Decode URL encoding
      let decoded = decodeURIComponent(input);
      // Decode HTML entities
      decoded = decoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
      return decoded;
    } catch {
      return input;
    }
  }

  private matchesPatterns(input: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(input));
  }

  private scanHeaders(headers: any): void {
    const suspiciousHeaders = ['user-agent', 'referer', 'origin'];
    
    for (const headerName of suspiciousHeaders) {
      const headerValue = headers[headerName];
      if (headerValue && typeof headerValue === 'string') {
        this.scanString(headerValue, `header ${headerName}`);
      }
    }

    // Check for suspicious custom headers
    for (const [name, value] of Object.entries(headers)) {
      if (typeof value === 'string' && name.toLowerCase().startsWith('x-')) {
        this.scanString(value, `header ${name}`);
      }
    }
  }

  private checkFileUploads(request: any): void {
    if (request.files) {
      const files = Array.isArray(request.files) ? request.files : [request.files];
      
      for (const file of files) {
        if (file && file.originalname) {
          // Check for suspicious file extensions
          const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
          const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
          
          if (suspiciousExtensions.includes(fileExtension)) {
            throw new Error(`Suspicious file upload detected: ${file.originalname}`);
          }
          
          // Check file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File too large: ${file.originalname}`);
          }
        }
      }
    }
  }

  private checkRequestSize(request: any): void {
    const maxBodySize = 1024 * 1024; // 1MB
    
    if (request.headers['content-length']) {
      const contentLength = parseInt(request.headers['content-length'], 10);
      if (contentLength > maxBodySize) {
        throw new Error('Request body too large');
      }
    }
  }
}