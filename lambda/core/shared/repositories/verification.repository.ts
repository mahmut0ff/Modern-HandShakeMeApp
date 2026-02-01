// Verification Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface VerificationDocument {
  id: string;
  type: 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'CERTIFICATE' | 'DIPLOMA' | 'OTHER';
  url: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface MasterVerification {
  id: string;
  userId: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  documents: VerificationDocument[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class VerificationRepository {
  async create(data: Partial<MasterVerification>): Promise<MasterVerification> {
    const verification: MasterVerification = {
      id: uuidv4(),
      userId: data.userId!,
      status: data.status || 'PENDING',
      documents: data.documents || [],
      notes: data.notes,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt,
      verifiedAt: data.verifiedAt,
      rejectionReason: data.rejectionReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      ...Keys.verification(verification.id),
      ...verification,
      GSI1PK: `USER#${verification.userId}`,
      GSI1SK: 'VERIFICATION',
      GSI2PK: `STATUS#${verification.status}`,
      GSI2SK: `${verification.createdAt}#${verification.id}`,
    });
    
    return verification;
  }
  
  async findById(verificationId: string): Promise<MasterVerification | null> {
    const item = await getItem(Keys.verification(verificationId));
    return item as MasterVerification | null;
  }
  
  async findByUserId(userId: string): Promise<MasterVerification | null> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'VERIFICATION',
      },
    });
    
    return items[0] as MasterVerification | null;
  }
  
  async getOrCreateVerification(userId: string): Promise<MasterVerification> {
    let verification = await this.findByUserId(userId);
    
    if (!verification) {
      verification = await this.create({ userId });
    }
    
    return verification;
  }
  
  async update(verificationId: string, data: Partial<MasterVerification>): Promise<MasterVerification> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined) {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    const updated = await updateItem({
      Key: Keys.verification(verificationId),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as MasterVerification;
  }
  
  async addDocument(
    verificationId: string,
    document: Omit<VerificationDocument, 'id' | 'uploadedAt' | 'status'>
  ): Promise<MasterVerification> {
    const verification = await this.findById(verificationId);
    if (!verification) {
      throw new Error('Verification not found');
    }
    
    const newDocument: VerificationDocument = {
      id: uuidv4(),
      ...document,
      uploadedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    
    const updatedDocuments = [...verification.documents, newDocument];
    
    return this.update(verificationId, {
      documents: updatedDocuments,
    });
  }
  
  async updateDocumentStatus(
    verificationId: string,
    documentId: string,
    status: VerificationDocument['status'],
    notes?: string
  ): Promise<MasterVerification> {
    const verification = await this.findById(verificationId);
    if (!verification) {
      throw new Error('Verification not found');
    }
    
    const updatedDocuments = verification.documents.map(doc => 
      doc.id === documentId 
        ? { ...doc, status, notes }
        : doc
    );
    
    return this.update(verificationId, {
      documents: updatedDocuments,
    });
  }
  
  async submitForReview(verificationId: string): Promise<MasterVerification> {
    const verification = await this.findById(verificationId);
    if (!verification) {
      throw new Error('Verification not found');
    }
    
    // Check if has required documents
    const hasRequiredDocs = verification.documents.some(doc => 
      ['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE'].includes(doc.type)
    );
    
    if (!hasRequiredDocs) {
      throw new Error('At least one identity document is required');
    }
    
    return this.update(verificationId, {
      status: 'IN_REVIEW',
    });
  }
  
  async approve(
    verificationId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<MasterVerification> {
    return this.update(verificationId, {
      status: 'APPROVED',
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      notes,
    });
  }
  
  async reject(
    verificationId: string,
    reviewedBy: string,
    rejectionReason: string,
    notes?: string
  ): Promise<MasterVerification> {
    return this.update(verificationId, {
      status: 'REJECTED',
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      rejectionReason,
      notes,
    });
  }
  
  async findByStatus(status: string, limit = 50): Promise<MasterVerification[]> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `STATUS#${status}`,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as MasterVerification[];
  }
}