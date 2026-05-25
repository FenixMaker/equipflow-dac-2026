import type { BusinessRulesSection } from '../constants/businessRules'

type Props = {
  role: 'admin' | 'borrower'
  sections: BusinessRulesSection[]
}

export function BusinessRulesPanel({ role, sections }: Props) {
  const titleId = role === 'admin' ? 'admin-rules-title' : 'borrow-rules-title'

  return (
    <details className="rules-panel">
      <summary className="rules-panel-summary" aria-labelledby={titleId}>
        <span id={titleId} className="rules-panel-title">
          Regras de negócio · NRDT
        </span>
        <span className="rules-panel-hint muted tiny">Como o EquipFlow funciona</span>
      </summary>
      <div className="rules-panel-body">
        {sections.map((section) => (
          <section key={section.title} className="rules-panel-section">
            <h4 className="rules-panel-section-title">{section.title}</h4>
            <ul className="rules-panel-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  )
}
