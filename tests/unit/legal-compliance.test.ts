import { describe, it, expect } from 'vitest';
import { metadata as privacyMetadata } from '../../app/(marketing)/privacy/page';
import { metadata as termsMetadata } from '../../app/(marketing)/terms/page';
import { metadata as cookiesMetadata } from '../../app/(marketing)/cookies/page';
import { metadata as legalMetadata } from '../../app/(marketing)/legal/page';

describe('Conformidade Legal & LGPD (Lei 13.709/2018)', () => {
  it('garante metadados e títulos adequados para a Política de Privacidade', () => {
    expect(privacyMetadata.title).toContain('Privacidade');
    expect(privacyMetadata.description).toContain('LGPD');
  });

  it('garante metadados e títulos adequados para os Termos de Uso', () => {
    expect(termsMetadata.title).toContain('Termos de Uso');
    expect(termsMetadata.description).toContain('BeadForge Studio');
  });

  it('garante metadados para a Política de Cookies e Central Legal', () => {
    expect(cookiesMetadata.title).toContain('Cookies');
    expect(legalMetadata.title).toContain('Central Legal');
  });
});
