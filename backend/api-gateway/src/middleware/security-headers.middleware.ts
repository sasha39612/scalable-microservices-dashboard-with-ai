/* eslint-disable @typescript-eslint/no-explicit-any */

import { Injectable, NestMiddleware } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Security Headers Middleware
 * Configures various security headers to protect against common attacks
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly helmetMiddleware = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // GraphQL Playground needs unsafe-eval
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disabled for GraphQL Playground compatibility

    // Cross Origin Opener Policy  
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },

    // Cross Origin Resource Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },

    // Frameguard
    frameguard: {
      action: 'deny'
    },

    // Hide Powered-By header
    hidePoweredBy: true,

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // IE No Open
    ieNoOpen: true,

    // No Sniff
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permitted Cross Domain Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },

    // Referrer Policy
    referrerPolicy: {
      policy: ['no-referrer', 'strict-origin-when-cross-origin']
    },

    // X-XSS-Protection
    xssFilter: true,
  });

  use(req: any, res: any, next: any) {
    // Apply Helmet security headers
    this.helmetMiddleware(req, res, (helmetErr: any) => {
      if (helmetErr) return next(helmetErr);

      // Add custom security headers
      this.setCustomHeaders(res);
      
      // Add GraphQL-specific headers for development
      if (process.env.NODE_ENV === 'development') {
        this.setDevelopmentHeaders(res);
      }

      next();
    });
  }

  private setCustomHeaders(res: any) {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Feature Policy (Permissions Policy)
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // Clear Site Data (for logout endpoints)
    if (res.req?.path?.includes('logout')) {
      res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    }

    // Expect-CT header for Certificate Transparency
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }
  }

  private setDevelopmentHeaders(res: any) {
    // Relax some policies for development
    res.setHeader('X-Development-Mode', 'true');
    
    // Allow GraphQL Playground in development
    const csp = res.getHeader('Content-Security-Policy') as string;
    if (csp && res.req?.path?.includes('graphql')) {
      const relaxedCSP = csp.replace(
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes'"
      );
      res.setHeader('Content-Security-Policy', relaxedCSP);
    }
  }
}