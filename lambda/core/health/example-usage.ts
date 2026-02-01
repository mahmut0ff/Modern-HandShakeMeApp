/**
 * Example usage and testing of Health Check system
 */

import { HealthUtils } from '../shared/utils/health';
import { HealthChecksService } from '../shared/services/health-checks.service';

// Example 1: Test health utilities
function testHealthUtils() {
  console.log('🔍 Testing Health utilities...\n');
  
  // Test configuration validation
  const configChecks = [
    { name: 'Test Required', envVar: 'NODE_ENV', required: true },
    { name: 'Test Optional', envVar: 'OPTIONAL_VAR', required: false },
    { name: 'Test JWT Secret', envVar: 'JWT_SECRET', required: true, validator: HealthUtils.isValidJwtSecret },
    { name: 'Test URL', envVar: 'TEST_URL', required: false, validator: HealthUtils.isValidUrl }
  ];
  
  const configResult = HealthUtils.checkConfiguration(configChecks);
  console.log('✅ Configuration check:', configResult.status);
  console.log('   Message:', configResult.message);
  console.log('   Details:', configResult.details);
  
  // Test memory check
  const memoryResult = HealthUtils.checkMemoryUsage();
  console.log('✅ Memory check:', memoryResult.status);
  console.log('   Message:', memoryResult.message);
  
  // Test validators
  console.log('✅ URL validator (valid):', HealthUtils.isValidUrl('https://example.com'));
  console.log('❌ URL validator (invalid):', HealthUtils.isValidUrl('not-a-url'));
  console.log('✅ JWT secret validator (valid):', HealthUtils.isValidJwtSecret('a'.repeat(32)));
  console.log('❌ JWT secret validator (invalid):', HealthUtils.isValidJwtSecret('short'));
  console.log('✅ AWS ARN validator (valid):', HealthUtils.isValidAwsArn('arn:aws:sns:us-east-1:123456789012:topic'));
  console.log('❌ AWS ARN validator (invalid):', HealthUtils.isValidAwsArn('invalid-arn'));
  
  // Test overall status determination
  const checks = {
    service1: { status: 'pass' as const, lastChecked: new Date().toISOString() },
    service2: { status: 'warn' as const, lastChecked: new Date().toISOString() },
    service3: { status: 'pass' as const, lastChecked: new Date().toISOString() }
  };
  
  const overallStatus = HealthUtils.determineOverallStatus(checks);
  console.log('✅ Overall status (with warnings):', overallStatus);
  
  // Test application version detection
  const version = HealthUtils.getApplicationVersion();
  console.log('✅ Application version:', version);
}

// Example 2: Test timeout functionality
async function testTimeoutFunctionality() {
  console.log('\n⏱️ Testing timeout functionality...\n');
  
  // Test successful operation within timeout
  try {
    const result = await HealthUtils.executeWithTimeout(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return 'success';
      },
      1000, // 1 second timeout
      'fast-operation'
    );
    console.log('✅ Fast operation completed:', result);
  } catch (error: any) {
    console.log('❌ Fast operation failed:', error.message);
  }
  
  // Test operation that times out
  try {
    const result = await HealthUtils.executeWithTimeout(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        return 'success';
      },
      1000, // 1 second timeout
      'slow-operation'
    );
    console.log('✅ Slow operation completed:', result);
  } catch (error: any) {
    console.log('❌ Slow operation timed out (expected):', error.message);
  }
}

// Example 3: Test health checks service (requires AWS credentials)
async function testHealthChecksService() {
  console.log('\n🏥 Testing Health Checks Service...\n');
  
  try {
    const service = new HealthChecksService();
    
    // Test configuration check
    console.log('Testing configuration validation...');
    const configResult = HealthUtils.checkConfiguration([
      { name: 'Node Environment', envVar: 'NODE_ENV', required: false },
      { name: 'AWS Region', envVar: 'AWS_REGION', required: false }
    ]);
    console.log('Configuration check result:', configResult.status);
    
    // Note: Actual AWS service checks require proper credentials and configuration
    console.log('Note: AWS service checks require proper credentials and environment setup');
    console.log('- Database check needs DYNAMODB_TABLE_NAME');
    console.log('- Storage check needs AWS_S3_BUCKET');
    console.log('- Notifications check needs SNS_PUSH_TOPIC_ARN');
    
  } catch (error: any) {
    console.log('Health checks service test failed (expected without AWS setup):', error.message);
  }
}

// Example 4: Test Lambda metadata extraction
function testLambdaMetadata() {
  console.log('\n🔧 Testing Lambda metadata extraction...\n');
  
  // Mock Lambda context
  const mockContext = {
    memoryLimitInMB: '512',
    getRemainingTimeInMillis: () => 30000,
    functionName: 'test-function',
    functionVersion: '1'
  };
  
  const metadata = HealthUtils.getLambdaMetadata(mockContext as any);
  console.log('✅ Lambda metadata:', {
    memoryLimit: metadata.lambdaMemoryLimit,
    memoryUsed: metadata.lambdaMemoryUsed,
    remainingTime: metadata.lambdaRemainingTime,
    functionName: metadata.functionName,
    nodeVersion: metadata.nodeVersion
  });
}

// Example 5: Test HTTP response utilities
function testHttpResponseUtils() {
  console.log('\n🌐 Testing HTTP response utilities...\n');
  
  // Test status code mapping
  console.log('✅ Healthy status code:', HealthUtils.getHttpStatusCode('healthy'));
  console.log('✅ Degraded status code:', HealthUtils.getHttpStatusCode('degraded'));
  console.log('✅ Unhealthy status code:', HealthUtils.getHttpStatusCode('unhealthy'));
  
  // Test simple response creation
  const healthyResponse = HealthUtils.createSimpleResponse(true);
  console.log('✅ Healthy simple response:', {
    statusCode: healthyResponse.statusCode,
    body: healthyResponse.body,
    headers: healthyResponse.headers
  });
  
  const unhealthyResponse = HealthUtils.createSimpleResponse(false);
  console.log('❌ Unhealthy simple response:', {
    statusCode: unhealthyResponse.statusCode,
    body: unhealthyResponse.body
  });
}

// Example 6: Environment validation
function testEnvironmentValidation() {
  console.log('\n🔧 Testing environment validation...\n');
  
  const requiredEnvVars = [
    'DYNAMODB_TABLE_NAME',
    'AWS_S3_BUCKET',
    'JWT_SECRET',
    'AWS_REGION'
  ];
  
  const optionalEnvVars = [
    'SNS_PUSH_TOPIC_ARN',
    'FROM_EMAIL',
    'TELEGRAM_BOT_TOKEN',
    'YANDEX_MAPS_API_KEY'
  ];
  
  console.log('Required environment variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${varName}: ${value ? 'SET' : 'MISSING'}`);
  });
  
  console.log('\nOptional environment variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚠️';
    console.log(`  ${status} ${varName}: ${value ? 'SET' : 'NOT SET'}`);
  });
  
  // Test default configuration
  const config = HealthUtils.getDefaultConfig();
  console.log('\n✅ Default configuration loaded:');
  console.log('  Timeouts:', config.timeouts);
  console.log('  Thresholds:', config.thresholds);
  console.log('  External checks enabled:', config.enableExternalChecks);
  console.log('  Detailed checks enabled:', config.enableDetailedChecks);
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Health Check System Testing\n');
  console.log('='.repeat(60));
  
  testHealthUtils();
  await testTimeoutFunctionality();
  await testHealthChecksService();
  testLambdaMetadata();
  testHttpResponseUtils();
  testEnvironmentValidation();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Health check testing completed!');
  console.log('\nFor full integration testing, ensure:');
  console.log('- AWS credentials are configured');
  console.log('- DynamoDB table exists');
  console.log('- S3 bucket is accessible');
  console.log('- SNS topics are configured');
  console.log('- External API keys are set');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { 
  testHealthUtils,
  testTimeoutFunctionality,
  testHealthChecksService,
  testLambdaMetadata,
  testHttpResponseUtils,
  testEnvironmentValidation,
  runAllTests
};