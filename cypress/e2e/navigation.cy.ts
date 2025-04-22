describe('네비게이션 테스트', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('헤더 네비게이션 링크 테스트', () => {
    // 헤더 링크 확인
    cy.get('header a[href="/"]').should('exist');
    cy.get('header a[href="/posts"]').should('exist');
    cy.get('header a[href="/about"]').should('exist');
    cy.get('header a[href="/portfolio"]').should('exist');

    // 블로그 링크 클릭 테스트
    cy.get('header a[href="/posts"]').click();
    cy.url().should('include', '/posts');

    // 소개 페이지 링크 클릭 테스트
    cy.get('header a[href="/about"]').click();
    cy.url().should('include', '/about');

    // 포트폴리오 링크 클릭 테스트
    cy.get('header a[href="/portfolio"]').click();
    cy.url().should('include', '/portfolio');

    // 홈으로 돌아가기
    cy.get('header a[href="/"]').click();
    cy.url().should('not.include', '/posts');
    cy.url().should('not.include', '/about');
  });

  it('푸터 네비게이션 링크 테스트', () => {
    // 푸터 링크 확인
    cy.get('footer a[href="/about"]').should('exist');
    cy.get('footer a[href="/terms"]').should('exist');
    cy.get('footer a[href="/contact"]').should('exist');

    // 이용약관 페이지 테스트
    cy.get('footer a[href="/terms"]').click();
    cy.url().should('include', '/terms');
    cy.contains('이용약관').should('exist');

    // 연락처 페이지 테스트
    cy.get('footer a[href="/contact"]').click();
    cy.url().should('include', '/contact');
    cy.contains('연락처').should('exist');

    // 소개 페이지 테스트
    cy.get('footer a[href="/about"]').click();
    cy.url().should('include', '/about');
    cy.contains('소개').should('exist');
  });

  it('메인 페이지 섹션 및 링크 테스트', () => {
    cy.visit('/');

    // 히어로 섹션 확인
    cy.contains('Next.js').should('exist');
    cy.contains('풀스택 개발자').should('exist');

    // 블로그 보기 버튼 테스트
    cy.contains('블로그 보기').click();
    cy.url().should('include', '/posts');
    cy.go('back');

    // 포트폴리오 버튼 테스트
    cy.contains('포트폴리오').click();
    cy.url().should('include', '/portfolio');
    cy.go('back');

    // 기술 카테고리 섹션 확인
    cy.contains('모던 웹 개발').should('exist');
    cy.contains('Next.js').should('exist');
    cy.contains('Frontend').should('exist');
    cy.contains('Full Stack').should('exist');
    cy.contains('API & Backend').should('exist');

    // 최신 포스트 섹션 확인
    cy.contains('최신 포스트').should('exist');
    cy.contains('모든 포스트 보기').should('exist');

    // 포스트 링크 테스트
    cy.get('a[href*="/posts/"]').first().click();
    cy.url().should('include', '/posts/');
  });

  it('사이드바 토글 및 링크 테스트', () => {
    // 사이드바 토글 버튼 확인 및 클릭
    cy.get('[data-cy="sidebarToggle"]').should('exist').click();

    // 사이드바 링크 확인
    cy.contains('홈').should('exist');
    cy.contains('태그').should('exist');

    // GitHub 링크 확인
    cy.get('[data-cy="githubLink"]').should(
      'have.attr',
      'href',
      'https://github.com/toris-dev'
    );

    // 사이드바 닫기
    cy.get('[data-cy="sidebarToggle"]').click();
  });
});
