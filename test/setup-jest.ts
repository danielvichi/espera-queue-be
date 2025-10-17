// NOTE: this file is loaded by Jest before running any tests
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { checkDatabaseUrlLooksSafe } from './util/checkDatabaseUrlLooksSafe';

let envFileName;
if (process.env.NODE_ENV_IS_CI === 'true') {
  envFileName = '.env.test-ci';
} else {
  envFileName = '.env.test';
}

const dotEnvPath = path.resolve(process.cwd(), '.env');
// in Docker on GCP, `.env` won't exist
const configContent =
  (fs.existsSync(dotEnvPath) && fs.readFileSync(dotEnvPath)) || '';
const testPath = path.resolve(process.cwd(), envFileName);
const configContentTest = fs.readFileSync(testPath);

const config = dotenv.parse(configContent);
const configTest = dotenv.parse(configContentTest);

// dotenv is so popular that many libraries just load .env files even when you don't want it to
// https://www.prisma.io/docs/orm/more/development-environment/environment-variables#how-does-prisma-orm-use-environment-variables
// the code below is a safeguard to make sure that the .env.test file will be able to override any value that would be in .env
for (const envVariable of Object.keys(config)) {
  if (!configTest[envVariable]) {
    throw new Error(
      `Your .env file has the following ${envVariable}=${config[envVariable]} but your .env.test file does not have a value for this variable.
      This is potentially dangerous because your tests will fall back to the value in your .env file, which may not be what you want.
      Aborting the tests for safety.
      Please make sure your .env.test file has a value for ${envVariable} or remove it from your .env file.
      `,
    );
  }
}

console.log('====== JEST SETUP ======');
console.log('testPath:', testPath);

// loading .env.test file
dotenv.config({
  path: testPath,
  override: true, // if there is a .env file, this config tells dotenv to override it with values from .env.test
});

// checking DB url is safe
checkDatabaseUrlLooksSafe();

// // We need to set timeout for a higher number, because some transactions or the Flow emulator might take up some time
jest.setTimeout(50000);
