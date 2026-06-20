# MediaMTX Scalability & CRUD Project

This  demonstrates  MediaMTX setup using an **Origin-Edge architecture** for high scalability and a custom **API Manager** for dynamic stream management.

##  Architecture

- **MediaMTX Origin**: The primary ingest point. All streams should be published here.
- **MediaMTX Edges**: Multiple replica nodes that pull streams from the Origin on-demand. This reduces load on the Origin and scales viewership.
- **API Manager**: A Node.js middleware that wraps the MediaMTX REST API for easy CRUD operations on paths.

##  Quick Start

1. **Start the environment**:
   ```powershell
   docker-compose down
   docker-compose up -d --build
   ```

2. **Publish a stream**:
   Use FFmpeg or OBS to push to the Origin:
   `rtmp://localhost:1935/mystream` (Auth: `admin` / `admin`)

3. **Watch the stream (from Edge)**:
   Access the stream from one of the edge replicas:
   - **Edge 1**: `http://localhost:8889/mystream/`
   - **Edge 2**: `http://localhost:8890/mystream/`

## 🛠️ API Reference (CRUD)

The API Manager runs on port **3000** and provides the following endpoints:

| Action | Method | URL | Description |
| :--- | :--- | :--- | :--- |
| **List Paths** | `GET` | `/manager/paths` | Retrieve all configured paths |
| **Create Path** | `POST` | `/manager/paths` | Add a new path dynamically |
| **Update Path** | `PATCH` | `/manager/paths/:id` | Update path configuration (e.g. `record: true`) |
| **Delete Path** | `DELETE` | `/manager/paths/:id` | Remove a path |
| **Sessions** | `GET` | `/manager/sessions` | View active viewers/publishers |

### Sample JSON for Creating a Path
```json
{
  "name": "my_new_stream",
  "source": "publisher",
  "record": true
}
```

##  Authentication
- **API & Stream Auth**: `admin` / `admin`
- The API Manager is pre-configured to use these credentials when talking to MediaMTX.

