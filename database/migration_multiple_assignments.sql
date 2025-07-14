-- Migration pour supporter les assignations multiples sur les todos
-- Cette migration crée une nouvelle table todo_assignments et migre les données existantes

BEGIN;

-- 1. Créer la nouvelle table todo_assignments
CREATE TABLE IF NOT EXISTS todo_assignments (
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (todo_id, user_id)
);

-- 2. Créer les index pour la nouvelle table
CREATE INDEX IF NOT EXISTS idx_todo_assignments_todo ON todo_assignments(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_assignments_user ON todo_assignments(user_id);

-- 3. Migrer les assignations existantes de la colonne assigned_to vers la nouvelle table
INSERT INTO todo_assignments (todo_id, user_id, assigned_at)
SELECT id, assigned_to, created_at
FROM todos
WHERE assigned_to IS NOT NULL
ON CONFLICT (todo_id, user_id) DO NOTHING;

-- 4. Optionnel: Supprimer la colonne assigned_to (décommentez si vous voulez la supprimer définitivement)
-- ALTER TABLE todos DROP COLUMN IF EXISTS assigned_to;

COMMIT;

-- Note: La colonne assigned_to est conservée pour la compatibilité pendant la transition
-- Une fois que tout le code frontend/backend utilise la nouvelle table, 
-- vous pourrez supprimer cette colonne en décommentant la ligne ci-dessus