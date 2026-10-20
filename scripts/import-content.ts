import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { validateContentText } from './validate-content'

const file = process.argv[2]
if (!file) throw new Error('Usage: npm run content:import -- file.jsonl')
const result = validateContentText(await readFile(file, 'utf8'), file.endsWith('.csv') ? 'csv' : 'jsonl')
if (!result.valid) throw new Error(result.errors.map((error) => `row ${error.row} ${error.path}: ${error.message}`).join('\n'))
const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const creator = process.env.CONTENT_CREATOR_ID
if (!url || !key || !creator) throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CONTENT_CREATOR_ID')
const client = createClient(url, key, { auth: { persistSession: false } })

for (const draft of result.drafts) {
  const { data: group, error: groupError } = await client.from('question_groups').insert({
    part: draft.part, group_type: draft.groupType, difficulty: draft.difficulty, created_by: creator,
  }).select('id').single()
  if (groupError) throw groupError
  for (const item of draft.questions) {
    const { data: question, error: questionError } = await client.from('questions').insert({ part: draft.part, created_by: creator }).select('id').single()
    if (questionError) throw questionError
    const solution = { correctLabel: item.choices.find((choice) => choice.correct)?.label }
    const contentHash = createHash('sha256').update(JSON.stringify({ part: draft.part, prompt: item.prompt, choices: item.choices })).digest('hex')
    const { data: version, error: versionError } = await client.from('question_versions').insert({
      question_id: question.id, group_id: group.id, version: 1, prompt: item.prompt, solution,
      difficulty: draft.difficulty, choice_shuffle_allowed: item.choiceShuffleAllowed, content_hash: contentHash, created_by: creator,
    }).select('id').single()
    if (versionError) throw versionError
    const { error: choicesError } = await client.from('choices').insert(item.choices.map((choice, index) => ({
      question_version_id: version.id, label: choice.label, content: choice.content, is_correct: choice.correct, position: index + 1,
    })))
    if (choicesError) throw choicesError
    const { error: translationsError } = await client.from('translations').insert(Object.entries(item.translations).map(([locale, translation]) => ({
      question_version_id: version.id, locale, explanation: translation.explanation,
      prompt_translation: translation.promptTranslation ?? null, transcript: translation.transcript ?? null,
    })))
    if (translationsError) throw translationsError
  }
  const { error: mediaError } = await client.from('media').insert(draft.media.map((media) => ({
    group_id: group.id, kind: media.kind, storage_path: media.storagePath, metadata: media.metadata ?? {}, created_by: creator,
  })))
  if (mediaError) throw mediaError
}
console.log(`Imported ${result.drafts.length} draft content group(s)`)
