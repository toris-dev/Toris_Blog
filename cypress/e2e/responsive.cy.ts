// 반응형 디자인 테스트

describe('반응형 디자인 테스트', () => {
  const sizes = [
    { device: '모바일', width: 375, height: 667 },
    { device: '태블릿', width: 768, height: 1024 },
    { device: '랩탑', width: 1366, height: 768 },
    { device: '데스크탑', width: 1920, height: 1080 }
  ];

  context('홈페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 홈페이지가 올바르게 보여야 한다 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/');
        cy.get('header').should('be.visible');
        if (size.width < 768) {
          cy.get('[data-cy="sidebarToggle"]').should('be.visible');
          cy.get('[data-cy="mobileSidebar"]').should('not.be.visible');
        } else {
          cy.get('header nav').should('be.visible');
        }
        cy.contains('Next.js').should('be.visible');
        cy.get('footer').should('be.visible');
      });
    });
  });

  context('블로그 페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 블로그 페이지가 올바르게 보여야 한다 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/posts');
        cy.contains('블로그').should('be.visible');
        cy.get('a[href*="/posts/"]').should('be.visible');
        if (size.width < 640) {
          cy.get('a[href*="/posts/"]').should(
            'have.css',
            'grid-column-start',
            '1'
          );
        } else if (size.width >= 640 && size.width < 1024) {
          cy.get('a[href*="/posts/"]').should('have.length.at.least', 2);
        } else {
          cy.get('a[href*="/posts/"]').should('have.length.at.least', 3);
        }
      });
    });
  });

  context('포트폴리오 페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 포트폴리오 페이지가 올바르게 보여야 한다 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/portfolio');
        cy.contains('포트폴리오').should('be.visible');
        cy.contains('프로젝트').should('be.visible');
        cy.get('img').should('be.visible');
      });
    });
  });

  context('다크모드 테스트', () => {
    it('다크모드 토글이 정상 동작해야 한다', () => {
      cy.visit('/');
      cy.get('[data-cy="darkModeToggle"]').click();
      cy.get('html').should('have.class', 'dark');
      cy.get('[data-cy="darkModeToggle"]').click();
      cy.get('html').should('not.have.class', 'dark');
    });
  });
});
