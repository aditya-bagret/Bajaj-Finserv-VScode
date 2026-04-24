# SRM Full Stack Engineering Challenge

Complete full-stack solution using **Node.js + JavaScript**.

- **Backend:** Express REST API at `POST /bfhl`
- **Frontend:** Single-page UI for input, submission, and clean response rendering

## Project Structure

```text
.
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── server.js
├── package.json
└── Procfile
```

## Local Setup

```bash
npm install
cp .env.example .env
npm start
```

- App: `http://localhost:3000`
- API endpoint: `http://localhost:3000/bfhl`

### Required Environment Variables

- `FULL_NAME` (example: `Aditya Sharma`)
- `DOB_DDMMYYYY` (example: `11032004`)
- `EMAIL_ID`
- `COLLEGE_ROLL_NUMBER`
- `PORT` (optional, defaults to `3000`)

`user_id` is generated automatically from env as `fullname_ddmmyyyy`.

## API Contract

### Request

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response Fields

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary` (`total_trees`, `total_cycles`, `largest_tree_root`)

## Validation and Processing Rules Implemented

- Strict edge validation (`X->Y`, uppercase `A-Z`, `X !== Y`) after trimming.
- Invalid items are returned in `invalid_entries`.
- Duplicate exact edges are deduplicated for construction and returned once in `duplicate_edges`.
- Multi-parent conflicts: first parent wins; later parent edges are ignored.
- Multiple independent groups supported.
- Root selection:
  - node never appearing as child
  - if none exists (pure cycle), lexicographically smallest node
- Cycle groups return:
  - `{"root":"...","tree":{},"has_cycle":true}`
  - no `depth` for cyclic groups
- Non-cyclic trees include `depth` as longest root-to-leaf node count.
- Summary generation:
  - `total_trees`, `total_cycles`, `largest_tree_root`
  - tie on depth resolved by lexicographically smaller root

## Sample Test Cases

### 1) Basic tree

Input:
```json
{"data":["A->B","A->C","B->D"]}
```

Expected highlights:
- `total_trees = 1`
- `total_cycles = 0`
- `largest_tree_root = "A"`
- tree depth `3`

### 2) Duplicate edges

Input:
```json
{"data":["A->B","A->B","A->B"]}
```

Expected highlights:
- `duplicate_edges = ["A->B"]`
- tree constructed once from first edge

### 3) Pure cycle

Input:
```json
{"data":["A->B","B->C","C->A"]}
```

Expected highlights:
- one hierarchy with `has_cycle: true` and `tree: {}`
- no `depth` in that hierarchy

### 4) Mixed invalid + multi-parent

Input:
```json
{"data":["A->B","C->B","hello"," AB->C "," A->D ","A->A","A-> ","A-B"]}
```

Expected highlights:
- `C->B` ignored (B already has parent A)
- `" AB->C "` becomes valid after trim
- invalid examples listed in `invalid_entries`

## Frontend

- Input area accepts comma/newline separated values.
- Submit button sends `POST /bfhl`.
- Response is shown in readable cards + raw JSON.
- API failures show clear status message.

## Deployment (Vercel Recommended)

This project now supports Vercel-native deployment with:

- static frontend from `public/`
- serverless API function at `/api/bfhl`
- rewrite so public endpoint remains `POST /bfhl`

### 1) Import Repository in Vercel

- Create project from your GitHub repo in Vercel dashboard.
- Framework preset: `Other`.
- Build command: leave empty.
- Output directory: leave empty.

### 2) Add Environment Variables in Vercel

Set these in Project Settings -> Environment Variables:

- `FULL_NAME`
- `DOB_DDMMYYYY`
- `EMAIL_ID`
- `COLLEGE_ROLL_NUMBER`

### 3) Redeploy

- Trigger a new deploy (or push latest commit).
- Vercel will use `vercel.json` rewrite:
  - `/bfhl` -> `/api/bfhl`

### 4) Verify in Production

- Open your Vercel domain and submit sample edges in UI.
- Test endpoint directly:

```bash
curl -X POST "https://<your-vercel-domain>/bfhl" \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D"]}'
```

You should receive JSON with:

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary`

## Submission Checklist

1. Public GitHub repository URL
2. Frontend URL (live)
3. Backend API Base URL (base only)
4. Confirm:
   - frontend loads correctly
   - backend responds to `POST /bfhl`
   - CORS enabled
