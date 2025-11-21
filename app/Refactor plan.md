Refactor Plan: AdminView to App Router
This plan details the decomposition of AdminView into specific routes within app/(app)/w/[workspaceSlug]/..., replacing client-side fetching with Server Components and API routes with Server Actions.

1. Create Server Actions
Create src/app/actions/chatflow.ts to handle mutations.

generateChatflowAction(prompt: string): Wraps the AI generation logic.
updateChatflowAction(id: string, data: Partial<Chatflow>): Updates schema/fields.
publishChatflowAction(id: string): Sets status to PUBLISHED.
2. Refactor "Create" View
Target: src/app/(app)/w/[workspaceSlug]/chatflows/new/page.tsx

Type: Client Component (due to interactivity) wrapped in Server Component if possible, or just Client Component calling Server Action.
Functionality:
Move CreateChatflow logic here.
Replace fetch('/api/chatflow/generate') with generateChatflowAction.
On success, redirect to /w/[slug]/chatflows/[id].
3. Refactor "Edit" View
Target: src/app/(app)/w/[workspaceSlug]/chatflows/[id]/page.tsx

Type: Server Component.
Functionality:
Fetch chatflow directly using prisma.chatflow.findUnique.
Validate ownership/workspace.
Pass data to a new client component: ChatflowEditor.
New Component: src/components/chatflow/chatflow-editor.tsx

Extract EditFields and SortableFieldItem from AdminView.
Remove internal fetch calls.
Accept initialChatflow prop.
Use updateChatflowAction for saving changes.
4. Refactor "Submissions" View
Target: src/app/(app)/w/[workspaceSlug]/chatflows/[id]/submissions/page.tsx

Type: Server Component.
Functionality:
Fetch submissions using prisma.chatflowSubmission.findMany.
Render the table directly (or extract SubmissionsTable component).
5. Update Dashboard
Target: src/app/(app)/w/[workspaceSlug]/dashboard/page.tsx

Current Status: Already exists and fetches data.
Update: Ensure it links to the new routes:
"Create" button -> /w/[slug]/chatflows/new
Chatflow items -> /w/[slug]/chatflows/[id]
Submission count -> /w/[slug]/chatflows/[id]/submissions
6. Cleanup
Delete src/components/dashboard/admin-view.tsx.
Delete src/app/(auth)/chatflows (legacy routes).
Update src/app/page.tsx to redirect logged-in users to /w/default or render a landing page.
CLAUDE.md Compliance Checklist
[ ] Use prisma singleton from @/lib/db.
[ ] Use getUser() for auth checks.
[ ] Await params in dynamic routes.
[ ] Enforce workspace isolation in all Prisma queries.