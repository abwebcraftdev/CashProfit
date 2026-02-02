#!/usr/bin/env node

/**
 * CashProfit Release Script
 *
 * Usage:
 *   npm run release patch   # 1.0.0 -> 1.0.1 (bugfix)
 *   npm run release minor   # 1.0.0 -> 1.1.0 (new feature)
 *   npm run release major   # 1.0.0 -> 2.0.0 (breaking change)
 *   npm run release 1.2.3   # Set specific version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const packagePath = path.join(__dirname, '..', 'package.json');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    log(`> ${command}`, 'cyan');
    try {
        return execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        log(`Error executing: ${command}`, 'red');
        process.exit(1);
    }
}

function execSilent(command) {
    try {
        return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
        return null;
    }
}

function getPackageJson() {
    return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
}

function savePackageJson(pkg) {
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);

    switch (type) {
        case 'major':
            return `${parts[0] + 1}.0.0`;
        case 'minor':
            return `${parts[0]}.${parts[1] + 1}.0`;
        case 'patch':
            return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
        default:
            // Assume it's a specific version
            if (/^\d+\.\d+\.\d+$/.test(type)) {
                return type;
            }
            throw new Error(`Invalid version type: ${type}`);
    }
}

async function promptReleaseNotes() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log('\n');
        log('Entrez les notes de release (terminez par une ligne vide):', 'yellow');
        log('Exemple:', 'blue');
        log('  - Ajout du systeme de paiements', 'blue');
        log('  - Correction du bug d\'affichage', 'blue');
        console.log('\n');

        let notes = [];

        rl.on('line', (line) => {
            if (line === '') {
                rl.close();
            } else {
                notes.push(line);
            }
        });

        rl.on('close', () => {
            resolve(notes.join('\n') || 'Ameliorations et corrections de bugs.');
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    const versionType = args[0] || 'patch';
    const skipPrompt = args.includes('--yes') || args.includes('-y');

    log('\n=== CashProfit Release Script ===\n', 'green');

    // Check if git is clean
    const gitStatus = execSilent('git status --porcelain');
    if (gitStatus && !skipPrompt) {
        log('Warning: You have uncommitted changes!', 'yellow');
        log('Please commit or stash your changes before releasing.', 'yellow');
        console.log(gitStatus);
        process.exit(1);
    }

    // Get current version
    const pkg = getPackageJson();
    const currentVersion = pkg.version;
    const newVersion = incrementVersion(currentVersion, versionType);

    log(`Current version: ${currentVersion}`, 'blue');
    log(`New version: ${newVersion}`, 'green');

    // Get release notes
    let releaseNotes;
    if (skipPrompt) {
        releaseNotes = 'Ameliorations et corrections de bugs.';
    } else {
        releaseNotes = await promptReleaseNotes();
    }

    log('\nRelease notes:', 'yellow');
    console.log(releaseNotes);
    console.log('\n');

    // Update package.json
    log('Updating package.json...', 'blue');
    pkg.version = newVersion;
    savePackageJson(pkg);

    // Create CHANGELOG entry
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    const changelogEntry = `## [${newVersion}] - ${date}\n\n${releaseNotes}\n\n`;

    if (fs.existsSync(changelogPath)) {
        const existingChangelog = fs.readFileSync(changelogPath, 'utf-8');
        fs.writeFileSync(changelogPath, changelogEntry + existingChangelog);
    } else {
        fs.writeFileSync(changelogPath, `# Changelog\n\n${changelogEntry}`);
    }
    log('Updated CHANGELOG.md', 'green');

    // Git commit
    log('\nCommitting changes...', 'blue');
    exec('git add package.json CHANGELOG.md');
    exec(`git commit -m "chore: release v${newVersion}"`);

    // Create tag
    log('\nCreating tag...', 'blue');
    exec(`git tag -a v${newVersion} -m "Release v${newVersion}\n\n${releaseNotes}"`);

    // Push
    log('\nPushing to remote...', 'blue');
    exec('git push');
    exec('git push --tags');

    log('\n=== Release Complete! ===', 'green');
    log(`\nVersion v${newVersion} has been released.`, 'green');
    log('GitHub Actions will now build and publish the release.', 'blue');
    log('\nCheck the progress at:', 'yellow');
    log('https://github.com/abwebcraftdev/cashprofit/actions', 'cyan');
}

main().catch(err => {
    log(`\nError: ${err.message}`, 'red');
    process.exit(1);
});
