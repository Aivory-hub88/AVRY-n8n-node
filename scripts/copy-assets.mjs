// Copy non-TS node assets (icons, codex json) next to the compiled output.
import { cpSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

for (const dir of ['nodes/Aivory']) {
  mkdirSync(join('dist', dir), { recursive: true });
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.svg') || f.endsWith('.png') || f.endsWith('.json')) {
      cpSync(join(dir, f), join('dist', dir, f));
    }
  }
}
