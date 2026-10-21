# Score Quest Admin Console Design

Admin-only console matching the approved clean mockup. `/admin` requires the `admin` role and provides overview, question bank, review queue, editor, AI Draft, file import, and user-role management. Data comes from Supabase; all imports are validated and saved only as Draft. Mobile uses a horizontally scrollable admin menu. Published content remains protected by the existing workflow.

MVP import formats: JSON/JSONL for all Parts; CSV/XLSX spreadsheet template for Part 5. Users must only upload content they own or may legally use.
