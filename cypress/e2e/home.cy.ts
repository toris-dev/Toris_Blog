// 홈(메인) 페이지 테스트

describe('홈 페이지', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('메인 헤딩과 최근 게시글 섹션이 보여야 한다', () => {
    cy.get('h1').should('contain', 'Recent Posts');
    cy.get('[data-cy="posts-list"]').should('exist');
  });

  it('게시글 카드를 클릭하면 상세 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="post-card"]').first().click();
    cy.url().should('include', '/posts/');
  });

  it('헤더와 푸터가 모두 보여야 한다', () => {
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
  });

  it('헤더에서 소개 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-about-link"]').click();
    cy.url().should('include', '/about');
  });

  it('헤더에서 연락처 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-contact-link"]').click();
    cy.url().should('include', '/contact');
  });

  it('헤더에서 게시글 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-posts-link"]').click();
    cy.url().should('include', '/posts');
  });
});
