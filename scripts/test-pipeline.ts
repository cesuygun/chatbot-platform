import { execSync } from 'child_process';
import { platform } from 'os';

const killPort = (port: number) => {
  const isWindows = platform() === 'win32';
  
  try {
    if (isWindows) {
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'ignore' });
      execSync(`taskkill /F /IM node.exe`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -i :${port} | grep LISTEN`, { stdio: 'ignore' });
      execSync(`kill -9 $(lsof -t -i:${port})`, { stdio: 'ignore' });
    }
    console.log(`Port ${port} cleared successfully`);
  } catch (error) {
    // Port is not in use, which is fine
  }
};

const runCommand = (command: string, errorMessage: string) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error);
    return false;
  }
};

const runPipeline = () => {
  console.log('🚀 Starting test pipeline...\n');

  // Step 1: Type checking
  console.log('📝 Running type checking...');
  if (!runCommand('pnpm types', 'Type checking failed')) {
    process.exit(1);
  }
  console.log('✅ Type checking passed\n');

  // Step 2: Linting
  console.log('🔍 Running linting...');
  if (!runCommand('pnpm lint', 'Linting failed')) {
    process.exit(1);
  }
  console.log('✅ Linting passed\n');

  // Step 3: Unit tests
  console.log('🧪 Running unit tests...');
  if (!runCommand('pnpm test', 'Unit tests failed')) {
    process.exit(1);
  }
  console.log('✅ Unit tests passed\n');

  // Step 4: Build
  console.log('🏗️  Running build...');
  if (!runCommand('pnpm build', 'Build failed')) {
    process.exit(1);
  }
  console.log('✅ Build passed\n');

  // Step 5: E2E tests
  console.log('🌐 Running E2E tests...');
  killPort(3000);
  if (!runCommand('pnpm playwright test --reporter=dot --workers=4', 'E2E tests failed')) {
    process.exit(1);
  }
  console.log('✅ E2E tests passed\n');

  console.log('🎉 All tests passed successfully!');
  process.exit(0);
};

runPipeline(); 