/**
 * Example usage and testing of GDPR functions
 */

import { GDPRUtils } from '../shared/utils/gdpr';
import { GDPRRepository } from '../shared/repositories/gdpr.repository';

// Example 1: Test GDPR utilities
function testGDPRUtils() {
  console.log('🔍 Testing GDPR utilities...\n');
  
  const userId = '12345678-1234-1234-1234-123456789012';
  
  // Test anonymized email generation
  const anonymizedEmail = GDPRUtils.generateAnonymizedEmail(userId);
  console.log('✅ Anonymized email:', anonymizedEmail);
  
  // Test anonymized ID generation
  const anonymizedId = GDPRUtils.generateAnonymizedId();
  console.log('✅ Anonymized ID:', anonymizedId);
  
  // Test retention period calculation
  const retentionUntil = GDPRUtils.calculateRetentionUntil();
  console.log('✅ Retention until:', retentionUntil);
  
  // Test deletion eligibility validation
  const eligibility = GDPRUtils.validateDeletionEligibility([], 0);
  console.log('✅ Can delete (no obstacles):', eligibility.canDelete);
  
  const eligibilityWithObstacles = GDPRUtils.validateDeletionEligibility([{ id: '1' }], 100);
  console.log('❌ Can delete (with obstacles):', eligibilityWithObstacles.canDelete);
  console.log('   Reasons:', eligibilityWithObstacles.reasons);
  
  // Test anonymized user data creation
  const anonymizedData = GDPRUtils.createAnonymizedUserData(userId);
  console.log('✅ Anonymized user data:', {
    email: anonymizedData.email,
    firstName: anonymizedData.firstName,
    isDeleted: anonymizedData.isDeleted
  });
  
  // Test export request validation
  const validExport = GDPRUtils.validateExportRequest(['profile', 'orders'], false);
  console.log('✅ Valid export request:', validExport.isValid);
  
  const invalidExport = GDPRUtils.validateExportRequest(['invalid_section'], false);
  console.log('❌ Invalid export request:', invalidExport.isValid);
  console.log('   Errors:', invalidExport.errors);
  
  // Test operation ID generation
  const operationId = GDPRUtils.generateOperationId('DELETE_ACCOUNT', userId);
  console.log('✅ Operation ID:', operationId);
}

// Example 2: Test data sanitization
function testDataSanitization() {
  console.log('\n🧹 Testing data sanitization...\n');
  
  const sensitiveData = {
    id: '123',
    email: 'user@example.com',
    passwordHash: 'secret_hash',
    internalNotes: 'admin notes',
    publicInfo: 'this is public',
    nested: {
      passwordHash: 'another_secret',
      normalField: 'normal value'
    },
    arrayData: [
      { passwordHash: 'secret1', name: 'item1' },
      { passwordHash: 'secret2', name: 'item2' }
    ]
  };
  
  const sanitized = GDPRUtils.sanitizeForExport(sensitiveData);
  console.log('✅ Original data keys:', Object.keys(sensitiveData));
  console.log('✅ Sanitized data keys:', Object.keys(sanitized));
  console.log('✅ Password hash removed:', !sanitized.passwordHash);
  console.log('✅ Internal notes removed:', !sanitized.internalNotes);
  console.log('✅ Public info preserved:', !!sanitized.publicInfo);
  console.log('✅ Nested sanitization:', !sanitized.nested?.passwordHash);
  console.log('✅ Array sanitization:', !sanitized.arrayData?.[0]?.passwordHash);
}

// Example 3: Test file reference extraction
function testFileReferenceExtraction() {
  console.log('\n📁 Testing file reference extraction...\n');
  
  const userData = {
    id: 'user123',
    avatar: 'https://bucket.s3.amazonaws.com/users/user123/avatar.jpg',
    portfolio: [
      {
        id: 'portfolio1',
        images: [
          'https://bucket.s3.amazonaws.com/portfolio/image1.jpg',
          'https://bucket.s3.amazonaws.com/portfolio/image2.jpg'
        ]
      }
    ],
    orders: [
      {
        id: 'order1',
        attachments: [
          'https://bucket.s3.amazonaws.com/orders/attachment1.pdf'
        ]
      }
    ]
  };
  
  const fileReferences = GDPRUtils.extractFileReferences(userData);
  console.log('✅ Extracted file references:', fileReferences.length);
  console.log('   Avatar files:', fileReferences.filter(f => f.category === 'avatar').length);
  console.log('   Portfolio files:', fileReferences.filter(f => f.category === 'portfolio').length);
  console.log('   Order attachment files:', fileReferences.filter(f => f.category === 'order_attachment').length);
}

// Example 4: Test GDPR logging
function testGDPRLogging() {
  console.log('\n📝 Testing GDPR logging...\n');
  
  const userId = 'user123';
  
  // Test successful operation logging
  GDPRUtils.logGDPROperation('DELETE_ACCOUNT', userId, {
    reviewsAnonymized: 5,
    messagesDeleted: 20,
    filesDeleted: 3
  }, true);
  
  // Test failed operation logging
  GDPRUtils.logGDPROperation('EXPORT_DATA', userId, {
    sections: ['profile', 'orders']
  }, false, new Error('Database connection failed'));
  
  console.log('✅ GDPR operations logged (check console output above)');
}

// Example 5: Environment validation
function testEnvironmentValidation() {
  console.log('\n🔧 Testing environment validation...\n');
  
  const requiredEnvVars = [
    'DYNAMODB_TABLE_NAME',
    'AWS_S3_BUCKET',
    'SNS_PUSH_TOPIC_ARN',
    'SNS_ADMIN_ALERT_TOPIC_ARN',
    'FROM_EMAIL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:', missingVars);
    console.log('   Set these for full GDPR functionality');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Test GDPR salt
  if (!process.env.GDPR_SALT) {
    console.log('⚠️  GDPR_SALT not set - using default (not recommended for production)');
  } else {
    console.log('✅ GDPR_SALT is configured');
  }
}

// Run all tests
if (require.main === module) {
  console.log('🧪 GDPR System Testing\n');
  console.log('='.repeat(50));
  
  testGDPRUtils();
  testDataSanitization();
  testFileReferenceExtraction();
  testGDPRLogging();
  testEnvironmentValidation();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 GDPR testing completed!');
  console.log('\nNote: These are utility tests. Full integration tests require:');
  console.log('- DynamoDB table setup');
  console.log('- S3 bucket configuration');
  console.log('- SNS topics setup');
  console.log('- SES email configuration');
}

export { 
  testGDPRUtils, 
  testDataSanitization, 
  testFileReferenceExtraction, 
  testGDPRLogging,
  testEnvironmentValidation 
};