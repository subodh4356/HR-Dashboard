const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const authDir = path.join(projectRoot, 'app', '(authenticated)');

// 1. Delete the duplicate layout causing Double Sidebar
const dashboardLayout = path.join(authDir, 'dashboard', 'layout.tsx');
if (fs.existsSync(dashboardLayout)) {
    console.log('Found duplicate layout:', dashboardLayout);
    fs.unlinkSync(dashboardLayout);
    console.log('✅ Deleted dashboard/layout.tsx (Fixed Double Sidebar)');
} else {
    console.log('ℹ️ dashboard/layout.tsx already deleted.');
}

// 2. Move misplaced folders into (authenticated)
const foldersToMove = ['attendance', 'leave', 'recruitment', 'settings'];

foldersToMove.forEach(folder => {
    const src = path.join(projectRoot, 'app', folder);
    const dest = path.join(authDir, folder);

    if (fs.existsSync(src)) {
        console.log(`Moving ${folder} to (authenticated)...`);
        try {
            fs.renameSync(src, dest);
            console.log(`✅ Moved ${folder}`);
        } catch (err) {
            console.error(`❌ Failed to move ${folder}:`, err.message);
        }
    } else {
        // Check if it's already in dest
        if (fs.existsSync(dest)) {
            console.log(`ℹ️ ${folder} is already in (authenticated).`);
        } else {
            console.warn(`⚠️ Could not find folder ${folder} in app/ root.`);
        }
    }
});
