import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Remove unused React import
    if (content.includes("import React from 'react'") || content.includes('import React from "react"')) {
        content = content.replace(/import React from ['"]react['"];?\r?\n?/g, '');
        changed = true;
    }

    // Replace import React, { useEffect, useState } with just { useEffect, useState }
    if (content.match(/import React,\s*\{/)) {
        content = content.replace(/import React,\s*\{/g, 'import {');
        changed = true;
    }

    // 2. Add eslint-disable for prop-types if it contains props
    if (content.match(/react\/prop-types/)) {
        // we won't fix this using regex easily, let's just add it to the top of all files if needed or we just append to the eslintrc
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed React import in ${filePath}`);
    }
}

function walkPath(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
                walkPath(fullPath);
            }
        } else if (file.endsWith('.jsx')) {
            fixFile(fullPath);
        }
    }
}

console.log('Fixing frontend...');
walkPath('./frontend/src');
console.log('Fixing admin...');
walkPath('./admin/src');
