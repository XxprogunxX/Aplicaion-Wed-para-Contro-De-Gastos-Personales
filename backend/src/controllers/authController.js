const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const { createAuthSession, clearSessionCookie } = require('../lib/authSession');
const { getClientIp } = require('../middleware/rateLimit');

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getPublicSupabaseKey() {
	return (
		process.env.SUPABASE_ANON_KEY ||
		process.env.SUPABASE_PUBLISHABLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
		''
	);
}

function createUserScopedSupabaseClient(accessToken) {
	const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
	const publicKey = String(getPublicSupabaseKey() || '').trim();
	const token = String(accessToken || '').trim();

	if (!supabaseUrl || !publicKey || !token) {
		return null;
	}

	return createClient(supabaseUrl, publicKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	});
}

function isRowLevelSecurityError(error) {
	const code = String(error?.code || '').trim();
	const normalizedMessage = String(error?.message || '').toLowerCase();

	return code === '42501' || normalizedMessage.includes('row-level security');
}

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

function shouldReturnTokenInBody() {
	return String(process.env.AUTH_RETURN_TOKEN_BODY || 'true').toLowerCase() !== 'false';
}

function deviceInfoFromRequest(req) {
	const fromBody = req.body?.device_info;
	if (fromBody && String(fromBody).trim()) {
		return String(fromBody).trim().slice(0, 2048);
	}
	const ua = req.headers['user-agent'];
	return ua ? String(ua).slice(0, 2048) : '';
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

async function ensureUsuarioProfile(user, rawPassword, options = {}) {
	if (!isSupabaseConfigured) {
		return;
	}

	const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
	const accessToken = String(options.accessToken || '').trim();
	const scopedClient = createUserScopedSupabaseClient(accessToken);

	// Sin service role ni sesion del usuario no se puede cumplir RLS desde backend.
	if (!hasServiceRole && !scopedClient) {
		return;
	}

	const passwordHash = user.passwordHash || bcrypt.hashSync(String(rawPassword || randomUUID()), 10);

	const profilePayload = {
		id: String(user.id),
		email: normalizeEmail(user.email),
		username: user.username || normalizeEmail(user.email).split('@')[0],
		password: passwordHash,
	};

	async function writeProfile(profileClient, useUpsert) {
		const profileQuery = useUpsert
			? profileClient.from('usuarios').upsert(profilePayload, { onConflict: 'id' })
			: profileClient.from('usuarios').insert(profilePayload);

		return profileQuery.select('id').limit(1).maybeSingle();
	}

	let profileWriteMode = hasServiceRole ? 'service-role' : 'scoped-user';
	let profileResult = hasServiceRole
		? await writeProfile(supabase, true)
		: await writeProfile(scopedClient, false);

	// Si la supuesta service role no tiene bypass RLS, reintentar como usuario autenticado.
	if (
		profileResult.error &&
		profileWriteMode === 'service-role' &&
		scopedClient &&
		isRowLevelSecurityError(profileResult.error)
	) {
		profileResult = await writeProfile(scopedClient, false);
		profileWriteMode = 'scoped-user';
	}

	if (profileResult.error) {
		// Si ya existe perfil, no lo tratamos como error.
		if (profileResult.error.code === '23505') {
			return;
		}

		// No bloqueamos auth por politicas RLS del perfil (puede variar entre ambientes).
		if (isRowLevelSecurityError(profileResult.error)) {
			return;
		}

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
			await ensureUsuarioProfile(localUser, String(password), {
				accessToken: authResult.data?.session?.access_token,
			});

			const sessionResult = await createAuthSession(res, {
				userId: localUser.id,
				email: localUser.email,
				username: localUser.username,
				deviceInfo: deviceInfoFromRequest(req),
				ipAddress: getClientIp(req),
			});

			if (sessionResult.error || !sessionResult.token) {
				clearSessionCookie(res);
				return res.status(503).json({
					error: true,
					message: 'Usuario creado pero no se pudo abrir sesión',
					status: 503,
				});
			}

			const regPayload = {
				error: false,
				message: 'Usuario registrado correctamente',
				data: {
					user: sanitizeUser(localUser),
				},
			};
			if (shouldReturnTokenInBody()) {
				regPayload.data.token = sessionResult.token;
			}

			return res.status(201).json(regPayload);
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

		const sessionResult = await createAuthSession(res, {
			userId: newUser.id,
			email: newUser.email,
			username: newUser.username,
			deviceInfo: deviceInfoFromRequest(req),
			ipAddress: getClientIp(req),
		});

		if (sessionResult.error || !sessionResult.token) {
			clearSessionCookie(res);
			return res.status(503).json({
				error: true,
				message: 'Usuario creado pero no se pudo abrir sesión',
				status: 503,
			});
		}

		const regPayloadLocal = {
			error: false,
			message: 'Usuario registrado correctamente',
			data: {
				user: sanitizeUser(newUser),
			},
		};
		if (shouldReturnTokenInBody()) {
			regPayloadLocal.data.token = sessionResult.token;
		}

		return res.status(201).json(regPayloadLocal);
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
	getProfile,
};
