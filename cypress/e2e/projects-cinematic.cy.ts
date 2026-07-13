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

function captureRuntimeConsoleErrors(win: Cypress.AUTWindow, errors: string[]) {
  const originalConsoleError = win.console.error.bind(win.console);

  cy.stub(win.console, 'error').callsFake((...args: unknown[]) => {
    originalConsoleError(...args);

    const message = args
      .map((arg) =>
        arg instanceof win.Error ? arg.stack || arg.message : String(arg)
      )
      .join(' ');
    const isRuntimeError =
      args.some((arg) => arg instanceof win.Error) ||
      /^Uncaught(?: \(in promise\))?\s+(?:Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError):/.test(
        message
      );

    if (isRuntimeError) errors.push(message);
  });
}

function assertNoHorizontalDocumentOverflow() {
  cy.document().should((document) => {
    expect(document.documentElement.scrollWidth).to.be.at.most(
      document.documentElement.clientWidth
    );
  });
}

function assertNoRuntimeConsoleErrors(errors: string[]) {
  cy.then(() => expect(errors).to.deep.equal([]));
}

function reducedMotionMatchMedia(query: string): MediaQueryList {
  return {
    matches: query === '(prefers-reduced-motion: reduce)',
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
  it('shows every new project card', () => {
    const runtimeErrors: string[] = [];

    cy.visit('/projects', {
      onBeforeLoad(win) {
        captureRuntimeConsoleErrors(win, runtimeErrors);
      }
    });

    projects.forEach(([slug, name]) => {
      cy.get(`a[href="/projects/${slug}"]`)
        .filter(':visible')
        .should('contain.text', name);
    });
    assertNoHorizontalDocumentOverflow();
    assertNoRuntimeConsoleErrors(runtimeErrors);
  });

  projects.forEach(([slug, name, testId]) => {
    it(`${slug} is a dedicated interactive static landing`, () => {
      const runtimeErrors: string[] = [];

      cy.visit(`/projects/${slug}`, {
        onBeforeLoad(win) {
          captureRuntimeConsoleErrors(win, runtimeErrors);
        }
      });

      cy.get(`[data-cinematic-project="${slug}"]`).should('be.visible');
      cy.get('h1').should('be.visible');
      cy.contains(name, { matchCase: false }).should('exist');
      cy.get(`[data-testid="${testId}"]`).should('be.visible').click();
      cy.get(`[data-testid="${testId}"]`).should('be.visible');
      assertNoHorizontalDocumentOverflow();
      assertNoRuntimeConsoleErrors(runtimeErrors);
    });
  });

  it('renders in reduced-motion mode without an animation dependency', () => {
    const runtimeErrors: string[] = [];

    cy.visit('/projects/starlight-greenhouse', {
      onBeforeLoad(win) {
        captureRuntimeConsoleErrors(win, runtimeErrors);
        Object.defineProperty(win, 'matchMedia', {
          configurable: true,
          value: reducedMotionMatchMedia,
          writable: true
        });
      }
    });

    cy.get('[data-testid="seed-grow"]').click();
    cy.get('[data-testid="seed-grow"]').should('be.visible');
    assertNoHorizontalDocumentOverflow();
    assertNoRuntimeConsoleErrors(runtimeErrors);
  });
});
