const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 East Texas Hot Tub Integration Setup 🔧');
console.log('=========================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'temp-env-example.txt');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('ℹ️  Creating .env file from temp-env-example.txt...');
  
  try {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExampleContent);
    console.log('✅ .env file created. Please edit it with your actual credentials.');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('ℹ️  Please manually create a .env file using temp-env-example.txt as a template.');
  }
} else {
  console.log('✅ .env file exists');
}

// Check if required packages are installed
console.log('\nChecking required packages...');
try {
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('❌ node_modules not found. Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('✅ node_modules found');
  }
} catch (error) {
  console.error('❌ Error checking/installing packages:', error.message);
}

console.log('\n📋 Integration Setup Checklist:');
console.log('1. Edit the .env file with your actual credentials');
console.log('2. Ensure your QuickBooks API is properly configured');
console.log('3. Make sure your Supabase project is set up');
console.log('4. Configure your Slack app with the appropriate permissions');

console.log('\n🚀 To sync QuickBooks data to Supabase:');
console.log('   npm run sync');

console.log('\n🤖 To test a natural language query:');
console.log('   npm run query -- "What was our revenue last month?"');

console.log('\n💬 To simulate a Slack message:');
console.log('   npm run slack -- "Show me products with margin over 20%"');

console.log('\n📚 For more information, check the README.md file.\n'); 