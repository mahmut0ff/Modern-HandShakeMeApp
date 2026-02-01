// Background Check Service - Integration with external providers

import { logger } from '../utils/logger';

export interface BackgroundCheckRequest {
  checkId: string;
  checkType: 'IDENTITY' | 'CRIMINAL' | 'EMPLOYMENT' | 'EDUCATION' | 'COMPREHENSIVE';
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    ssn?: string;
    nationalId?: string;
    passportNumber?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  previousAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fromDate: string;
    toDate: string;
  }>;
  employmentHistory?: Array<{
    employer: string;
    position: string;
    startDate: string;
    endDate?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  }>;
  educationHistory?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationDate: string;
    gpa?: number;
  }>;
  references?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    yearsKnown: number;
  }>;
}

export interface BackgroundCheckStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  details?: any;
  completedAt?: string;
  estimatedCompletionDate?: string;
}

export interface DisputeRequest {
  originalCheckId: string;
  disputeId: string;
  disputeType: 'INCORRECT_INFORMATION' | 'IDENTITY_THEFT' | 'OUTDATED_RECORDS' | 'PROCESSING_ERROR' | 'OTHER';
  disputedItems: Array<{
    category: string;
    field: string;
    currentValue: string;
    correctValue: string;
    explanation: string;
  }>;
  description: string;
  supportingDocuments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    description?: string;
  }>;
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  urgentRequest: boolean;
}

export class BackgroundCheckService {
  private apiKey: string;
  private baseUrl: string;
  private provider: string;

  constructor() {
    this.apiKey = process.env.BACKGROUND_CHECK_API_KEY || '';
    this.baseUrl = process.env.BACKGROUND_CHECK_API_URL || 'https://api.backgroundcheck.com/v1';
    this.provider = process.env.BACKGROUND_CHECK_PROVIDER || 'checkr'; // checkr, sterling, etc.
  }

  async submitCheck(request: BackgroundCheckRequest): Promise<string> {
    try {
      logger.info('Submitting background check to external service', { 
        checkId: request.checkId,
        checkType: request.checkType,
        provider: this.provider 
      });

      // Transform request based on provider
      const providerRequest = this.transformRequestForProvider(request);

      const response = await fetch(`${this.baseUrl}/checks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'HandShakeMe/1.0',
        },
        body: JSON.stringify(providerRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Background check submission failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      const externalCheckId = this.extractCheckId(result);

      logger.info('Background check submitted successfully', { 
        checkId: request.checkId,
        externalCheckId,
        provider: this.provider 
      });

      return externalCheckId;

    } catch (error) {
      logger.error('Failed to submit background check', { 
        checkId: request.checkId,
        error: error.message 
      });
      throw error;
    }
  }

  async getCheckStatus(externalCheckId: string): Promise<BackgroundCheckStatus> {
    try {
      logger.info('Getting background check status', { externalCheckId, provider: this.provider });

      const response = await fetch(`${this.baseUrl}/checks/${externalCheckId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'HandShakeMe/1.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Status check failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      const status = this.transformStatusFromProvider(result);

      logger.info('Background check status retrieved', { 
        externalCheckId,
        status: status.status,
        provider: this.provider 
      });

      return status;

    } catch (error) {
      logger.error('Failed to get background check status', { 
        externalCheckId,
        error: error.message 
      });
      throw error;
    }
  }

  async submitDispute(request: DisputeRequest): Promise<string> {
    try {
      logger.info('Submitting background check dispute', { 
        disputeId: request.disputeId,
        originalCheckId: request.originalCheckId,
        provider: this.provider 
      });

      const providerRequest = this.transformDisputeForProvider(request);

      const response = await fetch(`${this.baseUrl}/disputes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'HandShakeMe/1.0',
        },
        body: JSON.stringify(providerRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Dispute submission failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      const externalDisputeId = this.extractDisputeId(result);

      logger.info('Background check dispute submitted successfully', { 
        disputeId: request.disputeId,
        externalDisputeId,
        provider: this.provider 
      });

      return externalDisputeId;

    } catch (error) {
      logger.error('Failed to submit background check dispute', { 
        disputeId: request.disputeId,
        error: error.message 
      });
      throw error;
    }
  }

  async getDisputeStatus(externalDisputeId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/disputes/${externalDisputeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'HandShakeMe/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Dispute status check failed: ${response.status}`);
      }

      const result = await response.json();
      return this.transformDisputeStatusFromProvider(result);

    } catch (error) {
      logger.error('Failed to get dispute status', { externalDisputeId, error: error.message });
      throw error;
    }
  }

  private transformRequestForProvider(request: BackgroundCheckRequest): any {
    switch (this.provider) {
      case 'checkr':
        return this.transformForCheckr(request);
      case 'sterling':
        return this.transformForSterling(request);
      default:
        return this.transformForGeneric(request);
    }
  }

  private transformForCheckr(request: BackgroundCheckRequest): any {
    const packages = this.getCheckrPackages(request.checkType);
    
    return {
      candidate: {
        first_name: request.personalInfo.firstName,
        last_name: request.personalInfo.lastName,
        middle_name: request.personalInfo.middleName,
        email: `candidate-${request.checkId}@handshakeme.com`, // Placeholder email
        phone: '555-0000', // Placeholder phone
        zipcode: request.address.zipCode,
        dob: request.personalInfo.dateOfBirth,
        ssn: request.personalInfo.ssn,
        driver_license_number: request.personalInfo.nationalId,
        driver_license_state: request.address.state,
      },
      package: packages[0], // Use first package for now
      tags: [`handshakeme-${request.checkId}`],
    };
  }

  private transformForSterling(request: BackgroundCheckRequest): any {
    return {
      applicant: {
        firstName: request.personalInfo.firstName,
        lastName: request.personalInfo.lastName,
        middleName: request.personalInfo.middleName,
        dateOfBirth: request.personalInfo.dateOfBirth,
        ssn: request.personalInfo.ssn,
        address: {
          line1: request.address.street,
          city: request.address.city,
          state: request.address.state,
          postalCode: request.address.zipCode,
          country: request.address.country,
        },
      },
      screeningType: this.getSterlingScreeningType(request.checkType),
      clientReferenceId: request.checkId,
    };
  }

  private transformForGeneric(request: BackgroundCheckRequest): any {
    return {
      check_type: request.checkType.toLowerCase(),
      personal_info: request.personalInfo,
      address: request.address,
      previous_addresses: request.previousAddresses,
      employment_history: request.employmentHistory,
      education_history: request.educationHistory,
      references: request.references,
      client_reference_id: request.checkId,
    };
  }

  private getCheckrPackages(checkType: string): string[] {
    const packageMap = {
      IDENTITY: ['identity_check'],
      CRIMINAL: ['county_criminal_search', 'national_criminal_search'],
      EMPLOYMENT: ['employment_verification'],
      EDUCATION: ['education_verification'],
      COMPREHENSIVE: ['comprehensive_package'],
    };
    
    return packageMap[checkType as keyof typeof packageMap] || ['basic_package'];
  }

  private getSterlingScreeningType(checkType: string): string {
    const typeMap = {
      IDENTITY: 'IDENTITY_VERIFICATION',
      CRIMINAL: 'CRIMINAL_BACKGROUND',
      EMPLOYMENT: 'EMPLOYMENT_VERIFICATION',
      EDUCATION: 'EDUCATION_VERIFICATION',
      COMPREHENSIVE: 'COMPREHENSIVE_SCREENING',
    };
    
    return typeMap[checkType as keyof typeof typeMap] || 'BASIC_SCREENING';
  }

  private extractCheckId(result: any): string {
    // Extract check ID based on provider response format
    return result.id || result.check_id || result.screening_id || result.uuid;
  }

  private extractDisputeId(result: any): string {
    return result.id || result.dispute_id || result.case_id || result.uuid;
  }

  private transformStatusFromProvider(result: any): BackgroundCheckStatus {
    // Transform provider-specific status to our standard format
    let status: BackgroundCheckStatus['status'] = 'PENDING';
    let checkResult: BackgroundCheckStatus['result'] | undefined;

    // Handle different provider status formats
    if (result.status) {
      const providerStatus = result.status.toLowerCase();
      
      if (['pending', 'submitted', 'queued'].includes(providerStatus)) {
        status = 'PENDING';
      } else if (['in_progress', 'processing', 'running'].includes(providerStatus)) {
        status = 'IN_PROGRESS';
      } else if (['completed', 'finished', 'done'].includes(providerStatus)) {
        status = 'COMPLETED';
        
        // Determine result
        if (result.result) {
          const providerResult = result.result.toLowerCase();
          if (['clear', 'passed', 'approved'].includes(providerResult)) {
            checkResult = 'PASSED';
          } else if (['consider', 'conditional', 'review'].includes(providerResult)) {
            checkResult = 'CONDITIONAL';
          } else {
            checkResult = 'FAILED';
          }
        }
      } else if (['failed', 'error', 'cancelled'].includes(providerStatus)) {
        status = 'FAILED';
      }
    }

    return {
      status,
      result: checkResult,
      details: result.details || result.report || result.findings,
      completedAt: result.completed_at || result.finished_at,
      estimatedCompletionDate: result.estimated_completion_date || result.eta,
    };
  }

  private transformDisputeForProvider(request: DisputeRequest): any {
    return {
      original_check_id: request.originalCheckId,
      dispute_type: request.disputeType.toLowerCase(),
      disputed_items: request.disputedItems,
      description: request.description,
      supporting_documents: request.supportingDocuments,
      contact_info: request.userInfo,
      urgent: request.urgentRequest,
      client_reference_id: request.disputeId,
    };
  }

  private transformDisputeStatusFromProvider(result: any): any {
    return {
      status: result.status,
      resolution: result.resolution,
      updatedAt: result.updated_at,
      estimatedResolutionDate: result.estimated_resolution_date,
      notes: result.notes,
    };
  }

  // Webhook handler for status updates
  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const checkId = this.extractCheckIdFromWebhook(payload);
      const status = this.transformStatusFromProvider(payload);

      logger.info('Background check webhook received', { 
        checkId,
        status: status.status,
        provider: this.provider 
      });

      // Update check status in database
      // This would typically be handled by a separate webhook handler function
      
    } catch (error) {
      logger.error('Failed to process background check webhook', { error: error.message });
      throw error;
    }
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implement signature verification based on provider
    // This is a placeholder - actual implementation would depend on the provider
    return true;
  }

  private extractCheckIdFromWebhook(payload: any): string {
    return payload.check_id || payload.id || payload.screening_id;
  }
}