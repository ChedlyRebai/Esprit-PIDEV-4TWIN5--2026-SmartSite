import * as fs from 'fs';
import * as path from 'path';

describe('App Module File', () => {
  it('app.module.ts file should exist', () => {
    const p = path.join(__dirname, 'app.module.ts');
    expect(fs.existsSync(p)).toBe(true);
  });
});
