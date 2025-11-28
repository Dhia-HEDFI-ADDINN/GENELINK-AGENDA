import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    // Create default tenant
    const tenantId = '11111111-1111-1111-1111-111111111111';
    
    // Create roles
    console.log('📦 Creating roles...');
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrateur', hierarchy_level: 100, is_system: true },
      { name: 'ADMIN_TENANT', description: 'Administrateur Tenant', hierarchy_level: 80, is_system: true },
      { name: 'ADMIN_AGENCE', description: 'Administrateur Agence/Réseau', hierarchy_level: 60, is_system: true },
      { name: 'ADMIN_CT', description: 'Responsable Centre', hierarchy_level: 50, is_system: true },
      { name: 'CONTROLEUR', description: 'Contrôleur Technique', hierarchy_level: 30, is_system: true },
      { name: 'CALL_CENTER', description: 'Agent Call Center', hierarchy_level: 30, is_system: true },
      { name: 'CLIENT', description: 'Client', hierarchy_level: 10, is_system: true },
    ];
    
    const roleIds: Record<string, string> = {};
    
    for (const role of roles) {
      const existing = await dataSource.query(
        `SELECT id FROM roles WHERE name = $1`,
        [role.name]
      );
      
      if (existing.length === 0) {
        const result = await dataSource.query(
          `INSERT INTO roles (id, name, description, hierarchy_level, is_system, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
           RETURNING id`,
          [role.name, role.description, role.hierarchy_level, role.is_system]
        );
        roleIds[role.name] = result[0].id;
        console.log(`  ✅ Created role: ${role.name}`);
      } else {
        roleIds[role.name] = existing[0].id;
        console.log(`  ⏭️  Role exists: ${role.name}`);
      }
    }
    
    // Create test users
    console.log('\n👥 Creating test users...');
    const users = [
      {
        email: 'admin@sgs-france.fr',
        password: 'Admin123!',
        nom: 'Admin',
        prenom: 'SGS',
        role: 'ADMIN_TENANT',
        description: 'Admin SGS Global'
      },
      {
        email: 'gestionnaire@securitest.fr',
        password: 'Gestionnaire123!',
        nom: 'Gestionnaire',
        prenom: 'Réseau',
        role: 'ADMIN_AGENCE',
        description: 'Gestionnaire Réseau'
      },
      {
        email: 'responsable@centre-paris.fr',
        password: 'Responsable123!',
        nom: 'Responsable',
        prenom: 'Centre',
        role: 'ADMIN_CT',
        description: 'Responsable Centre'
      },
      {
        email: 'controleur@centre-paris.fr',
        password: 'Controleur123!',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'CONTROLEUR',
        description: 'Contrôleur'
      },
      {
        email: 'agent@callcenter.sgs.fr',
        password: 'Agent123!',
        nom: 'Agent',
        prenom: 'CallCenter',
        role: 'CALL_CENTER',
        description: 'Agent Call Center'
      },
      {
        email: 'client@test.fr',
        password: 'Client123!',
        nom: 'Test',
        prenom: 'Client',
        role: 'CLIENT',
        description: 'Client Test'
      },
    ];
    
    for (const user of users) {
      const existing = await dataSource.query(
        `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
        [user.email, tenantId]
      );
      
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(user.password, 12);
        
        const result = await dataSource.query(
          `INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, actif, email_verified, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, true, NOW(), NOW())
           RETURNING id`,
          [tenantId, user.email, passwordHash, user.nom, user.prenom]
        );
        
        const userId = result[0].id;
        const roleId = roleIds[user.role];
        
        // Assign role to user
        await dataSource.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, roleId]
        );
        
        console.log(`  ✅ Created user: ${user.email} (${user.description}) - Password: ${user.password}`);
      } else {
        console.log(`  ⏭️  User exists: ${user.email}`);
      }
    }
    
    console.log('\n✨ Seed completed successfully!');
    console.log('\n📋 Test Users Summary:');
    console.log('┌────────────────────────────────┬────────────────────┬─────────────────────┐');
    console.log('│ Email                          │ Password           │ Role                │');
    console.log('├────────────────────────────────┼────────────────────┼─────────────────────┤');
    for (const user of users) {
      console.log(`│ ${user.email.padEnd(30)} │ ${user.password.padEnd(18)} │ ${user.role.padEnd(19)} │`);
    }
    console.log('└────────────────────────────────┴────────────────────┴─────────────────────┘');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
