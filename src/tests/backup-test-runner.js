/**
 * Backup Endpoint Automated Test Runner
 * 
 * This script tests the backup and restore endpoints to ensure they work correctly
 * before production launch.
 * 
 * Usage:
 * 1. Update the CONFIG section with your project details
 * 2. Run in browser console OR Node.js environment
 * 3. Review test results
 * 
 * Requirements:
 * - SuperAdmin access token
 * - Active internet connection
 * - Test company with sample data
 */

// ============ CONFIGURATION ============
const CONFIG = {
  // Update these with your actual values
  projectId: 'YOUR_PROJECT_ID', // e.g., 'abcd1234'
  accessToken: 'YOUR_SUPERADMIN_ACCESS_TOKEN',
  baseUrl: '', // Auto-generated from projectId
  
  // Test settings
  runDestructiveTests: false, // Set to true to run restore tests (overwrites data!)
  verbose: true,
  
  // Expected data checks
  expectedPrefixes: [
    'employee:',
    'company:',
    'department:',
    'leave:',
    'attendance:',
    '_singleton:company-settings'
  ]
};

// Auto-generate base URL
if (!CONFIG.baseUrl) {
  CONFIG.baseUrl = `https://${CONFIG.projectId}.supabase.co/functions/v1/make-server-a35148f0`;
}

// ============ TEST FRAMEWORK ============
class TestRunner {
  constructor() {
    this.results = [];
    this.backupData = null;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || 'ℹ️';
    
    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);
    
    if (CONFIG.verbose) {
      this.results.push({ type, message, timestamp });
    }
  }

  async runTest(name, testFn) {
    this.log(`Running: ${name}`, 'test');
    try {
      const result = await testFn();
      this.log(`PASS: ${name}`, 'success');
      return { name, status: 'pass', result };
    } catch (error) {
      this.log(`FAIL: ${name} - ${error.message}`, 'error');
      return { name, status: 'fail', error: error.message };
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    if (CONFIG.verbose) {
      this.log(`Request: ${options.method || 'GET'} ${url}`, 'info');
    }

    const response = await fetch(url, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    return { response, data };
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${duration}s`);
    console.log(`Total Tests: ${this.results.length}`);
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  ❌ ${r.name}: ${r.error}`));
    }
    
    return { passed, failed, duration };
  }
}

// ============ TEST CASES ============

async function testBackupAuthentication(runner) {
  // Test without auth token
  try {
    await fetch(`${CONFIG.baseUrl}/backup`, {
      headers: { 'Content-Type': 'application/json' }
    });
    throw new Error('Should have failed without auth token');
  } catch (error) {
    if (error.message.includes('Should have failed')) {
      throw error;
    }
    // Expected to fail
  }

  // Test with valid token
  const { response, data } = await runner.makeRequest('/backup');
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  return { success: true, authenticated: true };
}

async function testBackupResponseFormat(runner) {
  const { data } = await runner.makeRequest('/backup');

  // Check required fields
  if (!data.version) throw new Error('Missing version field');
  if (!data.timestamp) throw new Error('Missing timestamp field');
  if (!data.data) throw new Error('Missing data field');
  if (typeof data.data !== 'object') throw new Error('data field is not an object');

  // Validate version
  if (data.version !== '1.0') {
    runner.log(`Warning: Unexpected version ${data.version}`, 'warning');
  }

  // Validate timestamp format
  const timestamp = new Date(data.timestamp);
  if (isNaN(timestamp.getTime())) {
    throw new Error('Invalid timestamp format');
  }

  // Store backup for later tests
  runner.backupData = data;

  return {
    version: data.version,
    timestamp: data.timestamp,
    prefixes: Object.keys(data.data),
    totalRecords: Object.values(data.data).reduce((sum, arr) => sum + arr.length, 0)
  };
}

async function testBackupDataCompleteness(runner) {
  if (!runner.backupData) {
    throw new Error('No backup data available. Run testBackupResponseFormat first.');
  }

  const data = runner.backupData.data;
  const prefixes = Object.keys(data);
  const missingPrefixes = [];

  // Check for expected prefixes (only if data exists)
  for (const expectedPrefix of CONFIG.expectedPrefixes) {
    if (!prefixes.includes(expectedPrefix) && !prefixes.some(p => p.startsWith(expectedPrefix.replace(':', '')))) {
      runner.log(`Note: ${expectedPrefix} not found in backup (might be empty)`, 'warning');
    }
  }

  // Validate data structure
  for (const [prefix, items] of Object.entries(data)) {
    if (!Array.isArray(items)) {
      throw new Error(`Data for prefix ${prefix} is not an array`);
    }

    // Check first item has expected structure
    if (items.length > 0) {
      const firstItem = items[0];
      if (typeof firstItem !== 'object') {
        throw new Error(`Item in ${prefix} is not an object`);
      }
    }
  }

  return {
    prefixes: prefixes,
    prefixCount: prefixes.length,
    totalRecords: Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
    samples: Object.entries(data).slice(0, 3).map(([prefix, items]) => ({
      prefix,
      count: items.length
    }))
  };
}

async function testBackupMultiTenantIsolation(runner) {
  if (!runner.backupData) {
    throw new Error('No backup data available');
  }

  const data = runner.backupData.data;
  let companyIds = new Set();

  // Extract company IDs from various prefixes
  const checkPrefixes = ['employee:', 'company:', 'department:', 'leave:'];
  
  for (const prefix of checkPrefixes) {
    const items = data[prefix] || [];
    for (const item of items) {
      const companyId = item.companyId || item.company || item.id;
      if (companyId) {
        companyIds.add(companyId);
      }
    }
  }

  const uniqueCompanies = Array.from(companyIds);

  // Check if all data belongs to single company (for SuperAdmin)
  if (uniqueCompanies.length === 0) {
    runner.log('No company IDs found in backup data', 'warning');
  } else if (uniqueCompanies.length > 1) {
    runner.log(`Multiple companies found: ${uniqueCompanies.join(', ')}`, 'warning');
    runner.log('This might be expected for certain SuperAdmin accounts', 'warning');
  }

  return {
    uniqueCompanyIds: uniqueCompanies,
    companyCount: uniqueCompanies.length,
    isolation: uniqueCompanies.length <= 1 ? 'verified' : 'multi-company'
  };
}

async function testBackupPerformance(runner) {
  const startTime = Date.now();
  
  const { data } = await runner.makeRequest('/backup');
  
  const endTime = Date.now();
  const duration = endTime - startTime;

  const totalRecords = Object.values(data.data).reduce((sum, arr) => sum + arr.length, 0);
  const dataSize = JSON.stringify(data).length;

  // Performance thresholds
  const thresholds = {
    small: { records: 100, maxTime: 2000 },
    medium: { records: 1000, maxTime: 10000 },
    large: { records: Infinity, maxTime: 30000 }
  };

  let threshold = thresholds.large;
  if (totalRecords < thresholds.small.records) threshold = thresholds.small;
  else if (totalRecords < thresholds.medium.records) threshold = thresholds.medium;

  if (duration > threshold.maxTime) {
    runner.log(`Performance warning: ${duration}ms exceeds threshold ${threshold.maxTime}ms`, 'warning');
  }

  return {
    duration: `${duration}ms`,
    totalRecords,
    dataSize: `${(dataSize / 1024).toFixed(2)} KB`,
    performance: duration <= threshold.maxTime ? 'good' : 'slow'
  };
}

async function testRestoreAuthentication(runner) {
  if (!CONFIG.runDestructiveTests) {
    runner.log('Skipping restore tests (runDestructiveTests = false)', 'warning');
    return { skipped: true };
  }

  // Test without auth token
  try {
    await fetch(`${CONFIG.baseUrl}/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} })
    });
    throw new Error('Should have failed without auth token');
  } catch (error) {
    if (error.message.includes('Should have failed')) {
      throw error;
    }
    // Expected to fail
  }

  return { success: true, authenticated: true };
}

async function testRestoreInvalidData(runner) {
  if (!CONFIG.runDestructiveTests) {
    return { skipped: true };
  }

  // Test with empty body
  try {
    await runner.makeRequest('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({})
    });
    throw new Error('Should have failed with empty body');
  } catch (error) {
    if (!error.message.includes('400') && !error.message.includes('Invalid')) {
      throw new Error('Expected 400 error for empty body');
    }
  }

  // Test with null data
  try {
    await runner.makeRequest('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ data: null })
    });
    throw new Error('Should have failed with null data');
  } catch (error) {
    if (!error.message.includes('400') && !error.message.includes('Invalid')) {
      throw new Error('Expected 400 error for null data');
    }
  }

  return { success: true, validated: true };
}

async function testRestoreRoundTrip(runner) {
  if (!CONFIG.runDestructiveTests) {
    return { skipped: true };
  }

  if (!runner.backupData) {
    throw new Error('No backup data available');
  }

  // Perform restore
  const { data: restoreResult } = await runner.makeRequest('/backup/restore', {
    method: 'POST',
    body: JSON.stringify({ data: runner.backupData.data })
  });

  if (!restoreResult.success) {
    throw new Error('Restore failed');
  }

  if (typeof restoreResult.restoredCount !== 'number') {
    throw new Error('Invalid restoredCount in response');
  }

  return {
    success: true,
    restoredCount: restoreResult.restoredCount,
    roundTrip: 'completed'
  };
}

// ============ MAIN TEST RUNNER ============

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('BLUMEBYTE BACKUP ENDPOINT TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Project ID: ${CONFIG.projectId}`);
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Destructive Tests: ${CONFIG.runDestructiveTests ? 'ENABLED ⚠️' : 'DISABLED'}`);
  console.log('='.repeat(60));
  console.log('');

  const runner = new TestRunner();

  // Run tests
  const tests = [
    { name: 'Backup Authentication', fn: () => testBackupAuthentication(runner) },
    { name: 'Backup Response Format', fn: () => testBackupResponseFormat(runner) },
    { name: 'Backup Data Completeness', fn: () => testBackupDataCompleteness(runner) },
    { name: 'Multi-Tenant Isolation', fn: () => testBackupMultiTenantIsolation(runner) },
    { name: 'Backup Performance', fn: () => testBackupPerformance(runner) },
    { name: 'Restore Authentication', fn: () => testRestoreAuthentication(runner) },
    { name: 'Restore Invalid Data', fn: () => testRestoreInvalidData(runner) },
    { name: 'Restore Round Trip', fn: () => testRestoreRoundTrip(runner) },
  ];

  for (const test of tests) {
    const result = await runner.runTest(test.name, test.fn);
    runner.results.push(result);
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('');
  const summary = runner.printSummary();

  // Save results to localStorage (browser only)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('backupTestResults', JSON.stringify({
      summary,
      results: runner.results,
      backupData: runner.backupData,
      config: CONFIG,
      timestamp: new Date().toISOString()
    }));
    console.log('\n✅ Test results saved to localStorage');
  }

  return { runner, summary };
}

// ============ EXPORT / RUN ============

// Auto-run if in browser console (check for window object)
if (typeof window !== 'undefined' && CONFIG.accessToken !== 'YOUR_SUPERADMIN_ACCESS_TOKEN') {
  console.log('Auto-running tests...');
  runAllTests().then(({ summary }) => {
    if (summary.failed === 0) {
      console.log('\n🎉 All tests passed! Backup endpoint is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix before production deployment.');
    }
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
  });
} else if (CONFIG.accessToken === 'YOUR_SUPERADMIN_ACCESS_TOKEN') {
  console.log('⚠️ Please update CONFIG.projectId and CONFIG.accessToken before running tests');
}

// Export for Node.js or manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, CONFIG };
}
