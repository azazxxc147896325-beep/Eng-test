import type { JsonValue } from '../domain/types'

function record(value: JsonValue) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function DocumentPanel({ prompt }: { prompt: JsonValue }) {
  const data = record(prompt)
  const documents = Array.isArray(data.documents) ? data.documents : data.passage ? [data.passage] : []
  if (!documents.length) return null

  return (
    <section className="document-panel" aria-label="Document">
      {documents.map((document, index) => {
        const item = record(document)
        return (
          <article className="document-card" key={index}>
            {typeof item.title === 'string' && <h2>{item.title}</h2>}
            <p>{typeof item.text === 'string' ? item.text : String(document)}</p>
          </article>
        )
      })}
    </section>
  )
}
