import { SITE } from '@/utils/jsonLd/site';

it('uses the square TORIS app icon for organization structured data', () => {
  expect(SITE.organization.logoPath).toBe('/brand/toris-app-icon-v2.svg');
  expect(SITE.organization.logoWidth).toBe(SITE.organization.logoHeight);
  expect(SITE.organization.logoWidth).toBe(256);
});
