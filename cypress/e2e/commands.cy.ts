/*
 * 이 파일은 블로그 테스트에 사용되는 공통 명령어와 기능을 테스트합니다.
 * Cypress 명령어 사용 예시를 제공합니다.
 */

describe('Cypress 명령어 예시', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('기본 명령어: 요소 선택 및 동작', () => {
    // 게시글 목록 이동
    cy.get('header a[href="/posts"]').click();
    // "블로그" 텍스트가 포함된 요소 확인
    cy.contains('블로그').should('exist');
    // 게시글 카드 링크 확인
    cy.get('a[href*="/posts/"]').should('have.length.at.least', 1);
    // 푸터 내 링크 확인
    cy.get('footer').find('a').should('have.length.at.least', 1);
    // 사이드바 토글 버튼 확인
    cy.get('[data-cy="sidebarToggle"]').should('exist');
  });

  it('Assertion(단언) 명령어', () => {
    cy.get('header').should('exist');
    cy.get('h1').should('contain', 'Next.js');
    cy.get('header').should('be.visible');
    cy.get('footer').should('have.class', 'border-t');
    cy.get('a[href="/"]').should('have.attr', 'href', '/');
    cy.url().should('include', 'http');
    cy.get('header')
      .should('exist')
      .and('be.visible')
      .and('have.css', 'position', 'fixed');
  });

  it('사용자 동작 명령어', () => {
    cy.get('a[href="/posts"]').click();
    cy.visit('/search');
    cy.get('input[type="search"]').type('Next.js');
    cy.visit('/contact');
    cy.get('select[name="subject"]').select('블로그 관련');
    cy.get('input[type="checkbox"]').check();
    cy.get('input[type="search"]').clear();
    cy.get('input[type="search"]').focus();
    cy.get('footer').scrollIntoView();
  });

  it('탐색 및 API 요청 명령어', () => {
    cy.visit('/posts');
    cy.go('back');
    cy.go('forward');
    cy.reload();
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as(
      'getPosts'
    );
    cy.visit('/posts');
    cy.wait('@getPosts');
    cy.intercept('POST', '/api/contact', {
      statusCode: 200,
      body: { success: true }
    }).as('contactForm');
  });

  it('기타 유용한 명령어', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('theme', 'dark');
    });
    cy.setCookie('test-cookie', 'value');
    cy.getCookie('test-cookie').should('have.property', 'value', 'value');
    cy.viewport('iphone-x');
    cy.viewport(1280, 720);
    cy.screenshot('home-page');
    // 커스텀 명령어 예시 (commands.ts에 정의 필요)
    // cy.login('username', 'password');
  });
});
