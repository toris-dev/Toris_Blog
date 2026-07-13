const projects = [
  ['21n-apps', '21n Apps', 'contract-advance'],
  ['snapmate', 'SnapMate', 'snap-shutter'],
  ['bubble-bible', 'Bubble Bible', 'bible-complete'],
  ['dongne-paint', '동네 칠하기 대작전', 'territory-capture'],
  ['youth-money-guide', '청년머니가이드', 'policy-scan'],
  ['starlight-greenhouse', '별빛 온실', 'seed-grow'],
  ['volley-king-30', '30초 배구왕', 'volley-hit'],
  ['toris-docs', 'toris-docs', 'knowledge-node-projects'],
  ['product-growth-skills', 'Product Growth Skills', 'skill-goal-search']
] as const;

function formatConsoleArgument(win: Cypress.AUTWindow, argument: unknown) {
  if (typeof argument === 'string') return argument;
  if (argument instanceof win.Error) {
    return argument.stack || argument.message;
  }

  try {
    const serialized = JSON.stringify(argument);
    if (serialized !== undefined) return serialized;
  } catch {
    // Fall through to a safe string representation for circular values.
  }

  try {
    return String(argument);
  } catch {
    return '[unserializable console argument]';
  }
}

function captureConsoleErrors(win: Cypress.AUTWindow, errors: string[]) {
  const originalConsoleError = win.console.error.bind(win.console);

  cy.stub(win.console, 'error').callsFake((...args: unknown[]) => {
    originalConsoleError(...args);
    errors.push(args.map((arg) => formatConsoleArgument(win, arg)).join(' '));
  });
}

function assertNoHorizontalDocumentOverflow() {
  cy.document().should((document) => {
    expect(document.documentElement.scrollWidth).to.be.at.most(
      document.documentElement.clientWidth
    );
  });
}

function assertNoConsoleErrors(errors: string[]) {
  cy.then(() => expect(errors).to.deep.equal([]));
}

function assertLoadedImages(rootSelector: string) {
  cy.get(rootSelector).then(($root) => {
    const images = Array.from($root[0].querySelectorAll('img'));

    images.forEach((image) => {
      cy.wrap(image).scrollIntoView();
      cy.wrap(image).should((loadedImage) => {
        expect(loadedImage.complete, loadedImage.currentSrc || loadedImage.src)
          .to.be.true;
        expect(
          loadedImage.naturalWidth,
          loadedImage.currentSrc || loadedImage.src
        ).to.be.greaterThan(0);
      });
    });
  });
}

function exerciseSignature(slug: (typeof projects)[number][0], testId: string) {
  const signature = `[data-testid="${testId}"]`;
  const status = '[data-cinematic-project] [role="status"]';

  if (slug === 'product-growth-skills') {
    cy.contains('button', '스토어 등록 준비').click();
    cy.get(status).should('contain.text', 'app-store-listing-creator');
    cy.get(signature).should('be.visible').click();
    cy.get(status).should('contain.text', 'seo-geo-optimizer');
    return;
  }

  cy.get(signature).should('be.visible').click();

  switch (slug) {
    case '21n-apps':
      cy.get('[data-cinematic-project] [aria-current="step"]')
        .should('be.visible')
        .and('have.text', '모델 서명');
      break;
    case 'snapmate':
      cy.get(status).should('have.text', '우리 갤러리에 저장됨');
      break;
    case 'bubble-bible':
      cy.get(status).should('have.text', '오늘의 읽기 완료 · 7일 연속');
      break;
    case 'dongne-paint':
      cy.get(status).should('have.text', '영역 9칸 확보');
      break;
    case 'youth-money-guide':
      cy.get(status)
        .should('be.visible')
        .and('contain.text', '조건에 맞는 정책 카드');
      break;
    case 'starlight-greenhouse':
      cy.get(status).should('have.text', '별가루 1');
      break;
    case 'volley-king-30':
      cy.get(status).should('have.text', 'COMBO 1');
      cy.get(signature).should('contain.text', '토스');
      break;
    case 'toris-docs':
      cy.get(status).should('have.text', 'PROJECTS → WIKI → OUTPUT 연결');
      break;
  }
}

function reducedMotionMatchMedia(query: string): MediaQueryList {
  return {
    matches:
      query === '(prefers-reduced-motion)' ||
      query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true
  };
}

describe('cinematic project showcase', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/todos', {
      statusCode: 200,
      body: { todos: [] }
    });
  });

  it('shows every new project card', () => {
    const runtimeErrors: string[] = [];

    cy.visit('/projects', {
      onBeforeLoad(win) {
        captureConsoleErrors(win, runtimeErrors);
      }
    });

    projects.forEach(([slug, name]) => {
      const card = `a[href="/projects/${slug}"]`;

      cy.get(card).filter(':visible').should('contain.text', name);
      assertLoadedImages(card);
    });
    assertNoHorizontalDocumentOverflow();
    assertNoConsoleErrors(runtimeErrors);
  });

  projects.forEach(([slug, name, testId]) => {
    it(`${slug} is a dedicated interactive static landing`, () => {
      const runtimeErrors: string[] = [];

      cy.visit(`/projects/${slug}`, {
        onBeforeLoad(win) {
          captureConsoleErrors(win, runtimeErrors);
        }
      });

      const landing = `[data-cinematic-project="${slug}"]`;

      cy.get(landing).should('be.visible');
      cy.get(landing).find('h1').should('be.visible');
      cy.get(landing)
        .find('header')
        .contains(name, { matchCase: false })
        .should('be.visible');
      exerciseSignature(slug, testId);
      assertLoadedImages(landing);
      assertNoHorizontalDocumentOverflow();
      assertNoConsoleErrors(runtimeErrors);
    });
  });

  it('renders in reduced-motion mode without an animation dependency', () => {
    const runtimeErrors: string[] = [];

    cy.visit('/projects/starlight-greenhouse', {
      onBeforeLoad(win) {
        captureConsoleErrors(win, runtimeErrors);
        Object.defineProperty(win, 'matchMedia', {
          configurable: true,
          value: reducedMotionMatchMedia,
          writable: true
        });
      }
    });

    cy.window().then((win) => {
      expect(win.matchMedia('(prefers-reduced-motion)').matches).to.be.true;
      expect(win.matchMedia('(prefers-reduced-motion: reduce)').matches).to.be
        .true;
      expect(win.matchMedia('(min-width: 768px)').matches).to.be.false;
    });
    cy.get('[data-testid="seed-grow"]').click();
    cy.get('[role="status"]').should('have.text', '별가루 1');
    assertLoadedImages('[data-cinematic-project="starlight-greenhouse"]');
    assertNoHorizontalDocumentOverflow();
    assertNoConsoleErrors(runtimeErrors);
  });
});
