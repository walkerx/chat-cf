import fs from 'fs';
import path from 'path';

const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
const envPath = path.resolve(process.cwd(), '.env');

let vars = {};

function parseEnv(content) {
    const lines = content.split('\n');
    const result = {};
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            result[key] = value;
        }
    }
    return result;
}

if (fs.existsSync(devVarsPath)) {
    console.log('Loading .dev.vars...');
    Object.assign(vars, parseEnv(fs.readFileSync(devVarsPath, 'utf-8')));
}

if (fs.existsSync(envPath)) {
    console.log('Loading .env...');
    Object.assign(vars, parseEnv(fs.readFileSync(envPath, 'utf-8')));
}

const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(key => !vars[key]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .dev.vars or .env file.');
    process.exit(1);
}

console.log('Environment variables check passed.');
