import { execSync } from 'child_process';
try {
  console.log('Running npm run build...');
  const out = execSync('npm run build', { encoding: 'utf-8' });
  console.log('BUILD SUCCESS:', out);
  
  const fs = require('fs');
  if (fs.existsSync('./dist')) {
    console.log('dist exists. files:', fs.readdirSync('./dist'));
  } else {
    console.log('dist DOES NOT EXIST');
  }
} catch (e) {
  console.log('BUILD FAILED:', e.message);
  console.log('STDOUT:', e.stdout?.toString());
  console.log('STDERR:', e.stderr?.toString());
}
