import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__'
        ? []
        : productionSourceFiles(absolutePath);
    }

    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

it('keeps contact intake on the validated server action only', () => {
  const srcRoot = path.join(process.cwd(), 'src');
  const legacyRoute = path.join(srcRoot, 'app/api/contact/route.ts');
  const legacyEndpoint = ['', 'api', 'contact'].join('/');
  const references = productionSourceFiles(srcRoot).filter((file) =>
    readFileSync(file, 'utf8').includes(legacyEndpoint)
  );

  expect(existsSync(legacyRoute)).toBe(false);
  expect(references).toEqual([]);
});
