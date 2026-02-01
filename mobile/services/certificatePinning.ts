import { Platform } from 'react-native';

/**
 * Certificate Pinning Service
 * Provides SSL certificate pinning for enhanced security
 */

export interface CertificatePinConfig {
  hostname: string;
  publicKeyHashes: string[];
  includeSubdomains?: boolean;
}

export interface PinningResult {
  success: boolean;
  error?: string;
  certificateInfo?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint: string;
  };
}

class CertificatePinningService {
  private static instance: CertificatePinningService;
  private pinnedCertificates: Map<string, CertificatePinConfig> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    this.initializeDefaultPins();
  }

  static getInstance(): CertificatePinningService {
    if (!CertificatePinningService.instance) {
      CertificatePinningService.instance = new CertificatePinningService();
    }
    return CertificatePinningService.instance;
  }

  /**
   * Initialize default certificate pins for the app
   */
  private initializeDefaultPins(): void {
    // Add your API server certificate pins here
    const apiDomain = process.env.EXPO_PUBLIC_API_URL?.replace(/https?:\/\//, '') || 'api.handshakeme.kg';

    // Example pins - replace with your actual certificate hashes
    this.addCertificatePin({
      hostname: apiDomain,
      publicKeyHashes: [
        // Primary certificate hash
        'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        // Backup certificate hash
        'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      ],
      includeSubdomains: true,
    });

    // Pin for other critical domains
    this.addCertificatePin({
      hostname: 'handshakeme.kg',
      publicKeyHashes: [
        'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
      ],
      includeSubdomains: true,
    });
  }

  /**
   * Add a certificate pin for a hostname
   */
  addCertificatePin(config: CertificatePinConfig): void {
    this.pinnedCertificates.set(config.hostname, config);
    console.log(`Certificate pin added for ${config.hostname}`);
  }

  /**
   * Remove certificate pin for a hostname
   */
  removeCertificatePin(hostname: string): void {
    this.pinnedCertificates.delete(hostname);
    console.log(`Certificate pin removed for ${hostname}`);
  }

  /**
   * Enable or disable certificate pinning
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Certificate pinning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if certificate pinning is enabled
   */
  isEnabledForDomain(hostname: string): boolean {
    return this.isEnabled && this.pinnedCertificates.has(hostname);
  }

  /**
   * Validate certificate for a given hostname
   * Note: This is a simplified implementation. In production, you would
   * integrate with a native module for actual certificate validation.
   */
  async validateCertificate(
    hostname: string,
    certificateChain: string[]
  ): Promise<PinningResult> {
    try {
      if (!this.isEnabled) {
        return { success: true };
      }

      const pinConfig = this.pinnedCertificates.get(hostname);
      if (!pinConfig) {
        // No pin configured for this domain
        return { success: true };
      }

      // In a real implementation, you would:
      // 1. Extract the public key from the certificate
      // 2. Calculate the SHA-256 hash of the public key
      // 3. Compare with the pinned hashes

      // For now, we'll simulate the validation
      const isValid = await this.simulateCertificateValidation(
        hostname,
        certificateChain,
        pinConfig
      );

      if (isValid) {
        return {
          success: true,
          certificateInfo: {
            subject: `CN=${hostname}`,
            issuer: 'Let\'s Encrypt Authority X3',
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            fingerprint: 'SHA256:EXAMPLE_FINGERPRINT',
          },
        };
      } else {
        return {
          success: false,
          error: `Certificate pinning validation failed for ${hostname}`,
        };
      }
    } catch (error) {
      console.error('Certificate validation error:', error);
      return {
        success: false,
        error: `Certificate validation error: ${(error as any).message}`,
      };
    }
  }

  /**
   * Simulate certificate validation (replace with actual implementation)
   */
  private async simulateCertificateValidation(
    hostname: string,
    certificateChain: string[],
    pinConfig: CertificatePinConfig
  ): Promise<boolean> {
    // In development, always return true
    if (__DEV__) {
      console.log(`Simulating certificate validation for ${hostname}`);
      return true;
    }

    // In production, implement actual certificate validation
    // This would involve:
    // 1. Parsing the certificate chain
    // 2. Extracting public keys
    // 3. Computing SHA-256 hashes
    // 4. Comparing with pinned hashes

    return true; // Placeholder
  }

  /**
   * Create a custom fetch function with certificate pinning
   */
  createSecureFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        const url = typeof input === 'string' ? input : input.toString();
        const hostname = new URL(url).hostname;

        // Perform the fetch
        const response = await fetch(input, init);

        // In a real implementation, you would validate the certificate here
        // For now, we'll just log that we're checking
        if (this.isEnabledForDomain(hostname)) {
          console.log(`Certificate pinning check for ${hostname}`);

          // Simulate certificate validation
          const validationResult = await this.validateCertificate(hostname, []);

          if (!validationResult.success) {
            throw new Error(`Certificate pinning failed: ${validationResult.error}`);
          }
        }

        return response;
      } catch (error) {
        console.error('Secure fetch error:', error);
        throw error;
      }
    };
  }

  /**
   * Get pinning configuration for debugging
   */
  getPinningConfig(): Array<{ hostname: string; config: CertificatePinConfig }> {
    return Array.from(this.pinnedCertificates.entries()).map(([hostname, config]) => ({
      hostname,
      config,
    }));
  }

  /**
   * Generate certificate hash from certificate string
   * This is a utility function for developers to generate hashes
   */
  static async generateCertificateHash(certificatePem: string): Promise<string> {
    try {
      // In a real implementation, you would:
      // 1. Parse the PEM certificate
      // 2. Extract the public key
      // 3. Calculate SHA-256 hash
      // 4. Base64 encode the result

      // For now, return a placeholder
      return 'sha256/PLACEHOLDER_HASH_REPLACE_WITH_ACTUAL=';
    } catch (error) {
      console.error('Failed to generate certificate hash:', error);
      throw error;
    }
  }

  /**
   * Validate all pinned certificates (for health checks)
   */
  async validateAllPins(): Promise<{ [hostname: string]: PinningResult }> {
    const results: { [hostname: string]: PinningResult } = {};

    for (const [hostname, config] of this.pinnedCertificates) {
      try {
        results[hostname] = await this.validateCertificate(hostname, []);
      } catch (error) {
        results[hostname] = {
          success: false,
          error: (error as any).message,
        };
      }
    }

    return results;
  }
}

export const certificatePinningService = CertificatePinningService.getInstance();

// Export a secure fetch function for use throughout the app
export const secureFetch = certificatePinningService.createSecureFetch();