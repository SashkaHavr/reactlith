import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);
export const CLI_ROOT = path.resolve(distPath, '../');
export const CWD = path.resolve(process.cwd());

// Directories for different package types in the workspace
export const workspacePackageTypes = ['app', 'package', 'tool'] as const;
export const workspacePackageTypeToDir = {
  app: 'apps',
  package: 'packages',
  tool: 'tools',
} as const;
export type WorkspacePackageType = (typeof workspacePackageTypes)[number];

export const appTypes = ['base', 'web', 'api'] as const;
export type AppType = (typeof appTypes)[number];

export const packageTypes = [
  'base',
  'auth',
  'db',
  'trpc',
  'intl',
  'env',
] as const;
export type PackageType = (typeof packageTypes)[number];

export const toolTypes = [
  'base',
  'typescript-config',
  'eslint-config',
  'prettier-config',
] as const;
export type ToolType = (typeof toolTypes)[number];

export const TEMPLATE_MODULE = '@reactlith/templates';
export const TEMPLATE_NAME = 'reactlith-template';
export const TEMPLATE_PACKAGE_NAME = 'reactlith-package';
export const TEMPLATE_INCLUDE_BASE_PATH = 'include';
