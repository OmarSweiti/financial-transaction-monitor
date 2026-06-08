# AI Log — Financial Transaction Monitor

This log documents how AI assistance was directed, audited, and reviewed during the development of the Financial Transaction Monitor dashboard.

---

## 1. Tooling

The following AI tools and developer interfaces were used during this project:
- **Antigravity (Google DeepMind)**: Used as the primary autonomous coding agent for scaffolding, package installations, components implementation, and project building.
- **VS Code + ES7+ React/Redux/React-Native Snippets**: For local file navigation and quick boilerplate edits.
- **npm/npx CLI**: To verify builds and compile-time correctness.

---

## 2. Prompts

Below are representative prompts used to guide the development and scaffolding:

### Backend Scaffolding & Architecture
> "Design a modular NestJS Transactions module with a clean separation of concerns. The controller should handle HTTP layer concerns only, the service should encapsulate database and business logic, and DTOs should handle input validation. Do not write the DB logic yet—first establish the structure."

### Fraud Interceptor Logic
> "Create a NestJS interceptor that automatically sets a transaction's status to `PENDING_REVIEW` if the amount is strictly greater than 5,000. Ensure this mutation runs before the record is persisted to the database. Provide clear rationale for why you chose an interceptor over service-layer validation."

### Frontend Components & Recharts Integration
> "Build a transaction table and a volume chart component using shadcn/ui and Recharts. The chart must display the transaction volume (sum of amount grouped by status), not the count of transactions. Aggregate this data client-side from the transaction list to avoid unnecessary endpoints. Ensure the chart colors visually map to the table's status badges."

---

## 3. Code Review & Auditing (AI Corrections)

During development, two notable AI-generated issues were spotted and corrected:

### Issue 1: NestJS Request Lifecycle Misconception (Architecture Anti-Pattern)
* **What the AI produced**: The AI scaffolded the `FraudDetectionInterceptor` with comment documentation stating that:
  > *"Interceptors run after validation pipes but before the handler. This means the DTO has already been validated so we can trust the data."*
* **How it was spotted**: Upon auditing the NestJS request lifecycle, we noted that **Interceptors (pre-handler) run BEFORE Pipes**. Consequently, when `FraudDetectionInterceptor` intercepts the request body, the `ValidationPipe` has not yet executed. 
* **The risk**: If a client sends the `amount` as a string (`{"amount": "6000"}`), the interceptor executes comparison checks (`body.amount > 5000`) before `class-transformer` coerces it to a number. Furthermore, malformed/invalid payloads trigger the interceptor's logger warnings before the request is rejected with a `400 Bad Request` by the validation pipe.
* **The fix**: We noted this architectural anti-pattern for review. In a production pipeline, this transformation is safer handled as a custom NestJS Pipe or as part of the Service-layer creation method to ensure it operates on fully sanitized and typed objects.

### Issue 2: Synchronous State Update inside `useEffect` (Next.js Lint Error)
* **What the AI produced**: In `transaction-filters.tsx`, the AI added a `useEffect` hook to synchronize the local input state when the search query changed:
  ```typescript
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);
  ```
* **How it was spotted**: Running `npm run lint` threw the ESLint error:
  `react-hooks/set-state-in-effect - Calling setState synchronously within an effect can trigger cascading renders`
* **The fix**: We refactored the component to use React's recommended render-time synchronization pattern, completely removing the `useEffect`:
  ```typescript
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setLocalSearch(search);
    setPrevSearch(search);
  }
  ```
  This immediately resolved the lint error, optimized rendering performance, and aligned the component with modern React guidelines.

### Issue 3: Prisma Custom Generator Output Path (Module Not Found)
* **What the AI produced**: The AI configured the generator in `schema.prisma` with a custom local output target: `output = "../generated/prisma"` and imported the client relatively inside `prisma.service.ts`: `import { PrismaClient } from '../../generated/prisma'`.
* **How it was spotted**: While the NestJS server compiled cleanly under watch-mode (`tsc`), running the transpiled code from `./dist` resulted in a runtime error:
  `Error: Cannot find module '../../generated/prisma'`
* **The risk**: TypeScript compiled code resides in `dist/src/prisma/`, but the generated client directory stayed at `generated/prisma/`. Relatively importing from `dist/src/prisma/` looked for `dist/generated/prisma` instead of `generated/prisma` due to the extra `src/` directory nesting created under `dist/` by the transpiler.
* **The fix**: We refactored `schema.prisma` to remove the custom output path, allowing Prisma to generate client assets to the standard, system-wide `node_modules/.prisma/client` folder. We updated all database imports to fetch from `@prisma/client`. This resolved the compilation/execution mapping issue permanently and aligned the codebase with industry standards.

