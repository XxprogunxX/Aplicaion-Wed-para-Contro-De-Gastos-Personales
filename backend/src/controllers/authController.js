const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const users = [
	{
		id: DEMO_USER_ID,
		username: 'Usuario Demo',
		email: 'demo@gastos.app',
		passwordHash: bcrypt.hashSync('123456', 10),
		createdAt: new Date().toISOString(),
	},
];

function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeUser(user) {
	return {
		id: user.id,
		username: user.username,
		email: user.email,
		createdAt: user.createdAt,
	};
}

function issueToken(user) {
	return jwt.sign(
		{
			sub: String(user.id),
			id: user.id,
			email: user.email,
			username: user.username,
		},
		JWT_SECRET,
		{ expiresIn: '12h' }
	);
}

function findUserByEmail(email) {
	return users.find((item) => item.email === email);
}

function upsertLocalUser(user) {
	const existingIndex = users.findIndex((item) => String(item.id) === String(user.id));

	if (existingIndex >= 0) {
		users[existingIndex] = {
			...users[existingIndex],
			...user,
		};
		return users[existingIndex];
	}

	users.push(user);
	return user;
}

function toLocalUserFromSupabase(supabaseUser, fallbackUsername) {
	const metadataUsername = supabaseUser?.user_metadata?.username;
	const inferredUsername = metadataUsername || fallbackUsername || 'Usuario';

	return {
		id: supabaseUser.id,
		username: inferredUsername,
		email: normalizeEmail(supabaseUser.email),
		passwordHash: '',
		createdAt: supabaseUser.created_at || new Date().toISOString(),
	};
}

function isEmailAlreadyRegisteredError(errorMessage) {
	const normalized = String(errorMessage || '').toLowerCase();
	return (
		normalized.includes('already') ||
		normalized.includes('exists') ||
		normalized.includes('registered')
	);
}

async function ensureUsuarioProfile(user, rawPassword) {
	if (!isSupabaseConfigured) {
		return;
	}

	const passwordHash = user.passwordHash || bcrypt.hashSync(String(rawPassword || randomUUID()), 10);

	const profilePayload = {
		id: String(user.id),
		email: normalizeEmail(user.email),
		username: user.username || normalizeEmail(user.email).split('@')[0],
		password: passwordHash,
	};

	const profileResult = await supabase
		.from('usuarios')
		.upsert(profilePayload, { onConflict: 'id' })
		.select('id')
		.limit(1)
		.maybeSingle();

	if (profileResult.error) {
		const profileError = new Error(
			profileResult.error.message || 'No se pudo sincronizar perfil de usuario'
		);

		if (profileResult.error.code === '23505') {
			profileError.status = 409;
		}

		throw profileError;
	}
}

async function register(req, res) {
	try {
		const { username, email, password } = req.body || {};
		const normalizedEmail = normalizeEmail(email);
		const safeUsername = String(username || '').trim();

		if (!safeUsername || !normalizedEmail || !password) {
			return res.status(400).json({
				error: true,
				message: 'username, email y password son requeridos',
				status: 400,
			});
		}

		if (!isValidEmail(normalizedEmail)) {
			return res.status(400).json({
				error: true,
				message: 'Formato de email inválido',
				status: 400,
			});
		}

		if (String(password).length < 6) {
			return res.status(400).json({
				error: true,
				message: 'La contraseña debe tener al menos 6 caracteres',
				status: 400,
			});
		}

		if (isSupabaseConfigured) {
			const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

			let authResult;
			if (hasServiceRole && supabase?.auth?.admin?.createUser) {
				authResult = await supabase.auth.admin.createUser({
					email: normalizedEmail,
					password: String(password),
					email_confirm: true,
					user_metadata: { username: safeUsername },
				});
			} else {
				authResult = await supabase.auth.signUp({
					email: normalizedEmail,
					password: String(password),
					options: {
						data: { username: safeUsername },
					},
				});
			}

			if (authResult.error) {
				if (isEmailAlreadyRegisteredError(authResult.error.message)) {
					return res.status(409).json({
						error: true,
						message: 'Ya existe un usuario con ese email',
						status: 409,
					});
				}

				return res.status(400).json({
					error: true,
					message: authResult.error.message || 'No se pudo registrar el usuario',
					status: 400,
				});
			}

			const supabaseUser = authResult.data?.user;
			if (!supabaseUser) {
				return res.status(500).json({
					error: true,
					message: 'No se pudo crear el usuario en autenticación',
					status: 500,
				});
			}

			const localUser = upsertLocalUser(toLocalUserFromSupabase(supabaseUser, safeUsername));
			await ensureUsuarioProfile(localUser, String(password));

			return res.status(201).json({
				error: false,
				message: 'Usuario registrado correctamente',
				data: {
					token: issueToken(localUser),
					user: sanitizeUser(localUser),
				},
			});
		}

		const alreadyExists = users.some((user) => user.email === normalizedEmail);
		if (alreadyExists) {
			return res.status(409).json({
				error: true,
				message: 'Ya existe un usuario con ese email',
				status: 409,
			});
		}

		const newUser = {
			id: randomUUID(),
			username: safeUsername,
			email: normalizedEmail,
			passwordHash: bcrypt.hashSync(String(password), 10),
			createdAt: new Date().toISOString(),
		};

		users.push(newUser);

		return res.status(201).json({
			error: false,
			message: 'Usuario registrado correctamente',
			data: {
				token: issueToken(newUser),
				user: sanitizeUser(newUser),
			},
		});
	} catch (error) {
		if (Number(error?.status) === 409) {
			return res.status(409).json({
				error: true,
				message: 'Ya existe un usuario con ese email o nombre de usuario',
				status: 409,
			});
		}

		return res.status(500).json({
			error: true,
			message: error?.message || 'Error interno al registrar usuario',
			status: 500,
		});
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body || {};
		const normalizedEmail = normalizeEmail(email);

		if (!normalizedEmail || !password) {
			return res.status(400).json({
				error: true,
				message: 'email y password son requeridos',
				status: 400,
			});
		}

		if (isSupabaseConfigured) {
			const authResult = await supabase.auth.signInWithPassword({
				email: normalizedEmail,
				password: String(password),
			});

			if (!authResult.error && authResult.data?.user) {
				const localUser = upsertLocalUser(
					toLocalUserFromSupabase(authResult.data.user, normalizedEmail.split('@')[0])
				);
				await ensureUsuarioProfile(localUser, String(password));

				return res.json({
					error: false,
					message: 'Inicio de sesión correcto',
					data: {
						token: issueToken(localUser),
						user: sanitizeUser(localUser),
					},
				});
			}
		}

		const user = findUserByEmail(normalizedEmail);
		const validPassword = user?.passwordHash
			? bcrypt.compareSync(String(password), user.passwordHash)
			: false;

		if (!user || !validPassword) {
			return res.status(401).json({
				error: true,
				message: 'Credenciales inválidas',
				status: 401,
			});
		}

		return res.json({
			error: false,
			message: 'Inicio de sesión correcto',
			data: {
				token: issueToken(user),
				user: sanitizeUser(user),
			},
		});
	} catch (error) {
		return res.status(500).json({
			error: true,
			message: error?.message || 'Error interno al iniciar sesión',
			status: 500,
		});
	}
}

function logout(_req, res) {
	return res.json({
		error: false,
		message: 'Sesión cerrada correctamente',
		data: { success: true },
	});
}

function getProfile(req, res) {
	const authenticatedUserId = req.user?.id;
	const user = users.find((item) => String(item.id) === String(authenticatedUserId));

	if (!user) {
		return res.json({
			error: false,
			message: 'Perfil obtenido correctamente',
			data: {
				id: String(req.user?.id || ''),
				username: req.user?.username || 'Usuario',
				email: req.user?.email || '',
				createdAt: new Date().toISOString(),
			},
		});
	}

	return res.json({
		error: false,
		message: 'Perfil obtenido correctamente',
		data: sanitizeUser(user),
	});
}

module.exports = {
	register,
	login,
	logout,
	getProfile,
};
