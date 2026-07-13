const viewports = [
  { label: 'mobile', width: 375, height: 812 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1280, height: 900 }
] as const;

function formatConsoleArgument(win: Cypress.AUTWindow, value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof win.Error) return value.stack || value.message;
  try {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  } catch {
    // Fall through to safe string conversion.
  }
  try {
    return String(value);
  } catch {
    return '[unserializable console argument]';
  }
}

function captureConsoleErrors(win: Cypress.AUTWindow, errors: string[]) {
  const original = win.console.error.bind(win.console);
  cy.stub(win.console, 'error').callsFake((...args: unknown[]) => {
    original(...args);
    errors.push(args.map((arg) => formatConsoleArgument(win, arg)).join(' '));
  });
}

function preventServiceWorkerRegistration(win: Cypress.AUTWindow) {
  win.localStorage.setItem('cookie-consent', 'accepted');

  if (!('serviceWorker' in win.navigator)) return;

  const inertRegistration = {
    scope: `${win.location.origin}/`,
    addEventListener() {}
  } as unknown as ServiceWorkerRegistration;

  cy.stub(win.navigator.serviceWorker, 'register').resolves(inertRegistration);
}

function frameSceneForScreenshot(selector: string) {
  cy.get(`${selector} h2, ${selector} [role="tablist"]`).should(($content) => {
    Array.from($content).forEach((element) => {
      const animated = element.closest<HTMLElement>('[style*="opacity"]');
      expect(animated, 'visible motion container').not.to.equal(null);
      const style = animated!.ownerDocument.defaultView!.getComputedStyle(
        animated!
      );
      expect(style.opacity).to.equal('1');
      expect(style.transform).to.equal('none');
    });
  });
  cy.get('[data-testid="product-workbench"]').should(($workbench) => {
    const style = $workbench[0].ownerDocument.defaultView!.getComputedStyle(
      $workbench[0]
    );
    expect(style.opacity).to.equal('1');
    expect(style.transform).to.equal('none');
  });
  cy.get(selector).then(($scene) => {
    const scene = $scene[0];
    const heading = scene.querySelector('h2')!;
    (scene.ownerDocument.activeElement as HTMLElement | null)?.blur();
    const root = scene.ownerDocument.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousScrollMarginTop = heading.style.scrollMarginTop;
    root.style.scrollBehavior = 'auto';
    heading.style.scrollMarginTop = '120px';
    heading.scrollIntoView({ block: 'start', inline: 'nearest' });
    heading.style.scrollMarginTop = previousScrollMarginTop;
    root.style.scrollBehavior = previousScrollBehavior;

    const headingBounds = heading.getBoundingClientRect();
    expect(headingBounds.top, 'heading top is inside viewport').to.be.at.least(
      96
    );
    expect(
      headingBounds.bottom,
      'heading bottom is inside viewport'
    ).to.be.at.most(scene.ownerDocument.defaultView!.innerHeight);
  });
}

function dispatchTrustedKey(key: 'Tab' | 'ArrowRight' | 'End') {
  const codes = {
    Tab: { code: 'Tab', virtual: 9 },
    ArrowRight: { code: 'ArrowRight', virtual: 39 },
    End: { code: 'End', virtual: 35 }
  } as const;
  const selected = codes[key];
  const params = {
    code: selected.code,
    key,
    nativeVirtualKeyCode: selected.virtual,
    windowsVirtualKeyCode: selected.virtual
  };

  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { ...params, type: 'keyDown' }
    })
  );
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { ...params, type: 'keyUp' }
    })
  );
}

function tabToControl(
  control: HTMLElement,
  remaining = 100
): Cypress.Chainable {
  if (remaining === 0) {
    throw new Error(`Trusted Tab could not reach ${control.outerHTML}`);
  }
  dispatchTrustedKey('Tab');
  return cy.then(() => {
    if (control.ownerDocument.activeElement === control) return;
    return tabToControl(control, remaining - 1);
  });
}

function assertVisibleFocus(control: HTMLElement) {
  const style = control.ownerDocument.defaultView!.getComputedStyle(control);
  const outline =
    style.outlineStyle !== 'none' &&
    (Number.parseFloat(style.outlineWidth) || 0) >= 2;
  const ring = style.boxShadow !== 'none';
  expect(control.matches(':focus-visible')).to.be.true;
  expect(outline || ring).to.be.true;
}

function emulateReducedMotion() {
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
      }
    })
  );
}

function clearMediaEmulation() {
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { features: [] }
    })
  );
}

function durationToMilliseconds(duration: string) {
  const value = Number.parseFloat(duration) || 0;
  return duration.trim().endsWith('ms') ? value : value * 1000;
}

function assertStaticMotion(element: Element) {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  const longestTransition = Math.max(
    0,
    ...style.transitionDuration.split(',').map(durationToMilliseconds)
  );
  const longestAnimation = Math.max(
    0,
    ...style.animationDuration.split(',').map(durationToMilliseconds)
  );
  expect(style.transform).to.equal('none');
  expect(style.opacity).to.equal('1');
  expect(longestTransition).to.be.at.most(1);
  expect(longestAnimation).to.be.at.most(1);
}

function assertSemanticColor(
  element: Element,
  property: 'color' | 'backgroundColor'
) {
  const { documentElement, defaultView } = element.ownerDocument;
  const style = defaultView!.getComputedStyle(element);
  const rootStyle = defaultView!.getComputedStyle(documentElement);
  const semanticToken = property === 'color' ? '--foreground' : '--card';
  const expected = rootStyle.getPropertyValue(semanticToken).trim();

  expect(expected, `${semanticToken} resolves`).not.to.equal('');
  expect(style[property], `${property} is visible`).not.to.equal(
    'rgba(0, 0, 0, 0)'
  );
}

describe('Home Product Pipeline', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/todos', { statusCode: 200, body: { todos: [] } });
  });

  viewports.forEach(({ label, width, height }) => {
    it(`reaches Ship with trusted keyboard input at ${label}`, () => {
      const errors: string[] = [];
      cy.viewport(width, height);
      cy.visit('/', {
        onBeforeLoad(win) {
          preventServiceWorkerRegistration(win);
          captureConsoleErrors(win, errors);
        }
      });

      const scene = '[data-testid="developer-identity"]';
      cy.get(scene).scrollIntoView();
      cy.get(scene).should('be.visible');
      cy.get(scene)
        .find('h2')
        .should('contain.text', '제품의 처음과 끝을 연결하는 개발자');
      cy.get(`${scene} [role="tab"]`).should('have.length', 4);
      cy.get(scene).should('not.contain.text', '21앤 (21n)');
      cy.get(scene).should('not.contain.text', 'B2B2C');

      cy.get('[data-testid="pipeline-tab-frame"]').then(($frame) =>
        tabToControl($frame[0] as HTMLElement)
      );
      cy.get('[data-testid="pipeline-tab-frame"]').should(($frame) => {
        expect($frame[0].ownerDocument.activeElement).to.equal($frame[0]);
        assertVisibleFocus($frame[0]);
      });

      dispatchTrustedKey('End');
      cy.get('[data-testid="pipeline-tab-ship"]')
        .should('have.attr', 'aria-selected', 'true')
        .should(($ship) => {
          expect($ship[0].ownerDocument.activeElement).to.equal($ship[0]);
          assertVisibleFocus($ship[0]);
        });
      cy.get('[data-testid="product-workbench"]')
        .should('have.attr', 'data-stage', 'ship')
        .and('contain.text', '운영 가능한 릴리스와 반복');

      cy.document().should((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth
        );
      });
      cy.then(() => expect(errors).to.deep.equal([]));
      frameSceneForScreenshot(scene);
      cy.screenshot(`home-product-pipeline-${label}`, { capture: 'viewport' });
    });
  });

  it('uses semantic colors in light, dark, and cyberpunk themes', () => {
    cy.viewport(1280, 900);
    cy.visit('/', {
      onBeforeLoad(win) {
        preventServiceWorkerRegistration(win);
      }
    });
    cy.get('[data-testid="developer-identity"]').scrollIntoView();
    cy.document().then((document) => {
      const style = document.createElement('style');
      style.textContent =
        '[data-testid="developer-identity"] * { transition: none !important; animation: none !important; }';
      document.head.append(style);
    });

    ['light', 'dark', 'cyberpunk'].forEach((theme) => {
      cy.document().then((document) => {
        document.documentElement.classList.remove('light', 'dark', 'cyberpunk');
        document.documentElement.classList.add(theme);
      });
      cy.get('[data-testid="developer-identity"] h2').should(($title) => {
        assertSemanticColor($title[0], 'color');
      });
      cy.get('[data-testid="product-workbench"]')
        .should('be.visible')
        .should(($workbench) => {
          assertSemanticColor($workbench[0], 'backgroundColor');
        });
      frameSceneForScreenshot('[data-testid="developer-identity"]');
      cy.screenshot(`home-product-pipeline-theme-${theme}`, {
        capture: 'viewport'
      });
    });
  });

  it('keeps the packet and workbench static in native reduced-motion mode', () => {
    emulateReducedMotion();
    cy.viewport(375, 812);
    cy.visit('/', {
      onBeforeLoad(win) {
        preventServiceWorkerRegistration(win);
      }
    });
    cy.window().should((win) => {
      expect(win.matchMedia('(prefers-reduced-motion: reduce)').matches).to.be
        .true;
    });
    cy.get('[data-testid="developer-identity"]').scrollIntoView();
    cy.get('[data-testid="pipeline-tab-ship"]').click();
    cy.get('[data-testid="product-packet"]').should(($packet) =>
      assertStaticMotion($packet[0])
    );
    cy.get('[data-testid="product-workbench"]').should(($workbench) =>
      assertStaticMotion($workbench[0])
    );
    clearMediaEmulation();
  });
});
