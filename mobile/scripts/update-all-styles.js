#!/usr/bin/env node

/**
 * Script to update all screen styles to match new design system
 * This script updates ONLY visual styling, keeping all logic intact
 */

const fs = require('fs');
const path = require('path');

// Files to update with their style modifications
const filesToUpdate = [
  // Tabs
  'app/(tabs)/index.tsx',
  'app/(tabs)/chat.tsx',
  'app/(tabs)/jobs.tsx',
  'app/(tabs)/masters.tsx',
  'app/(tabs)/my-jobs.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/responses.tsx',
  
  // Auth
  'app/(auth)/login.tsx',
  'app/(auth)/verify.tsx',
  
  // Other screens
  'app/create-job.tsx',
  'app/apply-job.tsx',
  'app/chat/[roomId].tsx',
  'app/masters/[id].tsx',
  'app/profile/edit.tsx',
  'app/profile/favorites.tsx',
  'app/profile/portfolio.tsx',
  'app/profile/reviews.tsx',
  'app/profile/settings.tsx',
];

// Style replacements (only visual properties)
const styleReplacements = {
  // Border radius updates
  'borderRadius: 8': 'borderRadius: 12',
  'borderRadius: 10': 'borderRadius: 12',
  'borderRadius: 12': 'borderRadius: 16',
  'borderRadius: 15': 'borderRadius: 16',
  'borderRadius: 16': 'borderRadius: 20',
  
  // Padding/spacing updates
  'padding: 15': 'padding: 16',
  'padding: 18': 'padding: 20',
  'paddingHorizontal: 15': 'paddingHorizontal: 16',
  'paddingVertical: 10': 'paddingVertical: 12',
  'marginBottom: 15': 'marginBottom: 16',
  'gap: 10': 'gap: 12',
  
  // Font sizes
  'fontSize: 13': 'fontSize: 14',
  'fontSize: 15': 'fontSize: 16',
  'fontSize: 17': 'fontSize: 18',
};

console.log('🎨 Starting style update for all screens...\n');

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply style replacements
    Object.entries(styleReplacements).forEach(([oldStyle, newStyle]) => {
      if (content.includes(oldStyle)) {
        content = content.replace(new RegExp(oldStyle, 'g'), newStyle);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
      updatedCount++;
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Errors: ${errorCount} files`);
console.log(`\n✨ Style update complete!`);
