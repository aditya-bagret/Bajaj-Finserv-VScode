# SRM Full Stack Engineering Challenge

Full-stack implementation using **Node.js + JavaScript**:
- Backend: Express REST API at `POST /bfhl`
- Frontend: Single-page UI to submit node entries and view formatted API responses

## Run locally

```bash
npm install
npm start
```

App runs at `http://localhost:3000`  
API endpoint: `http://localhost:3000/bfhl`

## API contract

### Request

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response fields

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary`

`summary` includes:
- `total_trees`
- `total_cycles`
- `largest_tree_root`

## Deployment checklist

1. Deploy backend (Render/Railway/Fly/Heroku or similar).
2. Deploy frontend (Vercel/Netlify/GitHub Pages with API URL pointing to backend).
3. Verify frontend can successfully call hosted `/bfhl`.
4. Submit:
   - Hosted API base URL
   - Hosted frontend URL
   - Public GitHub repository URL
