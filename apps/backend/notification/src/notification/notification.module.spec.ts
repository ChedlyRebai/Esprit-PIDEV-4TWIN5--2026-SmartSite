import * as fs from 'fs';
import * as path from 'path';

describe('Notification Module File', () => {
  it('notification.module.ts file should exist', () => {
    const p = path.join(__dirname, 'notification.module.ts');
    expect(fs.existsSync(p)).toBe(true);
  });
});
