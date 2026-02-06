const { Client } = require("pg");

async function crearUsuario() {
  const client = new Client({
    connectionString:
      "postgresql://postgres:Martingarrix123%23@db.ycqvfvhuaapjtuzbjuzp.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Conectado...");

    const email = "admin@licoreria.com";
    const password = "admin123456";

    const result = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      [email]
    );

    if (result.rows.length > 0) {
      console.log("Usuario ya existe:", result.rows[0].id);
      return;
    }

    const userId = await client.query(`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        '${email}',
        crypt('${password}', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
      ) RETURNING id
    `);

    const uid = userId.rows[0].id;
    console.log("Usuario creado:", uid);

    await client.query(`
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        '${uid}',
        '${uid}',
        jsonb_build_object('sub', '${uid}', 'email', '${email}'),
        'email',
        now(),
        now(),
        now()
      )
    `);

    console.log("Identidad creada");
    console.log("\\nCredenciales:");
    console.log("  Email:", email);
    console.log("  Password:", password);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

crearUsuario();
