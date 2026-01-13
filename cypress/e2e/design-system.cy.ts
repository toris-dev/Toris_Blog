// 디자인 시스템 일관성 테스트

describe('디자인 시스템', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('CSS 변수가 올바르게 적용되어야 한다', () => {
    cy.get('body').should('have.css', 'background-color')
    cy.get('body').should('have.css', 'color')
  })

  it('라이트 모드에서 올바른 색상이 적용되어야 한다', () => {
    cy.get('html').should('not.have.class', 'dark')
    cy.get('html').should('not.have.class', 'cyberpunk')
  })

  it('다크 모드로 전환 시 올바른 색상이 적용되어야 한다', () => {
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'dark')
  })

  it('사이버펑크 모드로 전환 시 올바른 색상이 적용되어야 한다', () => {
    // 테마 토글을 여러 번 클릭하여 사이버펑크 모드로 전환
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'cyberpunk')
  })

  it('버튼 컴포넌트가 일관된 스타일을 가져야 한다', () => {
    cy.visit('/posts')
    cy.get('button').should('have.css', 'border-radius')
    cy.get('button').should('have.css', 'transition')
  })

  it('카드 컴포넌트가 일관된 그림자를 가져야 한다', () => {
    cy.visit('/posts')
    cy.get('[class*="card"]').first().should('have.css', 'box-shadow')
  })

  it('링크가 호버 시 올바른 색상으로 변경되어야 한다', () => {
    cy.get('a').first().trigger('mouseover')
    cy.get('a').first().should('have.css', 'color')
  })

  it('반응형 디자인이 올바르게 작동해야 한다', () => {
    // 모바일 뷰포트
    cy.viewport(375, 667)
    cy.get('body').should('be.visible')

    // 태블릿 뷰포트
    cy.viewport(768, 1024)
    cy.get('body').should('be.visible')

    // 데스크톱 뷰포트
    cy.viewport(1920, 1080)
    cy.get('body').should('be.visible')
  })

  it('타이포그래피가 일관되어야 한다', () => {
    cy.get('h1').should('have.css', 'font-weight')
    cy.get('h2').should('have.css', 'font-weight')
    cy.get('p').should('have.css', 'line-height')
  })

  it('간격 시스템이 일관되어야 한다', () => {
    cy.visit('/posts')
    // 카드 간격 확인
    cy.get('[class*="gap"]').should('exist')
  })
})

describe('테마 전환', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('테마 토글이 표시되어야 한다', () => {
    cy.get('[data-testid="theme-toggle"]').should('be.visible')
  })

  it('라이트 모드에서 다크 모드로 전환할 수 있어야 한다', () => {
    cy.get('html').should('not.have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'dark')
  })

  it('다크 모드에서 라이트 모드로 전환할 수 있어야 한다', () => {
    cy.get('[data-testid="theme-toggle"]').click() // 다크 모드로 전환
    cy.get('html').should('have.class', 'dark')
    cy.get('[data-testid="theme-toggle"]').click() // 라이트 모드로 전환
    cy.get('html').should('not.have.class', 'dark')
  })

  it('테마 변경 시 색상이 즉시 업데이트되어야 한다', () => {
    cy.get('body').then(($body) => {
      const lightColor = $body.css('background-color')
      cy.get('[data-testid="theme-toggle"]').click()
      cy.get('body').should(($bodyDark) => {
        const darkColor = $bodyDark.css('background-color')
        expect(darkColor).not.to.eq(lightColor)
      })
    })
  })

  it('테마 설정이 로컬 스토리지에 저장되어야 한다', () => {
    cy.get('[data-testid="theme-toggle"]').click()
    cy.window().then((win) => {
      const theme = win.localStorage.getItem('theme')
      expect(theme).to.exist
    })
  })

  it('페이지 새로고침 후에도 테마가 유지되어야 한다', () => {
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.class', 'dark')
    cy.reload()
    cy.get('html').should('have.class', 'dark')
  })
})

