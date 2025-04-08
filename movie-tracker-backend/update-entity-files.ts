#!/usr/bin/env ts-node
/**
 * This script updates all entity files to use consistent column naming conventions.
 * It maps camelCase entity properties to snake_case database columns.
 * 
 * Usage:
 * 1. Make sure you've installed ts-node: npm install -g ts-node
 * 2. Run: ts-node update-entity-files.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const rootDir = path.resolve(__dirname, 'src');
const modulesDir = path.resolve(rootDir, 'modules');

// Utility to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Function to find all TypeScript files in a directory recursively
async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await findTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to find all entity files
async function findEntityFiles(): Promise<string[]> {
  const allFiles = await findTsFiles(modulesDir);
  return allFiles.filter(file => file.includes('entity.ts'));
}

// Function to update column decorators in entity files
async function updateEntityFile(filePath: string): Promise<void> {
  console.log(`Processing: ${filePath}`);
  
  let content = await readFile(filePath, 'utf8');
  let modified = false;

  // Regular expressions to match different patterns that need updating
  
  // Pattern 1: @Column() propertyInCamelCase: Type;
  // Replace with: @Column({ name: 'property_in_snake_case' }) propertyInCamelCase: Type;
  const simpleColumnRegex = /@Column\(\)\s+(\w+):/g;
  content = content.replace(simpleColumnRegex, (match, propName) => {
    if (propName === 'id' || propName === 'name' || propName === 'content' || propName === 'description' || propName === 'thumbnail' || propName === 'email' || propName === 'username' || propName === 'title' || propName === 'overview' || propName === 'runtime' || propName === 'rating' || propName === 'notes' || propName === 'order' || propName === 'key' || propName === 'value' || propName === 'message' || propName === 'reason' || propName === 'action' || propName === 'type') {
      // These common field names are the same in camelCase and snake_case
      return match;
    }
    
    modified = true;
    const snakeCaseProp = toSnakeCase(propName);
    return `@Column({ name: '${snakeCaseProp}' }) ${propName}:`;
  });

  // Pattern 2: @Column({ /* other props */ }) propertyInCamelCase: Type;
  // Replace with: @Column({ /* other props */, name: 'property_in_snake_case' }) propertyInCamelCase: Type;
  const complexColumnRegex = /@Column\(\{\s*([^}]*)\s*\}\)\s+(\w+):/g;
  content = content.replace(complexColumnRegex, (match, options, propName) => {
    if (propName === 'id' || propName === 'name' || propName === 'content' || propName === 'description' || propName === 'thumbnail' || propName === 'email' || propName === 'username' || propName === 'title' || propName === 'overview' || propName === 'runtime' || propName === 'rating' || propName === 'notes' || propName === 'order' || propName === 'key' || propName === 'value' || propName === 'message' || propName === 'reason' || propName === 'action' || propName === 'type') {
      // These common field names are the same in camelCase and snake_case
      return match;
    }
    
    if (options.includes(`name: '${propName}'`) || options.includes(`name: "${propName}"`)) {
      // Already has name property matching the property name - replace with snake_case
      const snakeCaseProp = toSnakeCase(propName);
      const newOptions = options
        .replace(/name:\s*['"](\w+)['"]/, `name: '${snakeCaseProp}'`);
      modified = true;
      return `@Column({ ${newOptions} }) ${propName}:`;
    }
    
    if (options.includes('name:')) {
      // Has name property but it's something else - leave it alone
      return match;
    }
    
    // Add name property in snake_case
    const snakeCaseProp = toSnakeCase(propName);
    const newOptions = options.trim().length > 0 
      ? `${options}, name: '${snakeCaseProp}'` 
      : `name: '${snakeCaseProp}'`;
    modified = true;
    return `@Column({ ${newOptions} }) ${propName}:`;
  });

  // Pattern 3: @CreateDateColumn() createdAt: Date;
  // Replace with: @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  const createDateColumnRegex = /@CreateDateColumn\(\s*\)\s+(\w+):/g;
  content = content.replace(createDateColumnRegex, (match, propName) => {
    modified = true;
    const snakeCaseProp = toSnakeCase(propName);
    return `@CreateDateColumn({ name: '${snakeCaseProp}' }) ${propName}:`;
  });

  // Pattern 4: @UpdateDateColumn() updatedAt: Date;
  // Replace with: @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  const updateDateColumnRegex = /@UpdateDateColumn\(\s*\)\s+(\w+):/g;
  content = content.replace(updateDateColumnRegex, (match, propName) => {
    modified = true;
    const snakeCaseProp = toSnakeCase(propName);
    return `@UpdateDateColumn({ name: '${snakeCaseProp}' }) ${propName}:`;
  });

  // Pattern 5: @JoinColumn() and @JoinColumn({ name: 'nameInCamelCase' })
  // Make sure all JoinColumn use snake_case for the column name
  const joinColumnRegex = /@JoinColumn\(\{\s*name:\s*['"](\w+)['"]\s*\}\)/g;
  content = content.replace(joinColumnRegex, (match, columnName) => {
    if (columnName.includes('_')) {
      // Already snake_case
      return match;
    }
    modified = true;
    const snakeCaseColumn = toSnakeCase(columnName);
    return `@JoinColumn({ name: '${snakeCaseColumn}' })`;
  });

  // Pattern 6: Direct name: 'camelCaseColumn' in @Column decorator
  // Update to snake_case
  const columnNameRegex = /name:\s*['"]([a-zA-Z0-9]+)['"]/g;
  content = content.replace(columnNameRegex, (match, columnName) => {
    if (columnName.includes('_') || columnName === 'id' || columnName === 'name' || columnName === 'content' || columnName === 'description' || columnName === 'thumbnail' || columnName === 'email' || columnName === 'username' || columnName === 'title' || columnName === 'overview' || columnName === 'runtime' || columnName === 'rating' || columnName === 'notes' || columnName === 'order' || columnName === 'key' || columnName === 'value' || columnName === 'message' || columnName === 'reason' || columnName === 'action' || columnName === 'type') {
      // Already snake_case or common field names
      return match;
    }
    modified = true;
    const snakeCaseColumn = toSnakeCase(columnName);
    return `name: '${snakeCaseColumn}'`;
  });

  // Save changes if the file was modified
  if (modified) {
    await writeFile(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed for: ${filePath}`);
  }
}

// Update all entity files
async function main() {
  try {
    console.log('Starting entity file update process...');
    const entityFiles = await findEntityFiles();
    console.log(`Found ${entityFiles.length} entity files to process.`);
    
    for (const file of entityFiles) {
      await updateEntityFile(file);
    }
    
    console.log('Entity file update process completed successfully.');
    console.log('Please review the changes and test the application before committing.');
  } catch (error) {
    console.error('Error updating entity files:', error);
    process.exit(1);
  }
}

// Execute the script
main();