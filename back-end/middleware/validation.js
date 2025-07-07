const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
};

const validateRequired = (fields, body) => {
    const missing = [];
    fields.forEach(field => {
        if (!body[field] || body[field].toString().trim() === '') {
            missing.push(field);
        }
    });
    return missing;
};

const validateUserRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    
    const missing = validateRequired(['username', 'email', 'password'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: `Champs requis manquants: ${missing.join(', ')}`
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide'
        });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({
            error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
    }

    if (!validateUsername(username)) {
        return res.status(400).json({
            error: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères (lettres, chiffres, underscore uniquement)'
        });
    }

    next();
};

const validateUserLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    const missing = validateRequired(['email', 'password'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: `Champs requis manquants: ${missing.join(', ')}`
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide'
        });
    }

    next();
};

const validateUserUpdate = (req, res, next) => {
    const { username, email } = req.body;
    
    if (email && !validateEmail(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide'
        });
    }

    if (username && !validateUsername(username)) {
        return res.status(400).json({
            error: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères (lettres, chiffres, underscore uniquement)'
        });
    }

    next();
};

const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    const missing = validateRequired(['currentPassword', 'newPassword'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: `Champs requis manquants: ${missing.join(', ')}`
        });
    }

    if (!validatePassword(newPassword)) {
        return res.status(400).json({
            error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({
            error: 'Le nouveau mot de passe doit être différent de l\'ancien'
        });
    }

    next();
};

const validateWorkspaceCreation = (req, res, next) => {
    const { name } = req.body;
    
    const missing = validateRequired(['name'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: 'Le nom du workspace est requis'
        });
    }

    if (name.length < 3 || name.length > 100) {
        return res.status(400).json({
            error: 'Le nom du workspace doit contenir entre 3 et 100 caractères'
        });
    }

    next();
};

const validateWorkspaceUpdate = (req, res, next) => {
    const { name, description } = req.body;
    
    if (name && (name.length < 3 || name.length > 100)) {
        return res.status(400).json({
            error: 'Le nom du workspace doit contenir entre 3 et 100 caractères'
        });
    }

    if (description && description.length > 500) {
        return res.status(400).json({
            error: 'La description ne peut pas dépasser 500 caractères'
        });
    }

    next();
};

const validateMemberAdd = (req, res, next) => {
    const { userId, role } = req.body;
    
    const missing = validateRequired(['userId'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: 'L\'ID de l\'utilisateur est requis'
        });
    }

    if (isNaN(userId)) {
        return res.status(400).json({
            error: 'ID utilisateur invalide'
        });
    }

    if (role && !['owner', 'member'].includes(role)) {
        return res.status(400).json({
            error: 'Rôle invalide (owner ou member autorisés)'
        });
    }

    next();
};

const validateListCreation = (req, res, next) => {
    const { name, workspaceId } = req.body;
    
    const missing = validateRequired(['name', 'workspaceId'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: `Champs requis manquants: ${missing.join(', ')}`
        });
    }

    if (name.length < 1 || name.length > 100) {
        return res.status(400).json({
            error: 'Le nom de la liste doit contenir entre 1 et 100 caractères'
        });
    }

    if (isNaN(workspaceId)) {
        return res.status(400).json({
            error: 'ID workspace invalide'
        });
    }

    next();
};

const validateListUpdate = (req, res, next) => {
    const { name } = req.body;
    
    if (name && (name.length < 1 || name.length > 100)) {
        return res.status(400).json({
            error: 'Le nom de la liste doit contenir entre 1 et 100 caractères'
        });
    }

    next();
};

const validateTodoCreation = (req, res, next) => {
    const { title, listId } = req.body;
    
    const missing = validateRequired(['title', 'listId'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: `Champs requis manquants: ${missing.join(', ')}`
        });
    }

    if (title.length < 1 || title.length > 255) {
        return res.status(400).json({
            error: 'Le titre doit contenir entre 1 et 255 caractères'
        });
    }

    if (isNaN(listId)) {
        return res.status(400).json({
            error: 'ID liste invalide'
        });
    }

    next();
};

const validateTodoUpdate = (req, res, next) => {
    const { title, description, assignedTo, dueDate } = req.body;
    
    if (title && (title.length < 1 || title.length > 255)) {
        return res.status(400).json({
            error: 'Le titre doit contenir entre 1 et 255 caractères'
        });
    }

    if (description && description.length > 1000) {
        return res.status(400).json({
            error: 'La description ne peut pas dépasser 1000 caractères'
        });
    }

    if (assignedTo && isNaN(assignedTo)) {
        return res.status(400).json({
            error: 'ID utilisateur assigné invalide'
        });
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return res.status(400).json({
            error: 'Format de date invalide (YYYY-MM-DD attendu)'
        });
    }

    next();
};

const validateTodoMove = (req, res, next) => {
    const { listId } = req.body;
    
    const missing = validateRequired(['listId'], req.body);
    if (missing.length > 0) {
        return res.status(400).json({
            error: 'L\'ID de la liste de destination est requis'
        });
    }

    if (isNaN(listId)) {
        return res.status(400).json({
            error: 'ID liste invalide'
        });
    }

    next();
};

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateRequired,
    validateUserRegistration,
    validateUserLogin,
    validateUserUpdate,
    validatePasswordChange,
    validateWorkspaceCreation,
    validateWorkspaceUpdate,
    validateMemberAdd,
    validateListCreation,
    validateListUpdate,
    validateTodoCreation,
    validateTodoUpdate,
    validateTodoMove
};
