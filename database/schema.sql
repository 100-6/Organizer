-- =============================================
-- SCHÉMA SQL FINAL - TODO APP TYPE TRELLO
-- =============================================

DROP TABLE IF EXISTS todo_labels CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. TABLE USERS
-- =============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. TABLE WORKSPACES
-- =============================================
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. TABLE WORKSPACE_MEMBERS
-- =============================================
CREATE TABLE workspace_members (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'member', 'viewer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);

-- =============================================
-- 4. TABLE WORKSPACE_INVITATIONS
-- =============================================
CREATE TABLE workspace_invitations (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('editor', 'member', 'viewer')),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 5. TABLE LISTS
-- =============================================
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. TABLE LABELS
-- =============================================
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    color VARCHAR(7) NOT NULL,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, workspace_id)
);

-- =============================================
-- 7. TABLE TODOS
-- =============================================
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    due_time TIME,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. TABLE TODO_LABELS
-- =============================================
CREATE TABLE todo_labels (
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
    assigned_order INTEGER DEFAULT 0,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (todo_id, label_id)
);

-- =============================================
-- 9. TABLE TODO_ASSIGNMENTS
-- =============================================
CREATE TABLE todo_assignments (
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (todo_id, user_id)
);

-- =============================================
-- 10. TABLE CHECKLIST_ITEMS
-- =============================================
CREATE TABLE checklist_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 11. INDEX ESSENTIELS
-- =============================================
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_status ON workspace_invitations(status);
CREATE INDEX idx_lists_workspace ON lists(workspace_id);
CREATE INDEX idx_labels_workspace ON labels(workspace_id);
CREATE INDEX idx_todos_list ON todos(list_id);
CREATE INDEX idx_todos_assigned ON todos(assigned_to);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todo_labels_todo ON todo_labels(todo_id);
CREATE INDEX idx_todo_labels_label ON todo_labels(label_id);
CREATE INDEX idx_todo_assignments_todo ON todo_assignments(todo_id);
CREATE INDEX idx_todo_assignments_user ON todo_assignments(user_id);
CREATE INDEX idx_checklist_items_todo ON checklist_items(todo_id);

-- =============================================
-- 11. LABELS PAR DÉFAUT (en dur)
-- =============================================

CREATE TABLE default_labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    color VARCHAR(7) NOT NULL,
    label_type VARCHAR(20) DEFAULT 'color' CHECK (label_type IN ('color', 'named'))
);

-- =============================================
-- 12. UTILISATEUR PAR DÉFAUT
-- =============================================
INSERT INTO users (username, email, password_hash) VALUES 
('Penisus', 'penisus@bite.fr', '$2b$12$OMFptonPZVf0zZ.sFlUVyOmH8aB6jWF0VNaODPFSiYnqoeaCRNgNu');
INSERT INTO users (username, email, password_hash) VALUES 
('Bite', 'bite@bite.fr', '$2b$12$XQA2gLmwFMdnXmAdIlQXC.DJuDeQfBqwSkjhBYm4FtHwUky31CWii');