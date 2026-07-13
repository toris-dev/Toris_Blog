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

function durationToMilliseconds(duration: string) {
  const value = Number.parseFloat(duration) || 0;
  return duration.trim().endsWith('ms') ? value : value * 1000;
}

function assertStaticReducedMotion(element: Element) {
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

function focusedKeyboardActivation(selector: string, key: '{enter}' | ' ') {
  cy.get(selector).focus();
  cy.get(selector)
    .should('have.focus')
    .should(($control) => {
      expect($control.attr('class')).to.contain('focus-visible:');
    });
  dispatchFocusedKeyboard(key);
}

function dispatchFocusedKeyboard(key: '{enter}' | ' ') {
  const enter = key === '{enter}';
  const params = {
    code: enter ? 'Enter' : 'Space',
    key: enter ? 'Enter' : ' ',
    nativeVirtualKeyCode: enter ? 13 : 32,
    text: enter ? '\r' : ' ',
    unmodifiedText: enter ? '\r' : ' ',
    windowsVirtualKeyCode: enter ? 13 : 32
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
      params: { ...params, text: undefined, type: 'keyUp' }
    })
  );
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

function exerciseSignature(slug: (typeof projects)[number][0], testId: string) {
  const signature = `[data-testid="${testId}"]`;
  const status = '[data-cinematic-project] [role="status"]';

  switch (slug) {
    case '21n-apps':
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      cy.get('[data-cinematic-project] [aria-current="step"]')
        .should('be.visible')
        .and('have.text', '체결 완료');
      break;
    case 'snapmate':
      focusedKeyboardActivation(signature, ' ');
      cy.get(status).should('have.text', '우리 갤러리에 저장됨');
      cy.get('[aria-label="SnapMate 촬영 데모"]')
        .find('img')
        .should(
          'have.attr',
          'alt',
          'SnapMate에서 현상된 사진을 확인하는 그룹 갤러리 화면'
        );
      cy.get('[aria-label="SnapMate 촬영 데모"]')
        .find('img[alt="SnapMate 카메라에서 촬영할 순간을 확인하는 화면"]')
        .should('not.exist');
      break;
    case 'bubble-bible':
      cy.contains('button', '소그룹에 나누기').should('be.disabled');
      focusedKeyboardActivation(signature, '{enter}');
      cy.contains('button', '소그룹에 나누기').should('be.enabled');
      cy.contains('button', '소그룹에 나누기').focus();
      cy.contains('button', '소그룹에 나누기')
        .should('have.focus')
        .should(($control) => {
          expect($control.attr('class')).to.contain('focus-visible:');
        });
      dispatchFocusedKeyboard(' ');
      cy.get(status).should('have.text', '소그룹 나눔 카드 준비 완료');
      break;
    case 'dongne-paint':
      focusedKeyboardActivation(signature, '{enter}');
      cy.get(status).should('have.text', '영역 9칸 확보');
      cy.get('[aria-label="확보한 타일"]').should('have.length', 9);
      break;
    case 'youth-money-guide':
      cy.get('select[aria-label="나이대"]').select('30–34');
      cy.get('select[aria-label="지역"]').select('경기');
      cy.get('select[aria-label="관심사"]').select('생활비');
      focusedKeyboardActivation(signature, '{enter}');
      cy.get(status)
        .should('be.visible')
        .and('contain.text', '나이대 30–34')
        .and('contain.text', '지역 경기')
        .and('contain.text', '관심사 생활비')
        .and('contain.text', '검토일 2026.07.13')
        .and('contain.text', '실제 신청 전 원문을 확인하세요');
      cy.get(status)
        .contains('a', '온통청년 정책 통합검색')
        .should(
          'have.attr',
          'href',
          'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch'
        )
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer');
      break;
    case 'starlight-greenhouse':
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      cy.get(status).should('have.text', '별가루 3 · 새싹 조명 해금');
      cy.contains('초당 +1').should('be.visible');
      break;
    case 'volley-king-30':
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      focusedKeyboardActivation(signature, '{enter}');
      cy.get(status).should('have.text', 'NICE SPIKE · COMBO 3');
      cy.get(signature).should('contain.text', '다시 랠리');
      break;
    case 'toris-docs':
      focusedKeyboardActivation(signature, '{enter}');
      cy.get(status).should('have.text', 'PROJECTS → WIKI → OUTPUT 연결');
      break;
    case 'product-growth-skills':
      cy.contains('button', '스토어 등록 준비').focus();
      cy.contains('button', '스토어 등록 준비')
        .should('have.focus')
        .should(($control) => {
          expect($control.attr('class')).to.contain('focus-visible:');
        });
      dispatchFocusedKeyboard('{enter}');
      cy.get('[aria-pressed="true"]').should('have.length', 1);
      cy.get(status).should('contain.text', 'app-store-listing-creator');
      focusedKeyboardActivation(signature, ' ');
      cy.get('[aria-pressed="true"]').should('have.length', 1);
      cy.get(status).should('contain.text', 'seo-geo-optimizer');
      break;
  }
}

describe('cinematic project showcase', () => {
  const viewports = [
    { label: 'mobile', width: 375, height: 812 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'desktop', width: 1280, height: 900 }
  ] as const;

  beforeEach(() => {
    cy.intercept('GET', '/api/todos', {
      statusCode: 200,
      body: { todos: [] }
    });
  });

  it('keeps SnapMate and shared reveals static in reduced-motion mode', () => {
    const runtimeErrors: string[] = [];

    emulateReducedMotion();
    cy.viewport(375, 812);
    cy.visit('/projects/snapmate', {
      onBeforeLoad(win) {
        captureConsoleErrors(win, runtimeErrors);
      }
    });

    cy.window().then((win) => {
      expect(win.matchMedia('(prefers-reduced-motion)').matches).to.be.true;
      expect(win.matchMedia('(prefers-reduced-motion: reduce)').matches).to.be
        .true;
      expect(win.matchMedia('(min-width: 768px)').matches).to.be.false;
    });
    focusedKeyboardActivation('[data-testid="snap-shutter"]', ' ');
    cy.get('[role="status"]').should('have.text', '우리 갤러리에 저장됨');
    cy.get('[data-testid="snap-photo-card"]')
      .should('have.class', 'cinematic-reduced-static')
      .should(($card) => assertStaticReducedMotion($card[0]));
    cy.get('[data-cinematic-project] .cinematic-reduced-static')
      .not('[data-testid="snap-photo-card"]')
      .should(($reveals) => {
        expect($reveals.length).to.be.greaterThan(2);
        Array.from($reveals).forEach((reveal) => {
          assertStaticReducedMotion(reveal);
        });
      });
    assertLoadedImages('[data-cinematic-project="snapmate"]');
    assertNoHorizontalDocumentOverflow();
    assertNoConsoleErrors(runtimeErrors);
    clearMediaEmulation();
  });

  viewports.forEach(({ label, width, height }) => {
    context(`${label} ${width}×${height}`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
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
        it(`${slug} reaches its final keyboard state`, () => {
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
    });
  });
});
