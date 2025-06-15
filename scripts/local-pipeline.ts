import { execSync } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';

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

const checkEnvironment = () => {
  console.log('🔍 Checking environment...');
  
  // Check for required environment files
  const requiredEnvFiles = ['.env.local', '.env.test'];
  const missingEnvFiles = requiredEnvFiles.filter(file => !existsSync(join(process.cwd(), file)));
  
  if (missingEnvFiles.length > 0) {
    console.error('❌ Missing required environment files:', missingEnvFiles.join(', '));
    console.error('Please create these files with the required environment variables.');
    process.exit(1);
  }

  // Check Node.js version
  const requiredNodeVersion = '20.11.1';
  const currentNodeVersion = process.version;
  if (!currentNodeVersion.includes(requiredNodeVersion)) {
    console.error(`❌ Node.js version mismatch. Required: ${requiredNodeVersion}, Current: ${currentNodeVersion}`);
    process.exit(1);
  }

  console.log('✅ Environment check passed\n');
};

const runLocalPipeline = () => {
  console.log('🚀 Starting local test pipeline...\n');

  // Step 0: Environment check
  checkEnvironment();

  // Step 1: Clean install dependencies
  console.log('📦 Cleaning and installing dependencies...');
  if (!runCommand('pnpm install --force', 'Dependency installation failed')) {
    process.exit(1);
  }
  console.log('✅ Dependencies installed successfully\n');

  // Step 2: Type checking
  console.log('📝 Running type checking...');
  if (!runCommand('pnpm types', 'Type checking failed')) {
    process.exit(1);
  }
  console.log('✅ Type checking passed\n');

  // Step 3: Linting
  console.log('🔍 Running linting...');
  if (!runCommand('pnpm lint', 'Linting failed')) {
    process.exit(1);
  }
  console.log('✅ Linting passed\n');

  // Step 4: Unit tests
  console.log('🧪 Running unit tests...');
  if (!runCommand('pnpm test', 'Unit tests failed')) {
    process.exit(1);
  }
  console.log('✅ Unit tests passed\n');

  // Step 5: Build
  console.log('🏗️  Running build...');
  if (!runCommand('pnpm build', 'Build failed')) {
    process.exit(1);
  }
  console.log('✅ Build passed\n');

  // Step 6: E2E tests
  console.log('🌐 Running E2E tests...');
  killPort(3000);
  if (!runCommand('pnpm playwright test --reporter=dot --workers=4', 'E2E tests failed')) {
    process.exit(1);
  }
  console.log('✅ E2E tests passed\n');

  console.log('🎉 All tests passed successfully!');
  process.exit(0);
};

runLocalPipeline(); 