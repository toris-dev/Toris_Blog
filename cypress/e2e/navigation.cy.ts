// 내비게이션(헤더/푸터) 테스트

describe('내비게이션', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('헤더 내비게이션 링크가 모두 보여야 한다', () => {
    cy.get('[data-cy="header-home-link"]').should('exist');
    cy.get('[data-cy="header-posts-link"]').should('exist');
    cy.get('[data-cy="header-about-link"]').should('exist');
    cy.get('[data-cy="header-contact-link"]').should('exist');
  });

  it('푸터 내비게이션 링크가 모두 보여야 한다', () => {
    cy.get('[data-cy="footer-about-link"]').should('exist');
    cy.get('[data-cy="footer-contact-link"]').should('exist');
  });

  it('헤더에서 게시글 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-posts-link"]').click();
    cy.url().should('include', '/posts');
  });

  it('헤더에서 소개 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-about-link"]').click();
    cy.url().should('include', '/about');
  });

  it('헤더에서 연락처 페이지로 이동해야 한다', () => {
    cy.get('[data-cy="header-contact-link"]').click();
    cy.url().should('include', '/contact');
  });
});
