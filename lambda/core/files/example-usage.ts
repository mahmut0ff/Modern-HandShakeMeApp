/**
 * Example usage of the file processing system
 */

import { validateFilePath, validateFile } from './process-uploaded-file';

// Example 1: Validate file path
async function exampleValidatePath() {
  const validPath = 'uploads/12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/photo.jpg';
  const result = validateFilePath(validPath);
  
  if (result.isValid) {
    console.log('✅ Valid path:', {
      userId: result.userId,
      orderId: result.orderId,
      filename: result.filename
    });
  } else {
    console.log('❌ Invalid path:', result.reason);
  }
}

// Example 2: Validate file (requires S3 access)
async function exampleValidateFile() {
  try {
    const result = await validateFile('my-bucket', 'uploads/user/order/test.jpg');
    
    if (result.isValid) {
      console.log('✅ Valid file:', {
        size: result.fileSize,
        type: result.contentType
      });
    } else {
      console.log('❌ Invalid file:', result.error);
    }
  } catch (error) {
    console.error('Error validating file:', error);
  }
}

// Example 3: Test various path formats
function testPathValidation() {
  const testCases = [
    'uploads/12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/photo.jpg', // Valid
    'uploads/invalid-uuid/87654321-4321-4321-4321-210987654321/photo.jpg', // Invalid userId
    'downloads/12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/photo.jpg', // Wrong prefix
    'uploads/12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/test<script>.jpg', // Dangerous chars
    'uploads/12345678-1234-1234-1234-123456789012/87654321-4321-4321-4321-210987654321/', // No filename
  ];

  testCases.forEach((path, index) => {
    const result = validateFilePath(path);
    console.log(`Test ${index + 1}:`, result.isValid ? '✅ Valid' : `❌ ${result.reason}`);
  });
}

// Run examples
if (require.main === module) {
  console.log('🔍 Testing file path validation...\n');
  
  exampleValidatePath();
  console.log('\n📋 Running test cases...\n');
  testPathValidation();
  
  // Note: File validation example requires AWS credentials and S3 access
  // exampleValidateFile();
}

export { exampleValidatePath, exampleValidateFile, testPathValidation };