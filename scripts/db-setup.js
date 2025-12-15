/**
 * Script de configuración de la base de datos
 * Ejecuta el schema inicial y los datos de prueba
 * 
 * Uso: node scripts/db-setup.js
 */

require('dotenv').config()

const { createClient } = require('@libsql/client')
const fs = require('fs')
const path = require('path')

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl || !authToken) {
    console.error('❌ Error: Faltan las credenciales de Turso')
    console.error('   Asegúrate de tener TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env')
    process.exit(1)
}

const db = createClient({
    url: databaseUrl,
    authToken: authToken,
})

async function runMigration() {
    console.log('🚀 Iniciando configuración de la base de datos...\n')

    try {
        // Leer el archivo de migración inicial
        const migrationPath = path.join(__dirname, '../db/migrations/001_initial_schema.sql')
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

        // Eliminar comentarios y dividir por punto y coma
        const cleanSQL = migrationSQL
            .replace(/--.*$/gm, '') // Eliminar comentarios de línea
            .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios de bloque

        const statements = cleanSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 5) // Filtrar statements vacíos o muy cortos

        console.log(`📝 Ejecutando ${statements.length} statements de migración...\n`)

        for (const statement of statements) {
            try {
                await db.execute(statement)
                // Mostrar solo las primeras palabras del statement
                const preview = statement.substring(0, 50).replace(/\n/g, ' ').replace(/\s+/g, ' ')
                console.log(`   ✓ ${preview}...`)
            } catch (error) {
                // Ignorar errores de "ya existe"
                if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
                    const preview = statement.substring(0, 30).replace(/\n/g, ' ')
                    console.log(`   ⏭️  Ya existe: ${preview}...`)
                } else {
                    console.error(`   ⚠️  Error: ${error.message}`)
                }
            }
        }

        console.log('\n✅ Migración ejecutada correctamente\n')

    } catch (error) {
        console.error('❌ Error al leer el archivo de migración:', error.message)
        process.exit(1)
    }
}

async function runSeed() {
    console.log('🌱 Ejecutando datos de prueba (seed)...\n')

    try {
        // Verificar si ya hay datos
        const usuarios = await db.execute('SELECT COUNT(*) as count FROM usuarios')
        if (usuarios.rows[0].count > 0) {
            console.log('   ⏭️  Ya existen datos en la base de datos, saltando seed.\n')
            return
        }

        // Leer el archivo de seed
        const seedPath = path.join(__dirname, '../db/seed.sql')
        const seedSQL = fs.readFileSync(seedPath, 'utf-8')

        // Eliminar comentarios y dividir en statements
        const cleanSQL = seedSQL
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')

        const statements = cleanSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 5)

        console.log(`📝 Ejecutando ${statements.length} statements de seed...\n`)

        for (const statement of statements) {
            try {
                await db.execute(statement)
                const preview = statement.substring(0, 50).replace(/\n/g, ' ').replace(/\s+/g, ' ')
                console.log(`   ✓ ${preview}...`)
            } catch (error) {
                console.error(`   ⚠️  Error: ${error.message}`)
            }
        }

        console.log('\n✅ Datos de prueba insertados\n')

    } catch (error) {
        console.error('❌ Error al ejecutar seed:', error.message)
    }
}

async function verifySetup() {
    console.log('🔍 Verificando configuración...\n')

    try {
        const usuarios = await db.execute('SELECT COUNT(*) as count FROM usuarios')
        const tickets = await db.execute('SELECT COUNT(*) as count FROM tickets')
        const interacciones = await db.execute('SELECT COUNT(*) as count FROM interacciones')

        console.log(`   📊 Usuarios: ${usuarios.rows[0].count}`)
        console.log(`   📊 Tickets: ${tickets.rows[0].count}`)
        console.log(`   📊 Interacciones: ${interacciones.rows[0].count}`)

        console.log('\n✅ Base de datos configurada correctamente!\n')
        console.log('🎉 Puedes iniciar la aplicación con: pnpm dev\n')

    } catch (error) {
        console.error('❌ Error al verificar:', error.message)
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════')
    console.log('   🗄️  Sistema de Tickets - Setup de Base de Datos   ')
    console.log('═══════════════════════════════════════════════════\n')

    await runMigration()
    await runSeed()
    await verifySetup()
}

main().catch(console.error)
